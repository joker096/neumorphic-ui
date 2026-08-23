import * as idb from './idb';
import { STORAGE_KEYS } from '../constants/storage';
import type { CloudSyncState } from '../store/types';

export const SNAPSHOT_VERSION = 1;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

export interface CloudSyncSnapshot {
  version: number;
  savedAt: number;
  chats: any[];
  contacts: any[];
  channels: any[];
  callHistory: any[];
}

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < retries - 1) await sleep(BASE_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastError;
}

export async function loadCloudSyncMeta(): Promise<CloudSyncState | null> {
  const meta = await idb.get<CloudSyncState>(STORAGE_KEYS.CLOUD_SYNC_META);
  if (!meta || typeof meta !== 'object') return null;
  return {
    enabled: Boolean(meta.enabled),
    lastSync: typeof meta.lastSync === 'number' ? meta.lastSync : null,
    pendingChanges: typeof meta.pendingChanges === 'number' ? meta.pendingChanges : 0,
    status: meta.status === 'syncing' || meta.status === 'error' || meta.status === 'success' ? meta.status : 'idle',
    errorMessage: meta.errorMessage ?? null,
    provider: meta.provider ?? 'local',
  };
}

export async function saveCloudSyncMeta(meta: CloudSyncState): Promise<void> {
  await idb.set(STORAGE_KEYS.CLOUD_SYNC_META, meta);
}

export async function saveCloudSyncSnapshot(
  snapshot: Pick<CloudSyncSnapshot, 'chats' | 'contacts' | 'channels' | 'callHistory'>,
): Promise<void> {
  const payload: CloudSyncSnapshot = {
    version: SNAPSHOT_VERSION,
    savedAt: Date.now(),
    ...snapshot,
  };
  await withRetry(() => idb.set(STORAGE_KEYS.CLOUD_SYNC_SNAPSHOT, payload));
}

export async function loadCloudSyncSnapshot(): Promise<CloudSyncSnapshot | null> {
  const snapshot = await idb.get<CloudSyncSnapshot>(STORAGE_KEYS.CLOUD_SYNC_SNAPSHOT);
  if (!snapshot || snapshot.version !== SNAPSHOT_VERSION) return null;
  return snapshot;
}
