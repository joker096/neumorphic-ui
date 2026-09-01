import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

// --- In-memory IndexedDB fake (patterned after recordingStorage.test.ts) ---

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
  private autoKey = 1;
  private activeTx: FakeTx | null = null;

  bind(tx: FakeTx): void {
    this.activeTx = tx;
  }

  add(value: unknown): FakeRequest {
    const key = this.autoKey++;
    this.data.set(key, value);
    const req = new FakeRequest();
    req.result = key;
    return this.requireTx().track(req);
  }

  put(value: unknown, key?: unknown): FakeRequest {
    const k = key ?? this.autoKey++;
    this.data.set(k, value);
    const req = new FakeRequest();
    req.result = k;
    return this.requireTx().track(req);
  }

  getAll(): FakeRequest {
    const req = new FakeRequest();
    req.result = [...this.data.values()];
    return this.requireTx().track(req);
  }

  getAllKeys(): FakeRequest {
    const req = new FakeRequest();
    req.result = [...this.data.keys()];
    return this.requireTx().track(req);
  }

  clear(): FakeRequest {
    this.data.clear();
    this.autoKey = 1;
    return this.requireTx().track(new FakeRequest());
  }

  private requireTx(): FakeTx {
    if (!this.activeTx) throw new Error('store used outside transaction');
    return this.activeTx;
  }
}

class FakeDB {
  stores = new Map<string, FakeStore>();

  get objectStoreNames(): { contains: (name: string) => boolean } {
    return { contains: (name: string) => this.stores.has(name) };
  }

  createObjectStore(name: string, _options?: { autoIncrement?: boolean }): FakeStore {
    const store = new FakeStore();
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
      (req.onupgradeneeded as any)?.({ target: { result: db } });
      req.onsuccess?.();
    });
    return req;
  },
};

// Helpers to read raw store data
function rawStore(): FakeStore {
  return dbs.get('messanger-queue-v2')!.stores.get('pendingMessages')!;
}

function rawValues(): any[] {
  return [...rawStore().data.values()] as any[];
}

describe('messageQueue', () => {
  let queueMessage: typeof import('./messageQueue').queueMessage;
  let getPendingMessages: typeof import('./messageQueue').getPendingMessages;
  let markMessageSent: typeof import('./messageQueue').markMessageSent;
  let retryMessage: typeof import('./messageQueue').retryMessage;
  let clearPendingMessages: typeof import('./messageQueue').clearPendingMessages;

  beforeAll(async () => {
    vi.stubGlobal('indexedDB', fakeIdb);
    const mod = await import('./messageQueue');
    queueMessage = mod.queueMessage;
    getPendingMessages = mod.getPendingMessages;
    markMessageSent = mod.markMessageSent;
    retryMessage = mod.retryMessage;
    clearPendingMessages = mod.clearPendingMessages;
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    dbs.clear();
    await clearPendingMessages().catch(() => {});
  });

  it('queueMessage stores a message with an auto-increment key', async () => {
    const key = await queueMessage({ text: 'hello' });
    expect(typeof key).toBe('number');
    expect(key).toBe(1);
  });

  it('queueMessage stores message data with sent=false and retryCount=0', async () => {
    await queueMessage({ text: 'payload' });
    const all = rawValues();
    expect(all).toHaveLength(1);
    expect(all[0].data).toEqual({ text: 'payload' });
    expect(all[0].sent).toBe(false);
    expect(all[0].retryCount).toBe(0);
    expect(typeof all[0].timestamp).toBe('number');
  });

  it('getPendingMessages returns only unsent messages', async () => {
    await queueMessage({ text: 'a' });
    await queueMessage({ text: 'b' });
    const firstId = rawValues()[0].id;
    await markMessageSent(firstId);
    const pending = await getPendingMessages();
    expect(pending).toHaveLength(1);
    expect(pending[0].data.text).toBe('b');
  });

  it('getPendingMessages returns empty array when all sent', async () => {
    await queueMessage({ text: 'x' });
    await markMessageSent(rawValues()[0].id);
    expect(await getPendingMessages()).toEqual([]);
  });

  it('markMessageSent sets sent=true on correct record', async () => {
    await queueMessage({ text: 'first' });
    await queueMessage({ text: 'second' });
    const id1 = rawValues()[0].id;
    const id2 = rawValues()[1].id;
    await markMessageSent(id1);
    const all = rawValues();
    const sent = all.find((m: any) => m.id === id1);
    const unsent = all.find((m: any) => m.id === id2);
    expect(sent?.sent).toBe(true);
    expect(unsent?.sent).toBe(false);
  });

  it('markMessageSent is a no-op for unknown id', async () => {
    await queueMessage({ text: 'here' });
    await markMessageSent('nonexistent');
    expect(rawValues()).toHaveLength(1);
    expect(rawValues()[0].sent).toBe(false);
  });

  it('retryMessage increments retryCount and sets lastRetry', async () => {
    await queueMessage({ text: 'retry-me' });
    const id = rawValues()[0].id;
    const before = Date.now();
    await retryMessage({ id });
    const all = rawValues();
    const found = all.find((m: any) => m.id === id);
    expect(found).toBeDefined();
    expect(found.retryCount).toBe(1);
    expect(found.lastRetry).toBeGreaterThanOrEqual(before);
  });

  it('retryMessage increments retryCount on subsequent retries', async () => {
    await queueMessage({ text: 'multi' });
    const id = rawValues()[0].id;
    await retryMessage({ id });
    await retryMessage({ id });
    const found = rawValues().find((m: any) => m.id === id);
    expect(found.retryCount).toBe(2);
  });

  it('retryMessage is a no-op for unknown id', async () => {
    await retryMessage({ id: 'ghost' });
    expect(await getPendingMessages()).toEqual([]);
  });

  it('clearPendingMessages empties the store', async () => {
    await queueMessage({ text: 'c1' });
    await queueMessage({ text: 'c2' });
    expect(rawValues()).toHaveLength(2);
    await clearPendingMessages();
    expect(rawValues()).toHaveLength(0);
    expect(await getPendingMessages()).toEqual([]);
  });

  it('multiple openDB calls reuse the same store', async () => {
    await queueMessage({ text: 'op1' });
    await queueMessage({ text: 'op2' });
    await queueMessage({ text: 'op3' });
    expect(rawValues()).toHaveLength(3);
    const pending = await getPendingMessages();
    expect(pending).toHaveLength(3);
  });
});
