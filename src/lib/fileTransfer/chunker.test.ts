import { describe, expect, it } from 'vitest';

import { chunkSizeForFileSize, sliceFileChunks } from './chunker';

const KB = 1024;
const MB = 1024 * KB;

describe('chunkSizeForFileSize', () => {
  it('uses 64KB under 1MB', () => {
    expect(chunkSizeForFileSize(0)).toBe(64 * KB);
    expect(chunkSizeForFileSize(999 * KB)).toBe(64 * KB);
  });

  it('uses 256KB under 100MB', () => {
    expect(chunkSizeForFileSize(100 * MB - 1)).toBe(256 * KB);
  });

  it('uses 1MB under 1GB', () => {
    expect(chunkSizeForFileSize(100 * MB)).toBe(MB);
    expect(chunkSizeForFileSize(512 * MB)).toBe(MB);
  });

  it('uses 4MB at 1GB and above', () => {
    expect(chunkSizeForFileSize(1024 * MB)).toBe(4 * MB);
  });
});

describe('sliceFileChunks', () => {
  it('slices a blob into 64KB chunks and flags the last one', async () => {
    const blob = new Blob([new Uint8Array(100 * KB).buffer]);
    const chunks: Array<{ index: number; bytes: number; last: boolean }> = [];
    for await (const chunk of sliceFileChunks(blob)) {
      chunks.push({ index: chunk.index, bytes: chunk.data.byteLength, last: chunk.last });
    }
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({ index: 0, bytes: 64 * KB, last: false });
    expect(chunks[1]).toEqual({ index: 1, bytes: 36 * KB, last: true });
  });

  it('emits a single empty chunk for an empty blob', async () => {
    const chunks: Array<{ bytes: number; last: boolean }> = [];
    for await (const chunk of sliceFileChunks(new Blob([]))) {
      chunks.push({ bytes: chunk.data.byteLength, last: chunk.last });
    }
    expect(chunks).toEqual([{ bytes: 0, last: true }]);
  });

  it('reports progress for each produced chunk', async () => {
    const progress: Array<[number, number]> = [];
    for await (const _chunk of sliceFileChunks(new Blob([new Uint8Array(100 * KB).buffer]), (index, total) => {
      progress.push([index, total]);
    })) {
      // collected in the progress callback
    }
    expect(progress).toEqual([
      [0, 2],
      [1, 2],
    ]);
  });
});
