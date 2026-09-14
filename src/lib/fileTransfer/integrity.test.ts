import { describe, expect, it } from 'vitest';

import { sha256Hex } from './integrity';

describe('sha256Hex', () => {
  it('returns a 64-char lowercase hex digest', async () => {
    expect(await sha256Hex(new Uint8Array(0))).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input', async () => {
    const a = await sha256Hex(new TextEncoder().encode('abc'));
    const b = await sha256Hex(new TextEncoder().encode('abc'));
    expect(a).toBe(b);
  });

  it('differs for different inputs (incl. empty)', async () => {
    const empty = await sha256Hex(new Uint8Array(0));
    const abc = await sha256Hex(new TextEncoder().encode('abc'));
    const abc2 = await sha256Hex(new TextEncoder().encode('abd'));
    expect(abc).not.toBe(empty);
    expect(abc).not.toBe(abc2);
    expect(empty).not.toBe(abc2);
  });

  it('hashes an ArrayBuffer and its Uint8Array view identically', async () => {
    const encoded = new TextEncoder().encode('abc');
    const buffer = encoded.buffer.slice(0, encoded.byteLength) as ArrayBuffer;
    expect(await sha256Hex(buffer)).toBe(await sha256Hex(new Uint8Array(buffer)));
  });
});
