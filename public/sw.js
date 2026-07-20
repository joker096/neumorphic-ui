/**
 * Messanger Service Worker
 * 
 * Strategies:
 * - Cache-first for app shell (index.html, assets)
 * - Stale-while-new for API calls
 * - Network-first with cache fallback for chat data
 * - Offline page fallback
 * - IndexedDB offline message queue
 * - Push notifications
 * - Background sync
 * - Online/Offline status tracking
 */

const CACHE_VERSION = 'v6';
const APP_CACHE = `messanger-app-${CACHE_VERSION}`;
const DATA_CACHE = `messanger-data-${CACHE_VERSION}`;
const QUEUE_IDB = 'messanger-queue-v2';
const QUEUE_STORE = 'pendingMessages';

// Push subscription VAPID key
const PUSH_VAPID_KEY = '';

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

  function shouldCache(method) {
    return method === 'GET';
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
                  cache.put(request, networkResponse.clone());
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }
        try {
          const response = await fetch(request);
          if (shouldCache(request.method)) {
            cache.put(request, response.clone());
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

  // API calls: stale-while-new (serve cached if available, fetch in background)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          if (shouldCache(request.method)) {
            fetch(request, { cache: 'no-cache' })
              .then((freshResponse) => {
                if (freshResponse) {
                  cache.put(request, freshResponse.clone());
                }
              })
              .catch(() => {});
          }
          return cached;
        }
        return fetch(request).then((response) => {
          if (shouldCache(request.method)) {
            cache.put(request, response.clone());
          }
          return response;
        });
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
                  cache.put(request, networkResponse.clone());
                }
              })
              .catch(() => {});
          }
          return cached;
        }
        try {
          const response = await fetch(request);
          if (shouldCache(request.method)) {
            cache.put(request, response.clone());
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

// --- Push notifications ---
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'New message';
  const body = data.body || 'You have a new message';
  const icon = data.icon || '/icon-192.png';

  const clickAction = data.clickAction || '/';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      tag: data.tag || 'message',
      actions: data.actions || [],
      data: { url: clickAction },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const matchingClient = clients.find((c) => c.url === url);
      if (matchingClient) {
        return matchingClient.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});

self.addEventListener('notificationclose', () => {
  // Handle notification dismissed
});

// --- Sync: Background sync for queued messages ---
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(handleMessageSync());
  }
});

async function handleMessageSync() {
  const queued = await getQueuedMessages();
  const promises = queued.map(async (message) => {
    try {
      await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message.data),
      });
      await markMessageSent(message.id);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  });
  await Promise.all(promises);
}

// --- Message: Forward messages to service worker ---
self.addEventListener('message', (event) => {
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


