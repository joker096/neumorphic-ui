// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateEd25519KeyPair, ed25519_sign, ed25519_verify } from './ed25519';

describe('ed25519', () => {
  it('generateEd25519KeyPair returns 32-byte public and 64-byte secret', () => {
    const kp = generateEd25519KeyPair();
    expect(kp.publicKey.length).toBe(32);
    expect(kp.secretKey.length).toBe(64);
  });

  it('signs and verifies with a provided secret key', () => {
    const kp = generateEd25519KeyPair();
    const sig = ed25519_sign('hello', kp.secretKey);
    expect(sig.length).toBe(64);
    expect(ed25519_verify('hello', sig, kp.publicKey)).toBe(true);
  });

  it('verification fails on a tampered message', () => {
    const kp = generateEd25519KeyPair();
    const sig = ed25519_sign('hello', kp.secretKey);
    expect(ed25519_verify('hellp', sig, kp.publicKey)).toBe(false);
  });

  it('signs without a secret key without throwing', () => {
    const sig = ed25519_sign('msg');
    expect(sig.length).toBe(64);
  });

  it('accepts Uint8Array messages', () => {
    const kp = generateEd25519KeyPair();
    const msg = new TextEncoder().encode('bytes');
    const sig = ed25519_sign(msg, kp.secretKey);
    expect(ed25519_verify(msg, sig, kp.publicKey)).toBe(true);
  });
});
