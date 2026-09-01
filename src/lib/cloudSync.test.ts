import { describe, it, expect, vi, beforeEach } from 'vitest';

const idbStore = new Map<string, any>();

vi.mock('./idb', () => ({
  get: vi.fn(async (key: string) => idbStore.get(key)),
  set: vi.fn(async (key: string, value: any) => {
    idbStore.set(key, value);
  }),
}));

import * as cloudSync from './cloudSync';
import { STORAGE_KEYS } from '../constants/storage';

describe('cloudSync', () => {
  beforeEach(() => {
    idbStore.clear();
    vi.restoreAllMocks();
  });

  it('loadCloudSyncMeta returns null when absent', async () => {
    expect(await cloudSync.loadCloudSyncMeta()).toBeNull();
  });

  it('loadCloudSyncMeta normalizes a persisted meta object', async () => {
    idbStore.set(STORAGE_KEYS.CLOUD_SYNC_META, {
      enabled: true,
      lastSync: 123,
      pendingChanges: 4,
      status: 'syncing',
      errorMessage: 'boom',
      provider: 'gdrive',
    });
    const meta = await cloudSync.loadCloudSyncMeta();
    expect(meta).toEqual({
      enabled: true,
      lastSync: 123,
      pendingChanges: 4,
      status: 'syncing',
      errorMessage: 'boom',
      provider: 'gdrive',
    });
  });

  it('loadCloudSyncMeta coerces invalid values to safe defaults', async () => {
    idbStore.set(STORAGE_KEYS.CLOUD_SYNC_META, {
      enabled: 'yes',
      lastSync: 'nope',
      pendingChanges: 'x',
      status: 'garbage',
    });
    const meta = await cloudSync.loadCloudSyncMeta();
    expect(meta).toEqual({
      enabled: true,
      lastSync: null,
      pendingChanges: 0,
      status: 'idle',
      errorMessage: null,
      provider: 'local',
    });
  });

  it('loadCloudSyncMeta returns null for non-object data', async () => {
    idbStore.set(STORAGE_KEYS.CLOUD_SYNC_META, 'string');
    expect(await cloudSync.loadCloudSyncMeta()).toBeNull();
  });

  it('saveCloudSyncMeta persists via idb.set', async () => {
    await cloudSync.saveCloudSyncMeta({ enabled: true, lastSync: 5, pendingChanges: 0, status: 'idle', errorMessage: null, provider: 'local' });
    expect(idbStore.get(STORAGE_KEYS.CLOUD_SYNC_META)).toEqual({ enabled: true, lastSync: 5, pendingChanges: 0, status: 'idle', errorMessage: null, provider: 'local' });
  });

  it('saveCloudSyncSnapshot writes versioned payload', async () => {
    await cloudSync.saveCloudSyncSnapshot({ chats: [{ id: 1 }], contacts: [], channels: [], callHistory: [] });
    const stored = idbStore.get(STORAGE_KEYS.CLOUD_SYNC_SNAPSHOT);
    expect(stored.version).toBe(cloudSync.SNAPSHOT_VERSION);
    expect(typeof stored.savedAt).toBe('number');
    expect(stored.chats).toEqual([{ id: 1 }]);
  });

  it('loadCloudSyncSnapshot returns null when version mismatches', async () => {
    idbStore.set(STORAGE_KEYS.CLOUD_SYNC_SNAPSHOT, { version: 999, chats: [] });
    expect(await cloudSync.loadCloudSyncSnapshot()).toBeNull();
  });

  it('loadCloudSyncSnapshot returns matching snapshot', async () => {
    idbStore.set(STORAGE_KEYS.CLOUD_SYNC_SNAPSHOT, { version: cloudSync.SNAPSHOT_VERSION, chats: [], contacts: [1] });
    const snap = await cloudSync.loadCloudSyncSnapshot();
    expect(snap?.contacts).toEqual([1]);
  });

  it('withRetry returns result on first success', async () => {
    const fn = vi.fn(async () => 'ok');
    expect(await cloudSync.withRetry(fn)).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('withRetry retries then propagates the last error', async () => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => {
      throw new Error('flaky');
    });
    const p = cloudSync.withRetry(fn, 3);
    const assertion = expect(p).rejects.toThrow('flaky');
    await vi.advanceTimersByTimeAsync(500 + 1000);
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('withRetry recovers after a transient failure', async () => {
    vi.useFakeTimers();
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new Error('once');
      return 'recovered';
    });
    const p = cloudSync.withRetry(fn, 3);
    await vi.advanceTimersByTimeAsync(500);
    await expect(p).resolves.toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
