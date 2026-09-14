/**
 * File chunking for P2P transfers
 * Staged chunk sizes (altersend pattern): fine progress on small files, fewer frames on large files
 */

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

/** Pick a chunk size (bytes) for a file of `totalSize` bytes. */
export function chunkSizeForFileSize(totalSize: number): number {
  if (totalSize < MB) return 64 * KB;
  if (totalSize < 100 * MB) return 256 * KB;
  if (totalSize < GB) return MB;
  return 4 * MB;
}

export interface FileChunk {
  /** 0-based chunk index */
  index: number;
  data: ArrayBuffer;
  /** True for the final chunk */
  last: boolean;
}

/**
 * Slice `file` into sequential chunks.
 * `onProgress` receives the 0-based index of each produced chunk plus the total chunk count.
 */
export async function* sliceFileChunks(
  file: File | Blob,
  onProgress?: (chunkIndex: number, chunkCount: number) => void,
): AsyncGenerator<FileChunk> {
  const chunkSize = chunkSizeForFileSize(file.size);
  const chunkCount = Math.max(1, Math.ceil(file.size / chunkSize));
  for (let index = 0; index < chunkCount; index += 1) {
    const data: ArrayBuffer = await file.slice(index * chunkSize, (index + 1) * chunkSize).arrayBuffer();
    if (onProgress) onProgress(index, chunkCount);
    yield { index, data, last: index === chunkCount - 1 };
  }
}
