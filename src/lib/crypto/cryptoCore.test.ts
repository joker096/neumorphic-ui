import { describe, it, expect } from 'vitest';
import * as nacl from 'tweetnacl';
import {
  b64encode,
  b64decode,
  buf2hex,
  hex2buf,
  generateX25519KeyPair,
  x25519DH,
  deriveSharedHmacKey,
  deriveSharedSessionKeys,
  cryptoCore,
} from './cryptoCore';

describe('encoding helpers', () => {
  it('round-trips base64', () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255, 65]);
    expect(Array.from(b64decode(b64encode(bytes)))).toEqual(Array.from(bytes));
  });

  it('chunks inputs larger than the internal block size', () => {
    const bytes = new Uint8Array(100_000);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i % 256;
    expect(Array.from(b64decode(b64encode(bytes)))).toEqual(Array.from(bytes));
  });

  it('b64decode rejects empty input', () => {
    expect(() => b64decode('')).toThrow(TypeError);
  });

  it('b64decode rejects invalid characters', () => {
    expect(() => b64decode('a$b!')).toThrow(RangeError);
  });

  it('round-trips hex', () => {
    const buf = hex2buf('deadbeef');
    expect(Array.from(buf)).toEqual([0xde, 0xad, 0xbe, 0xef]);
    expect(buf2hex(buf.buffer as ArrayBuffer)).toBe('deadbeef');
  });

  it('hex2buf rejects empty input', () => {
    expect(() => hex2buf('')).toThrow(TypeError);
  });

  it('hex2buf rejects invalid characters', () => {
    expect(() => hex2buf('xyz')).toThrow(RangeError);
  });

  it('hex2buf rejects odd-length input', () => {
    expect(() => hex2buf('abc')).toThrow(RangeError);
  });
});

describe('X25519 agreement', () => {
  it('returns 32-byte public and secret keys', () => {
    const kp = generateX25519KeyPair();
    expect(kp.publicKey).toHaveLength(32);
    expect(kp.secretKey).toHaveLength(32);
  });

  it('x25519DH matches tweetnacl scalarMult', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    expect(Array.from(x25519DH(alice.secretKey, bob.publicKey))).toEqual(
      Array.from(nacl.scalarMult(alice.secretKey, bob.publicKey)),
    );
  });

  it('derives matching shared HMAC keys on both sides', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    const fromAlice = deriveSharedHmacKey(alice.secretKey, bob.publicKey);
    const fromBob = deriveSharedHmacKey(bob.secretKey, alice.publicKey);
    expect(fromAlice).toMatch(/^[0-9a-f]{128}$/);
    expect(fromAlice).toBe(fromBob);
  });

  it('derives matching independent session keys on both sides', () => {
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    const ka = deriveSharedSessionKeys(alice.secretKey, bob.publicKey);
    const kb = deriveSharedSessionKeys(bob.secretKey, alice.publicKey);
    expect(ka).toEqual(kb);
    expect(ka.hmacKey).toMatch(/^[0-9a-f]{64}$/);
    expect(ka.aesKeyHex).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('CryptoCore', () => {
  it('derives a deterministic AES key from password + salt', async () => {
    const salt = '00'.repeat(16);
    const { key: key1, saltHex } = await cryptoCore.deriveAESKeyFromPassword('password', salt);
    const { key: key2 } = await cryptoCore.deriveAESKeyFromPassword('password', salt);
    expect(saltHex).toBe(salt);
    const payload = await cryptoCore.encryptData('hello world', key1);
    await expect(cryptoCore.decryptData(payload.cipher, payload.iv, key2)).resolves.toBe('hello world');
  });

  it('generates a random 16-byte salt when none is given', async () => {
    const a = await cryptoCore.deriveAESKeyFromPassword('password');
    const b = await cryptoCore.deriveAESKeyFromPassword('password');
    expect(a.saltHex).toMatch(/^[0-9a-f]{32}$/);
    expect(a.saltHex).not.toBe(b.saltHex);
  });

  it('rejects decryption with a different key', async () => {
    const a = await cryptoCore.deriveAESKeyFromPassword('password-a', '00'.repeat(16));
    const b = await cryptoCore.deriveAESKeyFromPassword('password-b', '00'.repeat(16));
    const payload = await cryptoCore.encryptData('secret', a.key);
    await expect(cryptoCore.decryptData(payload.cipher, payload.iv, b.key)).rejects.toThrow();
  });

  it('hashes a PIN deterministically with a salt', async () => {
    const salt = 'ff'.repeat(16);
    const a = await cryptoCore.hashAppLockPIN('123456', salt);
    const b = await cryptoCore.hashAppLockPIN('123456', salt);
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a).toEqual(b);
    const c = await cryptoCore.hashAppLockPIN('654321', salt);
    expect(c.hash).not.toBe(a.hash);
  });

  it('signs and verifies Ed25519 messages', () => {
    const kp = nacl.sign.keyPair();
    const sig = cryptoCore.signEd25519(kp.secretKey, 'message');
    expect(cryptoCore.verifyEd25519Signature(kp.publicKey, 'message', sig)).toBe(true);
    expect(cryptoCore.verifyEd25519Signature(kp.publicKey, 'tampered', sig)).toBe(false);
  });

  it('verifyEd25519Signature returns false for a short garbage signature', () => {
    const kp = nacl.sign.keyPair();
    expect(cryptoCore.verifyEd25519Signature(kp.publicKey, 'message', new Uint8Array(10))).toBe(false);
  });

  it('secureWipe clears local and session storage without throwing', async () => {
    localStorage.setItem('wipe-test', '1');
    sessionStorage.setItem('wipe-test', '2');
    await cryptoCore.secureWipe();
    expect(localStorage.getItem('wipe-test')).toBeNull();
    expect(sessionStorage.getItem('wipe-test')).toBeNull();
  });
});
