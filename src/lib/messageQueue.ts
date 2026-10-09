/**
 * Message queue for offline-first messaging
 * Stores messages in IndexedDB and sends them when online
 */

const QUEUE_IDB = 'messanger-queue-v2';
const QUEUE_STORE = 'pendingMessages';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUEUE_IDB, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBRequest).result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Cap on queued (unsent) messages: the oldest unsent item is evicted before a new one is added. */
export const MAX_QUEUE_ITEMS = 100;

export async function queueMessage(message: any, maxItems: number = MAX_QUEUE_ITEMS): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const valuesReq = store.getAll();
    const keysReq = store.getAllKeys();
    let valuesDone = false;
    let keysDone = false;
    let all: any[] = [];
    let keys: unknown[] = [];
    let done = false;
    const finish = () => {
      if (!valuesDone || !keysDone) return;
      if (done) return;
      done = true;
      const limit = Math.max(1, maxItems);
      const unsent: Array<{ item: any; key: IDBValidKey }> = [];
      all.forEach((item: any, idx: number) => {
        if (!item.sent) unsent.push({ item, key: keys[idx] as IDBValidKey });
      });
      unsent.sort((a, b) => (a.item.timestamp || 0) - (b.item.timestamp || 0));
      while (unsent.length >= limit) {
        const oldest = unsent.shift();
        if (oldest) store.delete(oldest.key);
      }
      const request = store.add({
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        data: message,
        timestamp: Date.now(),
        sent: false,
        retryCount: 0,
      });
      request.onsuccess = () => resolve(request.result as string);
      request.onerror = () => reject(request.error);
    };
    valuesReq.onsuccess = () => {
      all = valuesReq.result || [];
      valuesDone = true;
      finish();
    };
    keysReq.onsuccess = () => {
      keys = keysReq.result || [];
      keysDone = true;
      finish();
    };
    valuesReq.onerror = () => reject(valuesReq.error);
    keysReq.onerror = () => reject(keysReq.error);
  });
}

export async function getPendingMessages(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve) => {
    const transaction = db.transaction(QUEUE_STORE, 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const messages = (request.result || []).filter((m: any) => !m.sent);
      resolve(messages);
    };
    request.onerror = () => resolve([]);
  });
}

export async function markMessageSent(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const valuesReq = store.getAll();
    const keysReq = store.getAllKeys();
    let valuesDone = false;
    let keysDone = false;
    let all: any[] = [];
    let keys: unknown[] = [];
    const tryFinish = () => {
      if (!valuesDone || !keysDone) return;
      const idx = all.findIndex((m: any) => m.id === id);
      if (idx !== -1) {
        store.put({ ...all[idx], sent: true }, keys[idx] as IDBValidKey);
      }
      resolve();
    };
    valuesReq.onsuccess = () => {
      all = valuesReq.result || [];
      valuesDone = true;
      tryFinish();
    };
    keysReq.onsuccess = () => {
      keys = keysReq.result || [];
      keysDone = true;
      tryFinish();
    };
    valuesReq.onerror = () => reject(valuesReq.error);
    keysReq.onerror = () => reject(keysReq.error);
  });
}

export async function removeQueuedMessage(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const valuesReq = store.getAll();
    const keysReq = store.getAllKeys();
    let valuesDone = false;
    let keysDone = false;
    let all: any[] = [];
    let keys: unknown[] = [];
    const tryFinish = () => {
      if (!valuesDone || !keysDone) return;
      const idx = all.findIndex((m: any) => m.id === id);
      if (idx !== -1) {
        store.delete(keys[idx] as IDBValidKey);
      }
      resolve();
    };
    valuesReq.onsuccess = () => {
      all = valuesReq.result || [];
      valuesDone = true;
      tryFinish();
    };
    keysReq.onsuccess = () => {
      keys = keysReq.result || [];
      keysDone = true;
      tryFinish();
    };
    valuesReq.onerror = () => reject(valuesReq.error);
    keysReq.onerror = () => reject(keysReq.error);
  });
}

/**
 * Unsent queue items older than this are considered abandoned (device was
 * offline past the horizon, or the message was superseded) and are pruned
 * instead of being flushed months later.
 */
export const QUEUE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Maximum number of retry attempts per queued message before it fails. */
export const MAX_QUEUE_RETRIES = 5;

/** Base delay of the exponential retry backoff for a queued item. */
export const QUEUE_RETRY_BASE_MS = 5_000;
/** Upper bound of the exponential retry backoff for a queued item. */
export const QUEUE_RETRY_MAX_MS = 5 * 60_000;

/**
 * Delay that must elapse since the last failed attempt before a queued item is
 * retried again. Grows as `base * 2^retryCount`, capped at `QUEUE_RETRY_MAX_MS`.
 */
export function queueBackoffMs(retryCount: number): number {
  const n = Math.max(0, Math.floor(Number(retryCount) || 0));
  return Math.min(QUEUE_RETRY_MAX_MS, QUEUE_RETRY_BASE_MS * 2 ** n);
}

export async function pruneExpiredQueuedMessages(maxAgeMs: number = QUEUE_MAX_AGE_MS): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const valuesReq = store.getAll();
    const keysReq = store.getAllKeys();
    let valuesDone = false;
    let keysDone = false;
    let all: any[] = [];
    let keys: unknown[] = [];
    let pruned = 0;
    const tryFinish = () => {
      if (!valuesDone || !keysDone) return;
      const cutoff = Date.now() - maxAgeMs;
      all.forEach((m: any, idx: number) => {
        if (!m.sent && m.timestamp && m.timestamp < cutoff) {
          store.delete(keys[idx] as IDBValidKey);
          pruned += 1;
        }
      });
      resolve(pruned);
    };
    valuesReq.onsuccess = () => {
      all = valuesReq.result || [];
      valuesDone = true;
      tryFinish();
    };
    keysReq.onsuccess = () => {
      keys = keysReq.result || [];
      keysDone = true;
      tryFinish();
    };
    valuesReq.onerror = () => reject(valuesReq.error);
    keysReq.onerror = () => reject(keysReq.error);
  });
}

export async function retryMessage(message: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const valuesReq = store.getAll();
    const keysReq = store.getAllKeys();
    let valuesDone = false;
    let keysDone = false;
    let all: any[] = [];
    let keys: unknown[] = [];
    const tryFinish = () => {
      if (!valuesDone || !keysDone) return;
      const idx = all.findIndex((m: any) => m.id === message.id);
      if (idx !== -1) {
        const item = { ...all[idx] };
        item.retryCount = (item.retryCount || 0) + 1;
        item.lastRetry = Date.now();
        store.put(item, keys[idx] as IDBValidKey);
      }
      resolve();
    };
    valuesReq.onsuccess = () => {
      all = valuesReq.result || [];
      valuesDone = true;
      tryFinish();
    };
    keysReq.onsuccess = () => {
      keys = keysReq.result || [];
      keysDone = true;
      tryFinish();
    };
    valuesReq.onerror = () => reject(valuesReq.error);
    keysReq.onerror = () => reject(keysReq.error);
  });
}

export async function clearPendingMessages(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
