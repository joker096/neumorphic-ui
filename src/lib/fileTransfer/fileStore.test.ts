import { describe, expect, it } from 'vitest';

import { canAcceptFileTransfer, deleteTransfer, enforceFileTransferBudget, evictFtrBlobUrl, getChunk, getTransferBlob, getTransferMeta, listTransfers, pruneAbandonedTransfers, pruneCompletedTransfers, resolveFtrBlobUrl, saveChunk, saveTransferMeta } from './fileStore';
import type { StoredTransfer } from './fileStore';

function makeMeta(transferId: string): StoredTransfer {
  return {
    transferId,
    name: `${transferId}.bin`,
    mime: 'application/octet-stream',
    size: 3,
    chunkSize: 1,
    totalChunks: 3,
    sha256: 'abc',
    senderPeerId: 'peer-1',
    senderName: 'Alice',
  };
}

function bytesOf(...values: number[]): ArrayBuffer {
  return new Uint8Array(values).buffer as ArrayBuffer;
}

async function cleanSlate(): Promise<void> {
  const metas = await listTransfers();
  for (const m of metas) await deleteTransfer(m.transferId);
}

describe('fileStore (memory fallback without indexedDB)', () => {
  it('saves and returns transfer meta', async () => {
    await saveTransferMeta(makeMeta('t1'));
    expect(await getTransferMeta('t1')).toEqual(expect.objectContaining({ transferId: 't1', name: 't1.bin' }));
    expect(await getTransferMeta('missing')).toBeUndefined();
  });

  it('lists transfers', async () => {
    await saveTransferMeta(makeMeta('t2'));
    const metas = await listTransfers();
    expect(metas.map((m) => m.transferId)).toEqual(expect.arrayContaining(['t1', 't2']));
  });

  it('stores chunks and assembles a blob', async () => {
    const first = bytesOf(1, 2);
    const second = bytesOf(3);
    await saveChunk('t3', 0, first);
    await saveChunk('t3', 1, second);
    expect(await getChunk('t3', 0)).toBe(first);
    expect(await getChunk('t3', 5)).toBeUndefined();
    const blob = await getTransferBlob('t3', 2);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.size).toBe(3);
  });

  it('returns a null blob when a chunk is missing', async () => {
    await saveChunk('t4', 0, bytesOf(9));
    expect(await getTransferBlob('t4', 2)).toBeNull();
  });

  it('deleteTransfer clears meta and chunks', async () => {
    await saveTransferMeta(makeMeta('t5'));
    await saveChunk('t5', 0, bytesOf(9));
    await deleteTransfer('t5');
    expect(await getTransferMeta('t5')).toBeUndefined();
    expect(await getChunk('t5', 0)).toBeUndefined();
  });

  it('pruneAbandonedTransfers deletes stale incomplete transfers, keeps recent and completed ones', async () => {
    const stale = { ...makeMeta('t-old'), receivedAt: Date.now() - 31 * 60 * 1000, completed: false };
    const recent = { ...makeMeta('t-recent'), receivedAt: Date.now(), completed: false };
    const done = { ...makeMeta('t-done'), receivedAt: Date.now() - 31 * 60 * 1000, completed: true };
    await saveTransferMeta(stale);
    await saveTransferMeta(recent);
    await saveTransferMeta(done);
    await saveChunk('t-old', 0, bytesOf(1));

    expect(await pruneAbandonedTransfers()).toBe(1);
    expect(await getTransferMeta('t-old')).toBeUndefined();
    expect(await getChunk('t-old', 0)).toBeUndefined();
    expect(await getTransferMeta('t-recent')).toBeDefined();
    expect(await getTransferMeta('t-done')).toBeDefined();
  });

  it('pruneCompletedTransfers evicts stale completed transfers only', async () => {
    await cleanSlate();
    const staleDone = { ...makeMeta('pc-old'), receivedAt: Date.now() - 25 * 60 * 60 * 1000, completed: true };
    const freshDone = { ...makeMeta('pc-new'), receivedAt: Date.now(), completed: true };
    const open = { ...makeMeta('pc-open'), receivedAt: Date.now() - 25 * 60 * 60 * 1000, completed: false };
    await saveTransferMeta(staleDone);
    await saveChunk('pc-old', 0, bytesOf(1));
    await saveTransferMeta(freshDone);
    await saveTransferMeta(open);
    expect(await pruneCompletedTransfers()).toBe(1);
    expect(await getTransferMeta('pc-old')).toBeUndefined();
    expect(await getChunk('pc-old', 0)).toBeUndefined();
    expect(await getTransferMeta('pc-new')).toBeDefined();
    expect(await getTransferMeta('pc-open')).toBeDefined();
  });

  it('canAcceptFileTransfer allows under budget, rejects over', async () => {
    await cleanSlate();
    await saveTransferMeta({ ...makeMeta('ca-1'), size: 100 });
    expect(await canAcceptFileTransfer(50, 150)).toBe(true);
    expect(await canAcceptFileTransfer(51, 150)).toBe(false);
  });

  it('enforceFileTransferBudget evicts completed first, then incomplete', async () => {
    await cleanSlate();
    await saveTransferMeta({ ...makeMeta('ef-open'), size: 100, receivedAt: Date.now() - 30 * 60 * 1000, completed: false });
    await saveTransferMeta({ ...makeMeta('ef-done-old'), size: 100, receivedAt: Date.now() - 26 * 60 * 60 * 1000, completed: true });
    await saveTransferMeta({ ...makeMeta('ef-done-new'), size: 100, receivedAt: Date.now() - 25 * 60 * 60 * 1000, completed: true });
    expect(await enforceFileTransferBudget(150)).toBe(2);
    expect(await getTransferMeta('ef-open')).toBeDefined();
    expect(await getTransferMeta('ef-done-old')).toBeUndefined();
    expect(await getTransferMeta('ef-done-new')).toBeUndefined();
  });

  it('enforceFileTransferBudget evicts oldest incomplete when no completed exist', async () => {
    await cleanSlate();
    await saveTransferMeta({ ...makeMeta('ei-old'), size: 100, receivedAt: Date.now() - 10 * 60 * 1000, completed: false });
    await saveTransferMeta({ ...makeMeta('ei-new'), size: 100, receivedAt: Date.now(), completed: false });
    expect(await enforceFileTransferBudget(150)).toBe(1);
    expect(await getTransferMeta('ei-old')).toBeUndefined();
    expect(await getTransferMeta('ei-new')).toBeDefined();
  });
});

describe('ftr blob URL cache', () => {
  it('evicts and revokes the cached URL when a transfer is deleted', async () => {
    const created: string[] = [];
    const revoked: string[] = [];
    const realCreate = URL.createObjectURL;
    const realRevoke = URL.revokeObjectURL;
    URL.createObjectURL = ((b: Blob) => { const u = `blob:t-${created.length}`; created.push(u); void b; return u; }) as any;
    URL.revokeObjectURL = ((u: string) => { revoked.push(u); }) as any;

    try {
      await saveTransferMeta({ ...makeMeta('t-cache'), completed: true, sha256: undefined, totalChunks: 1 });
      await saveChunk('t-cache', 0, bytesOf(1, 2, 3));

      const first = await resolveFtrBlobUrl('t-cache');
      expect(first?.url).toBe('blob:t-0');
      // a second resolve is served from the cache — no extra URL is minted
      expect(await resolveFtrBlobUrl('t-cache')).toBe(first);
      expect(created).toHaveLength(1);

      evictFtrBlobUrl('t-cache');
      expect(revoked).toEqual(['blob:t-0']);

      await deleteTransfer('t-cache');
      // the cache entry is gone, so resolving again must not hand back a revoked URL
      expect(revoked.filter((u) => u === 'blob:t-0')).toHaveLength(1);
      expect(await getTransferMeta('t-cache')).toBeUndefined();
    } finally {
      URL.createObjectURL = realCreate;
      URL.revokeObjectURL = realRevoke;
    }
  });

  it('evictFtrBlobUrl is a no-op for an unknown transfer', () => {
    let calls = 0;
    const real = URL.revokeObjectURL;
    URL.revokeObjectURL = (() => { calls += 1; }) as any;
    try {
      evictFtrBlobUrl('never-resolved');
      expect(calls).toBe(0);
    } finally {
      URL.revokeObjectURL = real;
    }
  });
});
