import { describe, expect, it } from 'vitest';

import { FTR_MAGIC, base64ToBytes, bytesToBase64, encodeFrame, parseFrame } from './frames';

const meta = {
  type: 'meta' as const,
  transferId: 't1',
  name: 'notes.txt',
  mime: 'text/plain',
  size: 12,
  chunkSize: 4,
  totalChunks: 3,
  sha256: 'abc',
  senderPeerId: 'peer-1',
  senderName: 'Alice',
};

describe('encodeFrame / parseFrame', () => {
  it('round-trips a meta frame', () => {
    expect(parseFrame(encodeFrame(meta))).toEqual(meta);
  });

  it('round-trips a chunk frame', () => {
    const frame = { type: 'chunk' as const, transferId: 't1', index: 2, data: bytesToBase64(new Uint8Array([1, 2, 3])) };
    expect(parseFrame(encodeFrame(frame))).toEqual(frame);
  });

  it('round-trips an end frame', () => {
    expect(parseFrame(encodeFrame({ type: 'end', transferId: 't1' }))).toEqual({ type: 'end', transferId: 't1' });
  });

  it('returns null for payloads without the magic prefix', () => {
    expect(parseFrame('')).toBeNull();
    expect(parseFrame('{"type":"meta"}')).toBeNull();
  });

  it('returns null for malformed JSON after the magic prefix', () => {
    expect(parseFrame(`${FTR_MAGIC}{broken`)).toBeNull();
  });

  it('returns null for valid JSON with an unknown type', () => {
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'nope' }))).toBeNull();
  });
});

describe('bytesToBase64 / base64ToBytes', () => {
  it('round-trips binary bytes', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 255, 17]);
    expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(Array.from(bytes));
  });

  it('handles the empty buffer', () => {
    expect(base64ToBytes(bytesToBase64(new Uint8Array(0)))).toHaveLength(0);
  });
});
