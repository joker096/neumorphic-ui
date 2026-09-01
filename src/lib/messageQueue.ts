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

export async function queueMessage(message: any): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(QUEUE_STORE, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.add({
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      data: message,
      timestamp: Date.now(),
      sent: false,
      retryCount: 0,
    });
    request.onsuccess = () => resolve(request.result as string);
    request.onerror = () => reject(request.error);
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
