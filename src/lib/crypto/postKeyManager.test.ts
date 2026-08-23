import { describe, it, expect } from 'vitest';
import { generatePostKey } from './postKeyManager';

describe('postKeyManager', () => {
  it('generates a post key with base64 keys and the linked chatId', () => {
    const pk = generatePostKey('chat-123');
    expect(pk.chatId).toBe('chat-123');
    expect(pk.id).toBeTruthy();
    expect(typeof pk.publicKey).toBe('string');
    expect(typeof pk.privateKey).toBe('string');
    expect(pk.createdAt).toBeGreaterThan(0);
  });

  it('generates unique keys on each call', () => {
    const a = generatePostKey('c');
    const b = generatePostKey('c');
    expect(a.id).not.toBe(b.id);
    expect(a.publicKey).not.toBe(b.publicKey);
    expect(a.privateKey).not.toBe(b.privateKey);
  });
});
