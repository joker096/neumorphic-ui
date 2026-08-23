const DB_NAME = 'mess-anger-recordings';
const BLOB_STORE = 'blobs';
const META_STORE = 'meta';
const DB_VERSION = 2;

export interface RecordingMeta {
  id: string;
  callType: 'audio' | 'video' | 'group_audio' | 'group_video' | 'huddle' | 'voice_memo';
  createdAt: number;
  fileSize: number;
  blobId: string;
}

class RecordingStorage {
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(BLOB_STORE)) {
          db.createObjectStore(BLOB_STORE);
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: 'id' });
        }
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
      const tx = db.transaction(BLOB_STORE, 'readwrite');
      tx.objectStore(BLOB_STORE).put(blob, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getBlob(id: string): Promise<Blob | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readonly');
      const req = tx.objectStore(BLOB_STORE).get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBlob(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BLOB_STORE, 'readwrite');
      tx.objectStore(BLOB_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveRecording(meta: RecordingMeta, blob: Blob): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([BLOB_STORE, META_STORE], 'readwrite');
      tx.objectStore(BLOB_STORE).put(blob, meta.blobId);
      tx.objectStore(META_STORE).put(meta);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async listRecordings(): Promise<RecordingMeta[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).getAll();
      req.onsuccess = () => resolve((req.result as RecordingMeta[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteRecording(id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([BLOB_STORE, META_STORE], 'readwrite');
      const metaStore = tx.objectStore(META_STORE);
      const getReq = metaStore.get(id);
      getReq.onsuccess = () => {
        const meta = getReq.result as RecordingMeta | undefined;
        if (meta) tx.objectStore(BLOB_STORE).delete(meta.blobId);
        metaStore.delete(id);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Delete recordings (blob + meta) older than `days`. `days <= 0` is a no-op.
   * Returns the number of recordings removed.
   */
  async deleteOlderThan(days: number): Promise<number> {
    if (!days || days <= 0) return 0;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const all = await this.listRecordings();
    const stale = all.filter((r) => r.createdAt < cutoff);
    if (stale.length === 0) return 0;
    for (const r of stale) {
      await this.deleteRecording(r.id).catch(() => {});
    }
    return stale.length;
  }

  async clear(): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([BLOB_STORE, META_STORE], 'readwrite');
      tx.objectStore(BLOB_STORE).clear();
      tx.objectStore(META_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getStorageInfo(): Promise<{ used: number; quota: number | null }> {
    let used = 0;
    try {
      const db = await this.open();
      const tx = db.transaction(BLOB_STORE, 'readonly');
      const store = tx.objectStore(BLOB_STORE);
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
