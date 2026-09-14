import { describe, expect, it } from 'vitest';

import { deleteTransfer, getChunk, getTransferBlob, getTransferMeta, listTransfers, saveChunk, saveTransferMeta } from './fileStore';
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
});
