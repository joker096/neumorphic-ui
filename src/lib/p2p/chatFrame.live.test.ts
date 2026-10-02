import { describe, it, expect } from 'vitest';
import { encodeChatLocation, parseChatLocation } from './chatRichFrames';

describe('live location frame validation', () => {
  const base = {
    type: 'chat-location' as const, seq: 7, messageId: 'live-1', chatId: 'dm-1',
    chatName: 'Bob', senderName: 'Bob', lat: 52.52, lng: 13.405,
    silent: false, timestamp: 100, live: true, expiresAt: 200, approximate: true, accuracy: 12,
  };

  it('round-trips every live field', () => {
    const p = parseChatLocation(encodeChatLocation(base))!;
    expect(p.live).toBe(true);
    expect(p.expiresAt).toBe(200);
    expect(p.approximate).toBe(true);
    expect(p.accuracy).toBe(12);
  });

  it('accepts a legacy geo frame that carries no live fields at all', () => {
    const { live, expiresAt, approximate, accuracy, ...legacy } = base;
    const p = parseChatLocation(encodeChatLocation(legacy as any))!;
    expect(p).not.toBeNull();
    expect(p.live).toBeUndefined();
    expect(p.expiresAt).toBeUndefined();
  });

  it('rejects impossible coordinates from an untrusted peer', () => {
    // The wire is attacker-controlled: a latitude of 90.5 is not a real point
    // and would render as a nonsense map position.
    expect(parseChatLocation(encodeChatLocation({ ...base, lat: 90.5 }))).toBeNull();
    expect(parseChatLocation(encodeChatLocation({ ...base, lat: -91 }))).toBeNull();
    expect(parseChatLocation(encodeChatLocation({ ...base, lng: 181 }))).toBeNull();
    expect(parseChatLocation(encodeChatLocation({ ...base, lng: -180.1 }))).toBeNull();
  });

  it('rejects malformed live fields rather than passing them to the renderer', () => {
    expect(parseChatLocation(encodeChatLocation({ ...base, live: 'yes' as any }))).toBeNull();
    expect(parseChatLocation(encodeChatLocation({ ...base, expiresAt: -5 }))).toBeNull();
    expect(parseChatLocation(encodeChatLocation({ ...base, accuracy: -3 }))).toBeNull();
    expect(parseChatLocation(encodeChatLocation({ ...base, accuracy: 'far' as any }))).toBeNull();
    expect(parseChatLocation(encodeChatLocation({ ...base, approximate: 1 as any }))).toBeNull();
  });
});
