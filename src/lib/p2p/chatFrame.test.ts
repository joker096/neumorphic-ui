import { describe, expect, it } from 'vitest';

import {
  MSG_MAGIC,
  CALL_MAGIC,
  encodeChatText,
  parseChatText,
  encodeChatDeliveryAck,
  parseChatDeliveryAck,
  encodeChatReadReceipt,
  parseChatReadReceipt,
  encodeCallSignal,
  parseCallSignal,
  nextFrameSeq,
} from './chatFrame';

const textFrame = {
  type: 'chat-text' as const,
  seq: 1,
  messageId: 'wire-1',
  chatId: 'dm-1',
  chatName: 'Bob',
  senderName: 'Bob',
  text: 'hello',
  silent: false,
  timestamp: 10,
};

describe('chat text frames', () => {
  it('round-trips a chat-text frame', () => {
    expect(parseChatText(encodeChatText(textFrame))).toEqual(textFrame);
  });

  it('rejects legacy frames without seq / messageId (strict mode)', () => {
    const legacy = { ...textFrame };
    delete (legacy as { seq?: number }).seq;
    expect(parseChatText(encodeChatText(legacy as typeof textFrame))).toBeNull();

    const noId = { ...textFrame, messageId: undefined };
    expect(parseChatText(encodeChatText(noId as unknown as typeof textFrame))).toBeNull();
  });

  it('rejects non-chat payloads and malformed JSON', () => {
    expect(parseChatText('')).toBeNull();
    expect(parseChatText(`${MSG_MAGIC}{broken`)).toBeNull();
    expect(parseChatText(MSG_MAGIC + JSON.stringify({ type: 'nope' }))).toBeNull();
  });
});

describe('chat ack frames', () => {
  it('round-trips a chat-ack frame', () => {
    const frame = { type: 'chat-ack' as const, seq: 2, messageId: '42', chatId: 'dm-1', timestamp: 5 };
    expect(parseChatDeliveryAck(encodeChatDeliveryAck(frame))).toEqual(frame);
  });

  it('rejects legacy acks without seq', () => {
    const frame = { type: 'chat-ack', messageId: '42', chatId: 'dm-1', timestamp: 5 };
    expect(parseChatDeliveryAck(MSG_MAGIC + JSON.stringify(frame))).toBeNull();
  });
});

describe('chat read receipt frames', () => {
  it('round-trips a chat-read frame', () => {
    const frame = { type: 'chat-read' as const, seq: 3, messageId: '42', chatId: 'dm-1', timestamp: 6 };
    expect(parseChatReadReceipt(encodeChatReadReceipt(frame))).toEqual(frame);
  });

  it('rejects legacy receipts without seq', () => {
    const frame = { type: 'chat-read', messageId: '42', chatId: 'dm-1', timestamp: 6 };
    expect(parseChatReadReceipt(MSG_MAGIC + JSON.stringify(frame))).toBeNull();
  });
});

describe('call signal frames', () => {
  it('round-trips call-ring / call-accept / call-end frames', () => {
    const ring = { type: 'call-ring' as const, seq: 4, callId: 'c-1', callType: 'video' as const, timestamp: 9 };
    expect(parseCallSignal(encodeCallSignal(ring))).toEqual(ring);

    const accept = { type: 'call-accept' as const, seq: 5, callId: 'c-1', timestamp: 10 };
    expect(parseCallSignal(encodeCallSignal(accept))).toEqual(accept);

    const end = { type: 'call-end' as const, seq: 6, callId: 'c-1', timestamp: 11 };
    expect(parseCallSignal(encodeCallSignal(end))).toEqual(end);
  });

  it('rejects legacy call frames without seq and non-call payloads', () => {
    const legacy = { type: 'call-ring', callId: 'c-1', callType: 'audio', timestamp: 9 };
    expect(parseCallSignal(CALL_MAGIC + JSON.stringify(legacy))).toBeNull();
    expect(parseCallSignal('')).toBeNull();
    expect(parseCallSignal(`${CALL_MAGIC}{broken`)).toBeNull();
    expect(parseCallSignal(CALL_MAGIC + JSON.stringify({ type: 'call-bogus' }))).toBeNull();
  });
});

describe('nextFrameSeq', () => {
  it('returns strictly increasing integers starting at 1', () => {
    const first = nextFrameSeq();
    const second = nextFrameSeq();
    expect(Number.isSafeInteger(first)).toBe(true);
    expect(second).toBe(first + 1);
  });
});