import { describe, it, expect } from 'vitest';
import { b64encode } from '../crypto/cryptoCore';
import { generateChannelKeyPair, makeGuestIdentity, sealToChannel, openFromChannel, sealToGuest } from './embedCrypto';

describe('embedCrypto', () => {
  it('visitor→operator round-trips through the channel key', async () => {
    const channel = await generateChannelKeyPair();
    const guest = makeGuestIdentity();
    const sealed = await sealToChannel(guest, channel.publicKeyB64, 'Hello company');
    expect(sealed.senderPubKey).toBe(b64encode(guest.publicKey));
    expect(await openFromChannel(channel.secretKeyB64, sealed)).toBe('Hello company');
  });

  it('operator→visitor reply round-trips through the guest key', async () => {
    const channel = await generateChannelKeyPair();
    const guest = makeGuestIdentity();
    const reply = await sealToGuest(channel, b64encode(guest.publicKey), 'Hi visitor');
    expect(reply.senderPubKey).toBe(channel.publicKeyB64);
    expect(await openFromChannel(b64encode(guest.secretKey), reply)).toBe('Hi visitor');
  });

  it('a reply cannot be read with a different visitor secret', async () => {
    const channel = await generateChannelKeyPair();
    const guestA = makeGuestIdentity();
    const guestB = makeGuestIdentity();
    const reply = await sealToGuest(channel, b64encode(guestA.publicKey), 'secret');
    await expect(openFromChannel(b64encode(guestB.secretKey), reply)).rejects.toThrow();
  });
});
