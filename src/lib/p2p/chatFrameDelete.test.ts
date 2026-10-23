import { describe, it, expect } from 'vitest';
import { encodeChatDelete, parseChatDelete, nextFrameSeq, MSG_MAGIC } from './chatFrame';

const frame = (over: Partial<Parameters<typeof encodeChatDelete>[0]> = {}) => ({
  type: 'chat-delete' as const,
  seq: 7,
  messageId: '1700000000000',
  chatId: 'dm-1',
  chatName: 'Alice',
  senderName: 'Bob',
  timestamp: 1_700_000_000_000,
  ...over,
});

describe('chat-delete frame', () => {
  it('round-trips a retraction', () => {
    const parsed = parseChatDelete(encodeChatDelete(frame()));
    expect(parsed).toMatchObject({
      type: 'chat-delete',
      messageId: '1700000000000',
      chatId: 'dm-1',
    });
  });

  it('frames use the msg1: magic and a monotonic seq', () => {
    const encoded = encodeChatDelete(frame({ seq: nextFrameSeq() }));
    expect(encoded.startsWith(MSG_MAGIC)).toBe(true);
  });

  it('rejects another frame type that shares the magic prefix', () => {
    const pin = MSG_MAGIC + JSON.stringify({ ...frame(), type: 'chat-pin', op: 'pin' });
    expect(parseChatDelete(pin)).toBeNull();
  });

  it('rejects malformed payloads instead of throwing', () => {
    expect(parseChatDelete('not-a-frame')).toBeNull();
    expect(parseChatDelete(MSG_MAGIC + '{')).toBeNull();
    expect(parseChatDelete(MSG_MAGIC + JSON.stringify({ ...frame(), messageId: 42 }))).toBeNull();
    expect(parseChatDelete(MSG_MAGIC + JSON.stringify({ ...frame(), seq: -1 }))).toBeNull();
    expect(parseChatDelete(MSG_MAGIC + JSON.stringify({ ...frame(), timestamp: 'now' }))).toBeNull();
  });
});
