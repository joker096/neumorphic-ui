/**
 * IndexedDB persistence for P2P file transfers
 * Raw IDB (house pattern, cf. messageQueue.ts); memory fallback when IDB is unavailable
 */

import type { TransferMeta } from './frames';
import { sha256Hex } from './integrity';

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
  /** Chunks persisted locally (0..totalChunks). Persisted at start, per-chunk, and at end. */
  receivedChunks?: number;
  /** Integrity check failed on reassembly (declared sha256 does not match). */
  integrityError?: boolean;
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

/**
 * Age threshold: a transfer with no persisted activity for this long is abandoned.
 */
export const TRANSFER_ABANDON_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * GC for incoming transfers: delete incomplete transfers that went silent more
 * than maxAgeMs ago (receivedAt is touched on every chunk). Completed transfers
 * are kept — their blob may still be assembled by the UI long after the frames.
 */
export async function pruneAbandonedTransfers(maxAgeMs = TRANSFER_ABANDON_TIMEOUT_MS): Promise<number> {
  const now = Date.now();
  const metas = await listTransfers();
  let pruned = 0;
  for (const meta of metas) {
    if (!meta.completed && meta.receivedAt && now - meta.receivedAt > maxAgeMs) {
      await deleteTransfer(meta.transferId);
      pruned += 1;
    }
  }
  return pruned;
}

/**
 * Hard cap on total persisted transfer bytes (meta + chunks). When the store
 * exceeds this, the oldest transfers are evicted (completed first, then oldest).
 */
export const FILE_TRANSFER_MAX_TOTAL_BYTES = 256 * 1024 * 1024;

/** Completed transfers are kept this long after receipt, then garbage-collected. */
export const FILE_TRANSFER_COMPLETED_RETENTION_MS = 24 * 60 * 60 * 1000;

/** Maximum incoming transfers accepted concurrently (meta frames in flight). */
export const MAX_CONCURRENT_INCOMING_TRANSFERS = 4;

/**
 * GC for completed transfers: delete completed transfers received more than
 * maxAgeMs ago (their blob has been handed to the chat message long ago).
 */
export async function pruneCompletedTransfers(maxAgeMs: number = FILE_TRANSFER_COMPLETED_RETENTION_MS): Promise<number> {
  const now = Date.now();
  const metas = await listTransfers();
  let pruned = 0;
  for (const meta of metas) {
    if (meta.completed && meta.receivedAt && now - meta.receivedAt > maxAgeMs) {
      await deleteTransfer(meta.transferId);
      pruned += 1;
    }
  }
  return pruned;
}

/**
 * Acceptance check: would persisting `size` more bytes (plus the new meta)
 * keep the store under maxBytes? Errors (e.g. IDB unavailable mid-scan)
 * fail open — a single transfer should not be rejected for store issues.
 */
export async function canAcceptFileTransfer(size: number, maxBytes: number = FILE_TRANSFER_MAX_TOTAL_BYTES): Promise<boolean> {
  try {
    const metas = await listTransfers();
    const total = metas.reduce((sum, m) => sum + (m.size || 0), 0);
    return total + size <= maxBytes;
  } catch {
    return true;
  }
}

/**
 * Evict transfers until the persisted byte total fits under maxBytes.
 * Completed transfers are evicted first (oldest receivedAt first); incomplete
 * transfers are only evicted if no completed ones remain. Returns evicted count.
 */
export async function enforceFileTransferBudget(maxBytes: number = FILE_TRANSFER_MAX_TOTAL_BYTES): Promise<number> {
  let metas = await listTransfers();
  let evicted = 0;
  const totalBytes = (list: StoredTransfer[]) => list.reduce((sum, m) => sum + (m.size || 0), 0);
  while (totalBytes(metas) > maxBytes && metas.length > 0) {
    const completed = metas.filter((m) => m.completed)
      .sort((a, b) => (a.receivedAt || 0) - (b.receivedAt || 0));
    const victim = completed[0] || metas.filter((m) => !m.completed)
      .sort((a, b) => (a.receivedAt || 0) - (b.receivedAt || 0))[0];
    if (!victim) break;
    await deleteTransfer(victim.transferId);
    evicted += 1;
    metas = metas.filter((m) => m.transferId !== victim.transferId);
  }
  return evicted;
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

/**
 * Page-level blob URL cache for `ftr1:` P2P transfers (shared across
 * thumbnails and the chat message row). URLs are intentionally never revoked.
 */
const ftrBlobCache = new Map<string, { url: string; shaOk: boolean }>();

/**
 * Resolve a completed `ftr1:` transfer to a cached blob URL.
 * Returns null while the transfer is incomplete or missing — callers poll.
 * Integrity mismatch is reported via `shaOk` (thumbnail may still render).
 */
export async function resolveFtrBlobUrl(transferId: string): Promise<{ url: string; shaOk: boolean } | null> {
  const cached = ftrBlobCache.get(transferId);
  if (cached) return cached;
  const meta = await getTransferMeta(transferId);
  if (!meta || !meta.completed) return null;
  const blob = await getTransferBlob(transferId, meta.totalChunks);
  if (!blob) return null;
  let shaOk = true;
  if (meta.sha256) {
    try {
      shaOk = (await sha256Hex(await blob.arrayBuffer())) === meta.sha256;
    } catch {
      shaOk = false;
    }
  }
  const entry = { url: URL.createObjectURL(blob), shaOk };
  ftrBlobCache.set(transferId, entry);
  return entry;
}

/** Polling cadence for `ftr1:` transfers still assembling (cf. AttachmentMedia). */
export const FTR_POLL_MS = 500;
export const FTR_POLL_MAX = 60;

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
