// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  generateChannelKeyPair,
  makeGuestIdentity,
  sealToChannel,
  openFromChannel,
} from './embedCrypto';

describe('embedCrypto', () => {
  it('generates a channel keypair as base64', () => {
    const kp = generateChannelKeyPair();
    expect(typeof kp.publicKeyB64).toBe('string');
    expect(typeof kp.secretKeyB64).toBe('string');
    expect(kp.publicKeyB64).not.toEqual(kp.secretKeyB64);
  });

  it('seals to channel and opens with the channel secret', async () => {
    const chan = generateChannelKeyPair();
    const guest = makeGuestIdentity();
    const sealed = await sealToChannel(guest, chan.publicKeyB64, 'hello visitor');
    const opened = await openFromChannel(chan.secretKeyB64, sealed);
    expect(opened).toBe('hello visitor');
  });

  it('throws when opened with the wrong channel secret', async () => {
    const chanA = generateChannelKeyPair();
    const chanB = generateChannelKeyPair();
    const guest = makeGuestIdentity();
    const sealed = await sealToChannel(guest, chanA.publicKeyB64, 'secret');
    await expect(openFromChannel(chanB.secretKeyB64, sealed)).rejects.toThrow();
  });
});
