import { describe, expect, it } from 'vitest';

import { ALBUM_MAGIC, FTR_MAGIC, base64ToBytes, bytesToBase64, encodeAlbumManifest, encodeFrame, parseAlbumManifest, parseFrame, type AlbumManifest, type FtrFrame } from './frames';

const meta = {
  type: 'meta' as const,
  seq: 1,
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
    const frame = { type: 'chunk' as const, seq: 2, transferId: 't1', index: 2, data: bytesToBase64(new Uint8Array([1, 2, 3])) };
    expect(parseFrame(encodeFrame(frame))).toEqual(frame);
  });

  it('round-trips an end frame', () => {
    expect(parseFrame(encodeFrame({ type: 'end', seq: 3, transferId: 't1' }))).toEqual({ type: 'end', seq: 3, transferId: 't1' });
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

  it('rejects legacy frames without a sequence (strict mode)', () => {
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'meta', transferId: 't1', name: 'n', mime: 'm', size: 1, chunkSize: 1, totalChunks: 1, sha256: 's', senderPeerId: 'p' }))).toBeNull();
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'chunk', transferId: 't1', index: 0, data: 'AA==' }))).toBeNull();
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'end', transferId: 't1' }))).toBeNull();
  });

  it('rejects frames with invalid fields', () => {
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'meta', seq: -1, transferId: 't1', name: 'n', mime: 'm', size: 1, chunkSize: 1, totalChunks: 1, sha256: 's', senderPeerId: 'p' }))).toBeNull();
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'chunk', seq: 1, transferId: 't1', index: -1, data: 'AA==' }))).toBeNull();
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'chunk', seq: 1, transferId: 't1', index: 0, data: '' }))).toBeNull();
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'end', seq: 1 }))).toBeNull();
    expect(parseFrame(FTR_MAGIC + JSON.stringify({ type: 'meta', seq: 1, transferId: '', name: 'n', mime: 'm', size: 1, chunkSize: 1, totalChunks: 1, sha256: 's', senderPeerId: 'p' }))).toBeNull();
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

describe('album manifest encode/parse', () => {
  const manifest = {
    albumId: 'a1',
    messageId: 42,
    chatId: 'chat-1',
    chatName: 'Room',
    senderName: 'Alice',
    timestamp: 1720000000000,
    entries: [
      { transferId: 't1', name: 'one.png', mime: 'image/png', size: 100 },
      { transferId: 't2', name: 'two.jpg', mime: 'image/jpeg', size: 200 },
    ],
  };

  const valid = () => ({ ...manifest, entries: manifest.entries.map((e) => ({ ...e })) });

  it('round-trips a valid manifest with silent flag', () => {
    const full = { ...valid(), silent: true };
    expect(parseAlbumManifest(encodeAlbumManifest(full))).toEqual(full);
  });

  it('round-trips a valid manifest without silent', () => {
    expect(parseAlbumManifest(encodeAlbumManifest(manifest))).toEqual(manifest);
  });

  it('returns null without the album magic prefix', () => {
    expect(parseAlbumManifest('')).toBeNull();
    expect(parseAlbumManifest('{"albumId":"a"}')).toBeNull();
    expect(parseAlbumManifest(encodeAlbumManifest(manifest).slice(1))).toBeNull();
  });

  it('returns null for malformed JSON after the magic prefix', () => {
    expect(parseAlbumManifest(`${ALBUM_MAGIC}{broken`)).toBeNull();
  });

  it('rejects manifests with fewer than 2 entries', () => {
    const one = valid();
    one.entries = [one.entries[0]!];
    expect(parseAlbumManifest(encodeAlbumManifest(one))).toBeNull();
  });

  it('rejects manifests with invalid entry fields', () => {
    const bad = valid();
    bad.entries = [{ ...bad.entries[0]!, transferId: '' }];
    expect(parseAlbumManifest(encodeAlbumManifest(bad))).toBeNull();
    const neg = valid();
    neg.entries[1]!.size = -1;
    expect(parseAlbumManifest(encodeAlbumManifest(neg))).toBeNull();
  });

  it('rejects manifests with missing scalar fields', () => {
    const m = valid() as any;
    delete m.timestamp;
    expect(parseAlbumManifest(encodeAlbumManifest(m))).toBeNull();
    const m2 = valid() as any;
    m2.messageId = 1.5;
    expect(parseAlbumManifest(encodeAlbumManifest(m2))).toBeNull();
    const m3 = valid() as any;
    m3.chatId = '';
    expect(parseAlbumManifest(encodeAlbumManifest(m3))).toBeNull();
  });

  it('carries the self-destruct TTL on a manifest and stays optional', () => {
    const timed: AlbumManifest = { ...valid(), ttlMs: 60_000 };
    expect(parseAlbumManifest(encodeAlbumManifest(timed))!.ttlMs).toBe(60_000);
    // Legacy senders omit the field entirely.
    expect(parseAlbumManifest(encodeAlbumManifest(valid()))!.ttlMs).toBeUndefined();
  });
});

describe('self-destruct TTL on file frames', () => {
  function metaTtl(payload: unknown): number | undefined {
    const frame = parseFrame(encodeFrame(payload as FtrFrame));
    return frame && frame.type === 'meta' ? frame.ttlMs : undefined;
  }

  it('round-trips a meta frame TTL', () => {
    expect(metaTtl({ ...meta, ttlMs: 30_000 })).toBe(30_000);
    expect(metaTtl(meta)).toBeUndefined();
  });

  it('keeps a malformed TTL parseable — it degrades to "no timer", not a dropped file', () => {
    const junk = { ...meta, ttlMs: 'soon' };
    const parsed = parseFrame(encodeFrame(junk as unknown as FtrFrame));
    expect(parsed).not.toBeNull();
    expect(parsed!.type).toBe('meta');
  });
});
