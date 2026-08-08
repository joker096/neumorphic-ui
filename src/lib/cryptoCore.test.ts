import { describe, it, expect, vi } from 'vitest';
import { buf2hex, hex2buf } from './cryptoCore';

describe('cryptoCore utilities', () => {
  it('should convert buffer to hex correctly', () => {
    const buffer = new Uint8Array([0xde, 0xad, 0xbe, 0xef]).buffer;
    const hex = buf2hex(buffer);
    expect(hex).toBe('deadbeef');
  });

  it('should convert empty buffer to empty hex', () => {
    const buffer = new Uint8Array([]).buffer;
    const hex = buf2hex(buffer);
    expect(hex).toBe('');
  });

  it('should convert hex to buffer correctly', () => {
    const hex = 'deadbeef';
    const buffer = hex2buf(hex);
    const view = new Uint8Array(buffer);

    expect(view.length).toBe(4);
    expect(view[0]).toBe(0xde);
    expect(view[1]).toBe(0xad);
    expect(view[2]).toBe(0xbe);
    expect(view[3]).toBe(0xef);
  });

  it('should round-trip buffer -> hex -> buffer', () => {
    const original = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]);
    const hex = buf2hex(original.buffer);
    const restored = hex2buf(hex);
    const restoredView = new Uint8Array(restored);
    expect(restoredView).toEqual(original);
  });

  it('should handle uppercase hex', () => {
    const hex = 'DEADBEEF';
    const buffer = hex2buf(hex);
    const view = new Uint8Array(buffer);
    expect(view[0]).toBe(0xde);
    expect(view[1]).toBe(0xad);
    expect(view[2]).toBe(0xbe);
    expect(view[3]).toBe(0xef);
  });
});