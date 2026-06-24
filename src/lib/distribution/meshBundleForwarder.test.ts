import { describe, it, expect } from 'vitest';
import { MeshBundleForwarder, BundleChunk } from './meshBundleForwarder';

describe('MeshBundleForwarder', () => {
  it('should split bundle URL into chunks', () => {
    const forwarder = new MeshBundleForwarder('test-peer');
    const url = 'https://example.com/app.apk';
    const chunks = forwarder.splitIntoChunks(url, 3);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].totalChunks).toBeGreaterThanOrEqual(1);
  });

  it('should reassemble chunks into original URL', () => {
    const forwarder = new MeshBundleForwarder('test-peer');
    const url = 'messenger://bundle?url=https://example.com/app.apk&hash=abc';
    const chunks = forwarder.splitIntoChunks(url, 3);
    const reassembled = forwarder.reassembleChunks(chunks);
    expect(reassembled).toBe(url);
  });

  it('should track TTL properly', () => {
    const forwarder = new MeshBundleForwarder('test-peer');
    expect(forwarder.isExpired('nonexistent')).toBe(true);
  });
});
