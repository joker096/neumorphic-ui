import { describe, it, expect } from 'vitest';
import { generateChannelKeypair, signMessage, verifySignedMessage } from './channelSigning';
import type { SignedMessage } from './channelSigning';

describe('channelSigning', () => {
  it('generateChannelKeypair returns hex public/private keys', () => {
    const kp = generateChannelKeypair();
    expect(kp.publicKey).toMatch(/^[0-9a-f]+$/i);
    expect(kp.privateKey).toMatch(/^[0-9a-f]+$/i);
    expect(kp.publicKey.length).toBe(64); // 32 bytes hex
    expect(kp.privateKey.length).toBe(128); // 64 bytes hex
  });

  it('signs and verifies a message with the channel public key', () => {
    const kp = generateChannelKeypair();
    const signed = signMessage('hello channel', kp.privateKey);
    const verifiable: SignedMessage = { ...signed, publicKey: kp.publicKey };
    expect(verifySignedMessage(verifiable)).toBe(true);
  });

  it('fails verification with wrong public key', () => {
    const kp = generateChannelKeypair();
    const other = generateChannelKeypair();
    const signed = signMessage('secret', kp.privateKey);
    const verifiable: SignedMessage = { ...signed, publicKey: other.publicKey };
    expect(verifySignedMessage(verifiable)).toBe(false);
  });

  it('fails verification when message is tampered', () => {
    const kp = generateChannelKeypair();
    const signed = signMessage('secret', kp.privateKey);
    const tampered: SignedMessage = { ...signed, publicKey: kp.publicKey, message: 'tampered' };
    expect(verifySignedMessage(tampered)).toBe(false);
  });

  it('returns false when public key is missing', () => {
    const kp = generateChannelKeypair();
    const signed = signMessage('secret', kp.privateKey);
    expect(verifySignedMessage(signed)).toBe(false);
  });
});
