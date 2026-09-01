// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { generateGroupKey, exportRawKey, importRawKey, wrapGroupKeyForMember, unwrapGroupKey, sealEnvelope, openEnvelope } from './groupKey';
import { generateX25519KeyPair, b64encode } from '../../lib/crypto/cryptoCore';

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
});
