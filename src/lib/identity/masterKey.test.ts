// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>();
  return {
    set: vi.fn(async (k: string, v: unknown) => { store.set(k, v); }),
    get: vi.fn(async (k: string) => (store.has(k) ? store.get(k) : null)),
  };
});

import * as nacl from 'tweetnacl';
import { generateMasterSeed, deriveKeysFromSeed, storeMasterSeed, hasMasterIdentity, getMasterKeySet, SEED_STORAGE_KEY } from './masterKey';

function bufEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

describe('masterKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generateMasterSeed returns 32 random bytes', async () => {
    const s1 = await generateMasterSeed();
    const s2 = await generateMasterSeed();
    expect(s1.length).toBe(32);
    expect(bufEqual(s1, s2)).toBe(false);
  });

  it('deriveKeysFromSeed is deterministic and produces valid ed25519 keys', async () => {
    const seed = await generateMasterSeed();
    const k1 = await deriveKeysFromSeed(seed);
    const k2 = await deriveKeysFromSeed(seed);
    expect(bufEqual(k1.ed25519Public, k2.ed25519Public)).toBe(true);
    expect(bufEqual(k1.x25519Public, k2.x25519Public)).toBe(true);
    expect(k1.ed25519Secret.length).toBe(64); // FIX: must be 64-byte Ed25519 secret
    expect(k1.x25519Public.length).toBe(32);
    expect(k1.aesKeyHex.length).toBe(64);

    const msg = new TextEncoder().encode('verify-me');
    const sig = nacl.sign.detached(msg, k1.ed25519Secret);
    expect(nacl.sign.detached.verify(msg, sig, k1.ed25519Public)).toBe(true);
  });

  it('stores and retrieves a master seed', async () => {
    const seed = await generateMasterSeed();
    await storeMasterSeed(seed);
    expect(await hasMasterIdentity()).toBe(true);
    const set = await getMasterKeySet();
    expect(set.seed.length).toBe(32);
  });

  it('getMasterKeySet generates and persists a seed when none stored', async () => {
    const set = await getMasterKeySet();
    expect(set.seed.length).toBe(32);
    expect(await hasMasterIdentity()).toBe(true);
  });
});
