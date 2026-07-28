/**
 * Message Queue — IndexedDB-based offline message persistence
 * Stores unsent messages when network is unavailable and retries automatically.
 */

const DB_NAME = 'mess-message-queue';
const DB_VERSION = 3;
const STORE_NAME = 'messages';
const MAX_QUEUED = 1000;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Obfuscate sensitive metadata before storing */
function obfuscateMetadata(recipient: string, sender: string): { recipient: string; sender: string } {
   try {
     const recipientObf = btoa(recipient).split('').reverse().join('')
     const senderObf = btoa(sender).split('').reverse().join('')
     return { recipient: recipientObf, sender: senderObf }
   } catch {
     return { recipient, sender }
   }
 }

let db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (evt) => {
      const database = (evt.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME);
        store.createIndex('recipient', 'recipient');
        store.createIndex('timestamp', 'timestamp');
        store.createIndex('status', 'status');
      }
    };
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enforce queue limits by removing oldest messages if over MAX_QUEUED.
 * Returns true if space is available.
 */
async function enforceMaxQueued(): Promise<boolean> {
  const store = await openDB();
  return new Promise((resolve) => {
    const tx = store.transaction([STORE_NAME], 'readonly');
    const objectStore = tx.objectStore(STORE_NAME);
    const request = objectStore.getAll();
    request.onsuccess = () => {
      const all = (request.result || []) as any[];
      if (all.length < MAX_QUEUED) {
        resolve(true);
        return;
      }
      // Sort by timestamp ascending (oldest first) and remove oldest until under limit
      const sorted = all.sort((a: any, b: any) => a.timestamp - b.timestamp);
      const toRemove = sorted.slice(0, sorted.length - MAX_QUEUED);
      const rwTx = store.transaction([STORE_NAME], 'readwrite');
      for (const item of toRemove) {
        rwTx.objectStore(STORE_NAME).delete(item.id);
      }
      rwTx.oncomplete = () => resolve(true);
      rwTx.onerror = () => resolve(true);
    };
  });
}

/**
 * Queue a message for later delivery (enforces MAX_QUEUED limit).
 */
export async function queueMessage(envelope: any): Promise<void> {
  // Enforce queue limit
  await enforceMaxQueued();

  const store = await openDB();
  // Obfuscate metadata before storing
  const obfuscated = obfuscateMetadata(envelope.recipient, envelope.sender);
  const item: any = {
    id: `${envelope.sender}-${envelope.timestamp}-${Math.random().toString(36).slice(2, 9)}`,
    envelope,
    recipient: obfuscated.recipient,
    sender: obfuscated.sender,
    timestamp: envelope.timestamp,
    status: 'pending' as const,
    attempts: 0,
    queuedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = store.transaction([STORE_NAME], 'readwrite');
    const objectStore = tx.objectStore(STORE_NAME);
    objectStore.add(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all pending messages in the queue
 */
export async function getQueuedMessages(): Promise<any[]> {
  const store = await openDB();
  return new Promise((resolve) => {
    const tx = store.transaction([STORE_NAME], 'readonly');
    const objectStore = tx.objectStore(STORE_NAME);
    const request = objectStore.index('status').getAll('pending');
    request.onsuccess = () => resolve((request.result || []) as any[]);
    request.onerror = () => resolve([]);
  });
}

/**
 * Remove a message from the queue after successful send
 */
export async function removeMessage(id: string): Promise<void> {
  const store = await openDB();
  return new Promise((resolve, reject) => {
    const tx = store.transaction([STORE_NAME], 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Mark a message as sent
 */
export async function markSent(id: string): Promise<void> {
  const store = await openDB();
  return new Promise((resolve, reject) => {
    const tx = store.transaction([STORE_NAME], 'readwrite');
    const objectStore = tx.objectStore(STORE_NAME);
    const request = objectStore.get(id);
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.status = 'sent';
        item.sentAt = Date.now();
        objectStore.put(item);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark a message as failed with error details
 */
export async function markFailed(id: string, error: string): Promise<void> {
  const store = await openDB();
  return new Promise((resolve, reject) => {
    const tx = store.transaction([STORE_NAME], 'readwrite');
    const objectStore = tx.objectStore(STORE_NAME);
    const request = objectStore.get(id);
    request.onsuccess = () => {
      const item = request.result;
      if (item) {
        item.status = 'failed';
        item.error = error;
        item.attempts = (item.attempts || 0) + 1;
        objectStore.put(item);
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clean up expired messages from the queue
 */
export async function cleanExpired(): Promise<void> {
  const store = await openDB();
  return new Promise((resolve) => {
    const tx = store.transaction([STORE_NAME], 'readwrite');
    const objectStore = tx.objectStore(STORE_NAME);
    const request = objectStore.index('timestamp').openCursor();
    request.onsuccess = () => {
      let cursor = request.result;
      const toDelete: string[] = [];
      while (cursor) {
        if (Date.now() - cursor.value.timestamp > MAX_AGE_MS) {
          toDelete.push(cursor.value.id);
        }
        cursor = (cursor as any).continue();
      }
      let count = 0;
      for (const id of toDelete) {
        objectStore.delete(id);
        count++;
      }
      if (count > 0) {
        console.warn(`[MessageQueue] Cleaned ${count} expired messages`);
      }
      resolve();
    };
  });
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{ pending: number; total: number }> {
  const store = await openDB();
  return new Promise((resolve) => {
    const tx = store.transaction([STORE_NAME], 'readonly');
    const objectStore = tx.objectStore(STORE_NAME);
    const request = objectStore.count();
    request.onsuccess = () => {
      const total = request.result;
      const pendingReq = objectStore.index('status').count('pending');
      pendingReq.onsuccess = () => resolve({
        pending: pendingReq.result,
        total,
      });
    };
  });
}
