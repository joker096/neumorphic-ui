const DB_NAME = 'mess-anger-recordings';
const STORE_NAME = 'blobs';
const DB_VERSION = 1;

class RecordingStorage {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      request.onerror = () => {
        console.error('recording-storage: Failed to open DB:', request.error);
        reject(request.error);
      };
    });
  }

  async saveBlob(id: string, blob: Blob): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getBlob(id: string): Promise<Blob | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBlob(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getStorageInfo(): Promise<{ used: number; quota: number | null }> {
    let used = 0;
    try {
      const db = await this.open();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const cursorReq = store.openCursor();
      await new Promise<void>((resolve, reject) => {
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (cursor) {
            used += (cursor.value as Blob).size;
            cursor.continue();
          } else resolve();
        };
        cursorReq.onerror = () => reject(cursorReq.error);
      });
    } catch (e) {
      console.error('recording-storage: getStorageInfo error:', e);
    }
    let quota: number | null = null;
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      quota = est.quota ?? null;
    }
    return { used, quota };
  }
}

export const recordingStorage = new RecordingStorage();
