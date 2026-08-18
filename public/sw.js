/**
 * Messanger Service Worker
 * 
 * Strategies:
 * - Cache-first for app shell (index.html, assets)
 * - Stale-while-new for API calls
 * - Network-first with cache fallback for chat data
 * - Offline page fallback
 * - IndexedDB offline message queue
 * - Background sync
 * - Online/Offline status tracking
 */

const CACHE_VERSION = 'v8';
const APP_CACHE = `messanger-app-${CACHE_VERSION}`;
const DATA_CACHE = `messanger-data-${CACHE_VERSION}`;
const QUEUE_IDB = 'messanger-queue-v2';
const QUEUE_STORE = 'pendingMessages';

// App shell assets to precache on install
const APP_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
  '/icon.svg',
];

// --- IndexedDB message queue (unified with messageQueue.ts) ---
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUEUE_IDB, 2);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { autoIncrement: true });
      }
      // Migrate from old schema (v1, no autoIncrement, no retryCount)
      if (!db.objectStoreNames.contains('pendingMessages_old')) {
        db.createObjectStore('pendingMessages_old');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function migrateOldQueue() {
  return new Promise((resolve) => {
    const oldReq = indexedDB.open('messanger-queue', 1);
    oldReq.onsuccess = () => {
      const oldDb = oldReq.result;
      if (!oldDb.objectStoreNames.contains('pendingMessages')) {
        oldDb.close();
        resolve();
        return;
      }
      const tx = oldDb.transaction('pendingMessages', 'readonly');
      const oldStore = tx.objectStore('pendingMessages');
      const getAllReq = oldStore.getAll();
      getAllReq.onsuccess = () => {
        const oldMessages = getAllReq.result || [];
        if (oldMessages.length === 0) { resolve(); return; }
      getAllReq.onerror = () => resolve();
        // Get current queue
        openQueueDB().then((db) => {
          const tx = db.transaction(QUEUE_STORE, 'readwrite');
          const store = tx.objectStore(QUEUE_STORE);
          oldMessages.forEach((msg) => {
            if (!msg.sent) {
              store.add({
                id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                data: msg.data,
                timestamp: msg.timestamp || Date.now(),
                sent: false,
                retryCount: 0,
              });
            }
          });
        }).finally(() => resolve());
      };
    };
    oldReq.onerror = () => resolve();
  });
}

function addToQueue(message) {
  openQueueDB().then((db) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    store.add({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      data: message,
      timestamp: Date.now(),
      sent: false,
      retryCount: 0,
    });
  }).catch(console.error);
}

function getQueuedMessages() {
  return openQueueDB().then((db) => {
    return new Promise((resolve) => {
      const transaction = db.transaction(QUEUE_STORE, 'readonly');
      const store = transaction.objectStore(QUEUE_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const messages = (request.result || []).filter((m) => !m.sent);
        resolve(messages);
      };
      request.onerror = () => resolve([]);
    });
  });
}

function markMessageSent(id) {
  return openQueueDB().then((db) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.sent = true;
        store.put(item);
      }
    };
    request.onerror = () => {};
  });
}

// --- Online/Offline tracking ---
let isOnline = true;

function setOnlineStatus(online) {
  const previousState = isOnline;
  isOnline = online;
  
  // Post message to the window to notify about connectivity change
  try {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'connectivity-change', online });
      });
    });
  } catch (e) {
    // Clients may not be available in all contexts
  }
  
  if (online && previousState === false) {
    // Just came back online - trigger sync
    self.registration.sync.register('sync-messages').catch(() => {});
    // Also try to flush queue immediately
    handleMessageSync().catch(() => {});
  }
}

// Listen for online/offline events
self.addEventListener('online', () => setOnlineStatus(true));
self.addEventListener('offline', () => setOnlineStatus(false));

// --- Install: Cache the app shell ---
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(APP_CACHE).then((cache) => {
        return cache.addAll(APP_ASSETS);
      }),
      // Migrate old queue data to unified schema on install
      migrateOldQueue(),
    ])
  );
});

// --- Activate: Clean up old caches ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const toDelete = keys.filter((k) => !k.includes(CACHE_VERSION));
      return Promise.all(toDelete.map((k) => caches.delete(k)));
    })
  );
});

// --- Fetch: Smart caching strategies ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP(S) requests (chrome-extension://, chrome://, about://, file://, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // NEVER intercept cross-origin requests. A service worker can otherwise see
  // any HTTP request the page makes (other origins too) and intercept it,
  // which is what we want to avoid.
  if (url.origin !== self.location.origin) {
    return;
  }

  function shouldCache(method) {
    return method === 'GET';
  }

  // Cache API rejects partial (206) and other non-2xx responses. Only cache
  // full, successful responses, and never let a failed put reject the promise.
  function safeCachePut(cache, request, response) {
    try {
      if (!response || response.status !== 200) return;
      const putPromise = cache.put(request, response.clone());
      if (putPromise && typeof putPromise.catch === 'function') {
        putPromise.catch(() => {});
      }
    } catch (e) {
      /* ignore cache write failures */
    }
  }

  // App shell: cache-first with offline fallback
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      caches.open(APP_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          if (shouldCache(request.method)) {
            fetch(request, { cache: 'no-cache' })
              .then((networkResponse) => {
                if (networkResponse) {
                  safeCachePut(cache, request, networkResponse);
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }
        try {
          const response = await fetch(request);
          if (shouldCache(request.method)) {
            safeCachePut(cache, request, response);
          }
          return response;
        } catch {
          return caches.match('/offline.html');
        }
      })
    );
    return;
  }

  // Offline page: serve directly
  if (url.pathname === '/offline.html') {
    event.respondWith(
      caches.open(APP_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        return cached || new Response('You are offline', {
          status: 408,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // API calls: network-only. NEVER cache authenticated responses —
  // stale auth tokens, contact lists, or chat history in cache storage
  // is a credential-leak risk if the device is shared or compromised.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // No offline fallback for API: the app handles its own offline UX
        // via IndexedDB message queue.
        return new Response(JSON.stringify({ offline: true }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // ICQ stickers: cache-first with long TTL
  if (url.pathname.startsWith('/ICQ/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (shouldCache(request.method)) {
            safeCachePut(cache, request, response);
          }
          return response;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }

  // Static assets (JS, CSS, images): cache-first with network fallback
  if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/ws/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          if (shouldCache(request.method)) {
            fetch(request, { cache: 'no-cache' })
              .then((networkResponse) => {
                if (networkResponse) {
                  safeCachePut(cache, request, networkResponse);
                }
              })
              .catch(() => {});
          }
          return cached;
        }
        try {
          const response = await fetch(request);
          if (shouldCache(request.method)) {
            safeCachePut(cache, request, response);
          }
          return response;
        } catch {
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }
});

// --- Sync: Background sync for queued messages ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(notifyClientsToSync());
  }
});

async function notifyClientsToSync() {
  try {
    const allClients = await self.clients.matchAll();
    allClients.forEach((client) => {
      client.postMessage({ type: 'connectivity-change', online: true });
    });
  } catch {
    // noop
  }
}

// --- Message: Forward messages to service worker ---
self.addEventListener('message', (event) => {
  if (event.source) {
    let sourceUrl = '';
    try { sourceUrl = (event.source.url || '').toString(); } catch { sourceUrl = ''; }
    if (sourceUrl && !sourceUrl.startsWith(self.location.origin)) return;
  }
  if (event.data?.type === 'queueMessage') {
    addToQueue(event.data.message);
  } else if (event.data?.type === 'markSent') {
    markMessageSent(event.data.id);
  } else if (event.data?.type === 'checkOnline') {
    // Respond with current online status
    if (event.source) {
      event.source.postMessage({ type: 'checkOnline', online: isOnline });
    }
  }
});


