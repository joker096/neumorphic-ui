/**
 * IndexedDB persistence for P2P file transfers
 * Raw IDB (house pattern, cf. messageQueue.ts); memory fallback when IDB is unavailable
 */

import type { TransferMeta } from './frames';

const DB_NAME = 'messanger-filetransfers';
const DB_VERSION = 1;
const META_STORE = 'transfers';
const CHUNK_STORE = 'chunks';

const hasIdb = typeof indexedDB !== 'undefined';

const memoryMetas = new Map<string, StoredTransfer>();
const memoryChunks = new Map<string, ArrayBuffer>();

export interface StoredTransfer extends TransferMeta {
  receivedAt?: number;
  completed?: boolean;
  /** Chunks persisted locally (0..totalChunks). Persisted only at start/end, not per-chunk. */
  receivedChunks?: number;
}

function chunkKey(transferId: string, index: number): string {
  return `${transferId}:${index}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBRequest).result;
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'transferId' });
      }
      if (!db.objectStoreNames.contains(CHUNK_STORE)) {
        db.createObjectStore(CHUNK_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Create the schema (no-op when it exists). Safe to call at app boot. */
export async function initFileTransferDb(): Promise<void> {
  if (!hasIdb) return;
  const db = await openDb();
  db.close();
}

export async function saveTransferMeta(meta: StoredTransfer): Promise<void> {
  if (!hasIdb) {
    memoryMetas.set(meta.transferId, meta);
    return;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put(meta);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getTransferMeta(transferId: string): Promise<StoredTransfer | undefined> {
  if (!hasIdb) return memoryMetas.get(transferId);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(META_STORE, 'readonly').objectStore(META_STORE).get(transferId);
    request.onsuccess = () => resolve(request.result as StoredTransfer | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function listTransfers(): Promise<StoredTransfer[]> {
  if (!hasIdb) return Array.from(memoryMetas.values());
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(META_STORE, 'readonly').objectStore(META_STORE).getAll();
    request.onsuccess = () => resolve((request.result || []) as StoredTransfer[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveChunk(transferId: string, index: number, data: ArrayBuffer): Promise<void> {
  if (!hasIdb) {
    memoryChunks.set(chunkKey(transferId, index), data);
    return;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CHUNK_STORE, 'readwrite');
    tx.objectStore(CHUNK_STORE).put(data, chunkKey(transferId, index));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getChunk(transferId: string, index: number): Promise<ArrayBuffer | undefined> {
  if (!hasIdb) return memoryChunks.get(chunkKey(transferId, index));
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(CHUNK_STORE, 'readonly').objectStore(CHUNK_STORE).get(chunkKey(transferId, index));
    request.onsuccess = () => resolve(request.result as ArrayBuffer | undefined);
    request.onerror = () => reject(request.error);
  });
}

/** Assemble the full blob from stored chunks; null when a chunk is missing. */
export async function getTransferBlob(transferId: string, totalChunks: number): Promise<Blob | null> {
  const parts: BlobPart[] = [];
  for (let i = 0; i < totalChunks; i += 1) {
    const chunk = await getChunk(transferId, i);
    if (!chunk) return null;
    parts.push(chunk);
  }
  return new Blob(parts);
}

/** Remove a transfer's meta and all its chunks. */
export async function deleteTransfer(transferId: string): Promise<void> {
  if (!hasIdb) {
    memoryMetas.delete(transferId);
    for (const key of Array.from(memoryChunks.keys())) {
      if (key.startsWith(`${transferId}:`)) memoryChunks.delete(key);
    }
    return;
  }
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([META_STORE, CHUNK_STORE], 'readwrite');
    tx.objectStore(META_STORE).delete(transferId);
    const keysRequest = tx.objectStore(CHUNK_STORE).getAllKeys();
    keysRequest.onsuccess = () => {
      for (const key of keysRequest.result || []) {
        if (typeof key === 'string' && key.startsWith(`${transferId}:`)) {
          tx.objectStore(CHUNK_STORE).delete(key);
        }
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
