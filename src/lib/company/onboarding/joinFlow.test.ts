// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const idbStore = new Map<string, any>();
vi.mock('idb-keyval', () => ({
  get: vi.fn(async (k: string) => idbStore.get(k)),
  set: vi.fn(async (k: string, v: any) => { idbStore.set(k, v); }),
}));

import { generateX25519KeyPair, x25519DH, b64decode, b64encode } from '../../crypto/cryptoCore';
import { generateEd25519KeyPair, ed25519_sign } from '../../crypto/ed25519';

type JoinFlowModule = typeof import('./joinFlow');
let join: JoinFlowModule;

beforeEach(async () => {
  idbStore.clear();
  vi.resetModules();
  join = await import('./joinFlow');
});

function toB64(bytes: Uint8Array): string {
  return b64encode(bytes);
}

describe('initializeJoinFlow', () => {
  it('builds a join request with signed device key', async () => {
    const req = await join.initializeJoinFlow(
      { org: 'org1', code: 'CODE', name: 'C', adminKey: 'pk' },
      'Ada',
    );
    expect(req.type).toBe('company-join-request');
    expect(req.companyId).toBe('org1');
    expect(req.inviteCode).toBe('CODE');
    expect(req.displayName).toBe('Ada');
    expect(req.devicePublicKey).toBeTruthy();
    // signature is valid base64
    expect(req.signature).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

describe('verifyInviteSignature', () => {
  it('accepts a signature from the admin key', async () => {
    const admin = generateEd25519KeyPair();
    const payload = { org: 'org1', code: 'CODE' };
    const sig = ed25519_sign(`${payload.org}:${payload.code}`, admin.secretKey);
    expect(join.verifyInviteSignature(payload, toB64(sig), toB64(admin.publicKey))).toBe(true);
  });

  it('rejects a signature from a different key', async () => {
    const admin = generateEd25519KeyPair();
    const other = generateEd25519KeyPair();
    const payload = { org: 'org1', code: 'CODE' };
    const sig = ed25519_sign(`${payload.org}:${payload.code}`, other.secretKey);
    expect(join.verifyInviteSignature(payload, toB64(sig), toB64(admin.publicKey))).toBe(false);
  });
});

describe('handleJoinAck', () => {
  it('returns null when no join flow was initialized', async () => {
    expect(await join.handleJoinAck({
      type: 'company-join-ack', groupKey: 'x', groupKeyVersion: 1,
      members: [], wrappedBy: 'y',
    })).toBeNull();
  });

  it('unwraps a group key and persists device secret', async () => {
    // device side
    const req = await join.initializeJoinFlow(
      { org: 'org1', code: 'CODE', name: 'C', adminKey: 'pk' },
      'Ada',
    );

    // admin side: derive shared secret + wrap a raw group key
    const admin = generateX25519KeyPair();
    const memberPub = b64decode(req.devicePublicKey);
    const sharedSecret = x25519DH(admin.secretKey, memberPub);
    const unwrapKey = await crypto.subtle.importKey(
      'raw', sharedSecret.slice(0, 32), 'AES-GCM', false, ['encrypt'],
    );
    const groupKeyBytes = crypto.getRandomValues(new Uint8Array(32));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, unwrapKey, groupKeyBytes));
    const composite = new Uint8Array(iv.length + ct.length);
    composite.set(iv, 0);
    composite.set(ct, iv.length);

    const ack = {
      type: 'company-join-ack' as const,
      groupKey: toB64(composite),
      groupKeyVersion: 1,
      members: ['u1'],
      wrappedBy: toB64(admin.publicKey),
    };

    const result = await join.handleJoinAck(ack);
    expect(result).not.toBeNull();
    expect(result!.user.displayName).toBe('Ada');
    expect(result!.user.companyId).toBe('org1');
    expect(result!.user.role).toBe('member');
    expect(result!.user.userId).toMatch(/^usr_/);

    // returned group key actually encrypts/decrypts (it is not extractable)
    const iv2 = crypto.getRandomValues(new Uint8Array(12));
    const ct2 = new Uint8Array(
      await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv2 }, result!.groupKey, new TextEncoder().encode('ping')),
    );
    const dec = new TextDecoder().decode(
      await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv2 }, result!.groupKey, ct2),
    );
    expect(dec).toBe('ping');

    // device secret persisted
    expect(idbStore.get(`mess_company_user_keys_${result!.user.userId}`)).toBeDefined();
  });
});
