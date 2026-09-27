// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateGroupKey, exportRawKey, importRawKey, wrapGroupKeyForMember, unwrapGroupKey, sealEnvelope, openEnvelope } from './groupKey';
import { generateX25519KeyPair, b64encode, x25519DH } from '../../lib/crypto/cryptoCore';

describe('company group key', () => {
  it('export/import round-trips a group key', async () => {
    const key = await generateGroupKey();
    const raw = await exportRawKey(key);
    const restored = await importRawKey(raw);
    const raw2 = await exportRawKey(restored);
    expect(raw2).toBe(raw);
  });

  it('wrap/unwrap delivers the same group key to a member', async () => {
    const group = await generateGroupKey();
    const member = generateX25519KeyPair();
    const wrapped = await wrapGroupKeyForMember(group, b64encode(member.publicKey));
    const recovered = await unwrapGroupKey(wrapped, member.secretKey);
    expect(await exportRawKey(recovered)).toBe(await exportRawKey(group));
  });

  it('seals and opens an envelope with the group key', async () => {
    const group = await generateGroupKey();
    const env = await sealEnvelope(group, {
      companyId: 'org1',
      senderPubKey: 'abc',
      groupKeyVersion: 1,
      text: 'secret-team-data',
    });
    const plain = await openEnvelope(group, env);
    expect(plain).toBe('secret-team-data');
    expect(env.companyId).toBe('org1');
    expect(env.groupKeyVersion).toBe(1);
  });

  it('fails to open with the wrong group key', async () => {
    const a = await generateGroupKey();
    const b = await generateGroupKey();
    const env = await sealEnvelope(a, { companyId: 'x', senderPubKey: 'y', groupKeyVersion: 1, text: 'hi' });
    await expect(openEnvelope(b, env)).rejects.toBeTruthy();
  });

  // --- v2: wrapped keys are bound to the member they were created for ---

  it('refuses a wrapped key addressed to a different member', async () => {
    // Regression: the blob's memberPublicKey was stored but never checked, and
    // the KEK was the raw DH secret, so a blob could be handed to a client
    // regardless of whom it was created for.
    const group = await generateGroupKey();
    const alice = generateX25519KeyPair();
    const bob = generateX25519KeyPair();
    const wrapped = await wrapGroupKeyForMember(group, b64encode(alice.publicKey));
    expect(wrapped.v).toBe(2);
    await expect(unwrapGroupKey(wrapped, bob.secretKey)).rejects.toThrow(/different member/);
  });

  it('fails when the member public key in the blob is swapped', async () => {
    // The KEK is HKDF-bound to (memberPublicKey, ephemeralPublicKey), so a
    // swapped field cannot silently produce a working key.
    const group = await generateGroupKey();
    const alice = generateX25519KeyPair();
    const mallory = generateX25519KeyPair();
    const wrapped = await wrapGroupKeyForMember(group, b64encode(alice.publicKey));
    const swapped = { ...wrapped, memberPublicKey: b64encode(mallory.publicKey) };
    await expect(unwrapGroupKey(swapped, alice.secretKey)).rejects.toBeTruthy();
  });

  it('still unwraps legacy v1 blobs (raw-DH wrapping) so existing installs keep their key', async () => {
    const group = await generateGroupKey();
    const member = generateX25519KeyPair();
    const ephemeral = generateX25519KeyPair();
    const shared = x25519DH(ephemeral.secretKey, member.publicKey);
    const aesKey = await crypto.subtle.importKey('raw', shared.slice(0, 32).buffer as ArrayBuffer, 'AES-GCM', false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, new Uint8Array(await crypto.subtle.exportKey('raw', group)));
    const legacy = {
      memberPublicKey: b64encode(member.publicKey),
      ephemeralPublicKey: b64encode(ephemeral.publicKey),
      ciphertext: b64encode(new Uint8Array(ct)),
      nonce: b64encode(iv),
    };
    const recovered = await unwrapGroupKey(legacy, member.secretKey);
    expect(await exportRawKey(recovered)).toBe(await exportRawKey(group));
  });

  // --- v2: envelope header is authenticated, not just carried ---

  it('rejects an envelope whose sender was swapped in transit', async () => {
    const group = await generateGroupKey();
    const env = await sealEnvelope(group, { companyId: 'org1', senderPubKey: 'alice', groupKeyVersion: 1, text: 'data' });
    expect(env.v).toBe(2);
    await expect(openEnvelope(group, { ...env, senderPubKey: 'mallory' })).rejects.toBeTruthy();
  });

  it('rejects a downgraded group-key version (revocation bypass)', async () => {
    // The key version lives in the header; unbound, a relay could pin a peer to
    // a revoked key version.
    const group = await generateGroupKey();
    const env = await sealEnvelope(group, { companyId: 'org1', senderPubKey: 'alice', groupKeyVersion: 7, text: 'data' });
    await expect(openEnvelope(group, { ...env, groupKeyVersion: 1 })).rejects.toBeTruthy();
  });

  it('rejects an envelope replayed into another company', async () => {
    const group = await generateGroupKey();
    const env = await sealEnvelope(group, { companyId: 'org1', senderPubKey: 'alice', groupKeyVersion: 1, text: 'data' });
    await expect(openEnvelope(group, { ...env, companyId: 'org2' })).rejects.toBeTruthy();
  });

  it('still opens legacy v1 envelopes (unbound header) for backward compatibility', async () => {
    const group = await generateGroupKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      group,
      new TextEncoder().encode('legacy-payload'),
    );
    const legacy = {
      iv: b64encode(iv),
      ciphertext: b64encode(new Uint8Array(ct)),
      senderPubKey: 'alice',
      companyId: 'org1',
      groupKeyVersion: 1,
      timestamp: 1,
    };
    expect(await openEnvelope(group, legacy)).toBe('legacy-payload');
  });
});
