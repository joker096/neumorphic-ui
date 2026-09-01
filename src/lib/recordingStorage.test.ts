import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { recordingStorage } from './recordingStorage';
import type { RecordingMeta } from './recordingStorage';

// --- minimal in-memory IndexedDB fake (no fake-indexeddb dependency) ---

class FakeRequest {
  result: unknown;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
}

class FakeTx {
  oncomplete: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private pending = 0;
  private db: FakeDB;

  constructor(db: FakeDB) {
    this.db = db;
  }

  objectStore(name: string): FakeStore {
    const store = this.db.stores.get(name);
    if (!store) throw new Error(`unknown store: ${name}`);
    store.bind(this);
    return store;
  }

  begin(): void {
    this.pending += 1;
  }

  track(req: FakeRequest): FakeRequest {
    this.begin();
    queueMicrotask(() => {
      req.onsuccess?.();
      this.settle();
    });
    return req;
  }

  private settle(): void {
    this.pending -= 1;
    if (this.pending === 0) {
      queueMicrotask(() => this.oncomplete?.());
    }
  }
}

class FakeStore {
  data = new Map<unknown, unknown>();
  private activeTx: FakeTx | null = null;
  private keyPath?: string;

  constructor(keyPath?: string) {
    this.keyPath = keyPath;
  }

  bind(tx: FakeTx): void {
    this.activeTx = tx;
  }

  put(value: unknown, key?: unknown): FakeRequest {
    const k = key ?? (this.keyPath ? (value as Record<string, unknown>)[this.keyPath] : undefined);
    this.data.set(k, value);
    const req = new FakeRequest();
    req.result = k;
    return this.requireTx().track(req);
  }

  get(key: unknown): FakeRequest {
    const req = new FakeRequest();
    req.result = this.data.get(key);
    return this.requireTx().track(req);
  }

  delete(key: unknown): FakeRequest {
    this.data.delete(key);
    return this.requireTx().track(new FakeRequest());
  }

  getAll(): FakeRequest {
    const req = new FakeRequest();
    req.result = [...this.data.values()];
    return this.requireTx().track(req);
  }

  clear(): FakeRequest {
    this.data.clear();
    return this.requireTx().track(new FakeRequest());
  }

  openCursor(): FakeRequest {
    this.requireTx().begin();
    const req = new FakeRequest();
    const keys = [...this.data.keys()];
    let i = 0;
    const step = (): void => {
      queueMicrotask(() => {
        if (i < keys.length) {
          req.result = {
            value: this.data.get(keys[i]),
            continue: (): void => {
              i += 1;
              step();
            },
          };
        } else {
          req.result = null;
        }
        req.onsuccess?.();
      });
    };
    step();
    return req;
  }

  private requireTx(): FakeTx {
    if (!this.activeTx) throw new Error('store used outside a transaction');
    return this.activeTx;
  }
}

class FakeDB {
  stores = new Map<string, FakeStore>();

  get objectStoreNames(): { contains: (name: string) => boolean } {
    return { contains: (name: string) => this.stores.has(name) };
  }

  createObjectStore(name: string, options?: { keyPath?: string }): FakeStore {
    const store = new FakeStore(options?.keyPath);
    this.stores.set(name, store);
    return store;
  }

  transaction(_names: string | string[], _mode?: string): FakeTx {
    return new FakeTx(this);
  }
}

const dbs = new Map<string, FakeDB>();
const fakeIdb = {
  open(name: string, _version?: number) {
    const req: {
      result: FakeDB | undefined;
      onupgradeneeded: (() => void) | null;
      onsuccess: (() => void) | null;
      onerror: (() => void) | null;
    } = { result: undefined, onupgradeneeded: null, onsuccess: null, onerror: null };
    queueMicrotask(() => {
      let db = dbs.get(name);
      if (!db) {
        db = new FakeDB();
        dbs.set(name, db);
      }
      req.result = db;
      req.onupgradeneeded?.();
      req.onsuccess?.();
    });
    return req;
  },
};

function meta(id: string, createdAt: number, fileSize = 0): RecordingMeta {
  return { id, callType: 'audio', createdAt, fileSize, blobId: id };
}

describe('recordingStorage', () => {
  beforeAll(() => {
    vi.stubGlobal('indexedDB', fakeIdb);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    await recordingStorage.clear();
  });

  it('saveBlob stores the blob for later getBlob', async () => {
    const blob = new Blob(['abc']);
    await recordingStorage.saveBlob('id-1', blob);
    expect(await recordingStorage.getBlob('id-1')).toBe(blob);
  });

  it('getBlob returns null for a missing id', async () => {
    expect(await recordingStorage.getBlob('missing')).toBeNull();
  });

  it('deleteBlob removes the blob', async () => {
    await recordingStorage.saveBlob('id-2', new Blob(['x']));
    await recordingStorage.deleteBlob('id-2');
    expect(await recordingStorage.getBlob('id-2')).toBeNull();
  });

  it('saveRecording keeps blob and meta together', async () => {
    const blob = new Blob(['payload']);
    await recordingStorage.saveRecording(meta('r-1', Date.now(), 7), blob);
    expect(await recordingStorage.getBlob('r-1')).toBe(blob);
    const metas = await recordingStorage.listRecordings();
    expect(metas).toEqual([expect.objectContaining({ id: 'r-1', fileSize: 7 })]);
  });

  it('deleteRecording removes meta and blob', async () => {
    await recordingStorage.saveRecording(meta('r-2', 1), new Blob(['a']));
    await recordingStorage.deleteRecording('r-2');
    expect(await recordingStorage.listRecordings()).toEqual([]);
    expect(await recordingStorage.getBlob('r-2')).toBeNull();
  });

  it('deleteRecording resolves for a missing id', async () => {
    await expect(recordingStorage.deleteRecording('missing')).resolves.toBeUndefined();
  });

  it('deleteOlderThan with non-positive days is a no-op', async () => {
    await recordingStorage.saveRecording(meta('r-3', Date.now() - 9 * 86400000), new Blob(['old']));
    expect(await recordingStorage.deleteOlderThan(0)).toBe(0);
    expect(await recordingStorage.deleteOlderThan(-1)).toBe(0);
    expect(await recordingStorage.listRecordings()).toHaveLength(1);
  });

  it('deleteOlderThan removes only stale recordings', async () => {
    const now = Date.now();
    await recordingStorage.saveRecording(meta('r-old', now - 9 * 86400000), new Blob(['old']));
    await recordingStorage.saveRecording(meta('r-new', now - 3600000), new Blob(['new']));
    expect(await recordingStorage.deleteOlderThan(7)).toBe(1);
    expect(await recordingStorage.listRecordings()).toEqual([expect.objectContaining({ id: 'r-new' })]);
    expect(await recordingStorage.getBlob('r-old')).toBeNull();
    expect(await recordingStorage.getBlob('r-new')).not.toBeNull();
  });

  it('clear empties both stores', async () => {
    await recordingStorage.saveRecording(meta('r-4', 1), new Blob(['x']));
    await recordingStorage.clear();
    expect(await recordingStorage.listRecordings()).toEqual([]);
    expect(await recordingStorage.getBlob('r-4')).toBeNull();
  });

  it('getStorageInfo sums blob sizes', async () => {
    await recordingStorage.saveBlob('s-1', new Blob(['ab']));
    await recordingStorage.saveBlob('s-2', new Blob(['abcde']));
    if (navigator.storage && typeof navigator.storage.estimate === 'function') {
      vi.spyOn(navigator.storage, 'estimate').mockResolvedValue({ usage: 0, quota: null });
    }
    const info = await recordingStorage.getStorageInfo();
    expect(info.used).toBe(7);
    expect(info.quota).toBeNull();
  });
});
