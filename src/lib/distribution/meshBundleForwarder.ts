export interface BundleChunk {
  chunkId: string;
  bundleId: string;
  index: number;
  totalChunks: number;
  data: string;
  fromPeer: string;
  ttl: number;
  timestamp: number;
}

interface BundleAssembly {
  bundleId: string;
  chunks: Map<number, string>;
  totalChunks: number;
  createdAt: number;
}

const MAX_TTL = 3;
const CHUNK_TIMEOUT = 5 * 60 * 1000;

export class MeshBundleForwarder {
  private peerId: string;
  private assemblies: Map<string, BundleAssembly> = new Map();
  private seenChunks: Set<string> = new Set();

  constructor(peerId: string) {
    this.peerId = peerId;
  }

  splitIntoChunks(bundleUri: string, maxChunks: number = 3): BundleChunk[] {
    const bundleId = `bundle_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const chunkSize = Math.ceil(bundleUri.length / maxChunks);
    const chunks: BundleChunk[] = [];
    const now = Date.now();

    for (let i = 0; i < maxChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, bundleUri.length);
      if (start >= bundleUri.length) break;

      chunks.push({
        chunkId: `${bundleId}_${i}`,
        bundleId,
        index: i,
        totalChunks: Math.min(maxChunks, Math.ceil(bundleUri.length / chunkSize)),
        data: bundleUri.slice(start, end),
        fromPeer: this.peerId,
        ttl: MAX_TTL,
        timestamp: now,
      });
    }
    return chunks;
  }

  receiveChunk(chunk: BundleChunk): string | null {
    const chunkKey = chunk.chunkId;
    if (this.seenChunks.has(chunkKey)) return null;
    this.seenChunks.add(chunkKey);

    let assembly = this.assemblies.get(chunk.bundleId);
    if (!assembly) {
      assembly = {
        bundleId: chunk.bundleId,
        chunks: new Map(),
        totalChunks: chunk.totalChunks,
        createdAt: Date.now(),
      };
      this.assemblies.set(chunk.bundleId, assembly);
    }

    assembly.chunks.set(chunk.index, chunk.data);

    if (assembly.chunks.size === assembly.totalChunks) {
      const reassembled = this.reassembleChunks(
        Array.from(assembly.chunks.entries())
          .sort(([a], [b]) => a - b)
          .map(([, data], i) => ({
            chunkId: `${chunk.bundleId}_${i}`,
            bundleId: chunk.bundleId,
            index: i,
            totalChunks: assembly.totalChunks,
            data,
            fromPeer: chunk.fromPeer,
            ttl: 0,
            timestamp: Date.now(),
          }))
      );
      this.assemblies.delete(chunk.bundleId);
      return reassembled;
    }

    // Clean up stale assemblies
    this.cleanup();
    return null;
  }

  reassembleChunks(chunks: BundleChunk[]): string {
    return chunks
      .sort((a, b) => a.index - b.index)
      .map(c => c.data)
      .join('');
  }

  isExpired(bundleId: string): boolean {
    const assembly = this.assemblies.get(bundleId);
    if (!assembly) return true;
    return Date.now() - assembly.createdAt > CHUNK_TIMEOUT;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, assembly] of this.assemblies) {
      if (now - assembly.createdAt > CHUNK_TIMEOUT) {
        this.assemblies.delete(id);
      }
    }
  }
}
