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
  encodeChatEdit,
  parseChatEdit,
  encodeChatReaction,
  parseChatReaction,
  encodeChatPin,
  parseChatPin,
  encodeChatAudioMeta,
  parseChatAudioMeta,
  encodeChatAudioChunk,
  parseChatAudioChunk,
  encodeChatAudioEnd,
  parseChatAudioEnd,
  formatDurationStr,
  parseDurationStr,
  encodeCallSignal,
  parseCallSignal,
  nextFrameSeq,
} from './chatFrame';
import {
  encodeChatLocation,
  parseChatLocation,
  encodeChatArticle,
  parseChatArticle,
} from './chatRichFrames';

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

describe('self-destruct TTL on message frames', () => {
  it('round-trips a TTL on text, geo, article and voice frames', () => {
    const timed = { ...textFrame, ttlMs: 60_000 };
    expect(parseChatText(encodeChatText(timed))!.ttlMs).toBe(60_000);

    const location = { type: 'chat-location' as const, seq: 4, messageId: 'geo-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', lat: 1.5, lng: 2.5, silent: false, timestamp: 20, ttlMs: 15_000 };
    expect(parseChatLocation(encodeChatLocation(location))!.ttlMs).toBe(15_000);

    const article = { type: 'chat-article' as const, seq: 5, messageId: 'art-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', url: 'https://example.com', title: 'Ex', silent: false, timestamp: 21, ttlMs: 5_000 };
    expect(parseChatArticle(encodeChatArticle(article))!.ttlMs).toBe(5_000);

    const voice = { type: 'chat-audio-meta' as const, seq: 6, messageId: 'voice-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', duration: 5, mime: 'audio/webm', size: 10, chunkSize: 2, totalChunks: 5, sha256: 'abc', timestamp: 22, ttlMs: 45_000 };
    expect(parseChatAudioMeta(encodeChatAudioMeta(voice))!.ttlMs).toBe(45_000);
  });

  it('keeps the field optional so legacy peers stay compatible', () => {
    expect(parseChatText(encodeChatText(textFrame))!.ttlMs).toBeUndefined();
    expect(parseChatAudioMeta(encodeChatAudioMeta({
      type: 'chat-audio-meta', seq: 7, messageId: 'voice-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Me',
      duration: 5, mime: 'audio/webm', size: 10, chunkSize: 2, totalChunks: 5, sha256: 'abc', timestamp: 12,
    }))!.ttlMs).toBeUndefined();
  });

  it('passes a malformed TTL through for the receiver to reject, never dropping the message', () => {
    const junk = { ...textFrame, ttlMs: 'soon' } as any;
    const parsed = parseChatText(encodeChatText(junk));
    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe('hello');
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

describe('chat edit frames', () => {
  it('round-trips a chat-edit frame', () => {
    const frame = {
      type: 'chat-edit' as const,
      seq: 7,
      messageId: 'm-1',
      chatId: 'dm-1',
      chatName: 'Bob',
      senderName: 'Bob',
      text: 'edited text',
      timestamp: 12,
    };
    expect(parseChatEdit(encodeChatEdit(frame))).toEqual(frame);
  });

  it('rejects legacy edits without seq and non-edit payloads', () => {
    const frame = { type: 'chat-edit', messageId: 'm-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', text: 'x', timestamp: 12 };
    expect(parseChatEdit(MSG_MAGIC + JSON.stringify(frame))).toBeNull();

    const text = { type: 'chat-text' as const, seq: 7, messageId: 'm-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', text: 'x', silent: false, timestamp: 12 };
    expect(parseChatEdit(encodeChatText(text))).toBeNull();
  });
});

describe('chat reaction frames', () => {
  it('round-trips add and remove reaction frames', () => {
    const add = {
      type: 'chat-reaction' as const,
      seq: 8,
      messageId: 'm-1',
      chatId: 'dm-1',
      chatName: 'Bob',
      senderName: 'Bob',
      emoji: '👍',
      op: 'add' as const,
      timestamp: 13,
    };
    expect(parseChatReaction(encodeChatReaction(add))).toEqual(add);
    expect(parseChatReaction(encodeChatReaction({ ...add, op: 'remove' }))!.op).toBe('remove');
  });

  it('rejects legacy, invalid-op and non-reaction payloads', () => {
    const legacy = { type: 'chat-reaction', messageId: 'm-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', emoji: '👍', op: 'add', timestamp: 13 };
    expect(parseChatReaction(MSG_MAGIC + JSON.stringify(legacy))).toBeNull();

    expect(parseChatReaction(MSG_MAGIC + JSON.stringify({ type: 'chat-reaction', seq: 1, messageId: 'm-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', emoji: '👍', op: 'reset', timestamp: 13 }))).toBeNull();
    expect(parseChatReaction(encodeChatText(textFrame))).toBeNull();
    expect(parseChatReaction(`${MSG_MAGIC}{broken`)).toBeNull();
  });
});

describe('chat pin frames', () => {
  it('round-trips pin and unpin frames', () => {
    const pin = {
      type: 'chat-pin' as const,
      seq: 9,
      messageId: 'm-1',
      chatId: 'dm-1',
      chatName: 'Bob',
      senderName: 'Bob',
      op: 'pin' as const,
      timestamp: 14,
    };
    expect(parseChatPin(encodeChatPin(pin))).toEqual(pin);
    expect(parseChatPin(encodeChatPin({ ...pin, op: 'unpin' }))!.op).toBe('unpin');
  });

  it('rejects legacy, invalid-op and non-pin payloads', () => {
    const legacy = { type: 'chat-pin', messageId: 'm-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', op: 'pin', timestamp: 14 };
    expect(parseChatPin(MSG_MAGIC + JSON.stringify(legacy))).toBeNull();

    expect(parseChatPin(MSG_MAGIC + JSON.stringify({ type: 'chat-pin', seq: 1, messageId: 'm-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Bob', op: 'toggle', timestamp: 14 }))).toBeNull();
    expect(parseChatPin(encodeChatText(textFrame))).toBeNull();
    expect(parseChatPin(`${MSG_MAGIC}{broken`)).toBeNull();
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

describe('chat audio frames', () => {
  it('round-trips chat-audio-meta, chat-audio-chunk, and chat-audio-end frames', () => {
    const meta = {
      type: 'chat-audio-meta' as const,
      seq: 7,
      messageId: 'voice-1',
      chatId: 'dm-1',
      chatName: 'Bob',
      senderName: 'Me',
      duration: 5,
      mime: 'audio/webm',
      size: 10,
      chunkSize: 2,
      totalChunks: 5,
      sha256: 'abc',
      timestamp: 12,
    };
    expect(parseChatAudioMeta(encodeChatAudioMeta(meta))).toEqual(meta);

    const chunk = { type: 'chat-audio-chunk' as const, seq: 8, messageId: 'voice-1', index: 0, data: 'AA==' };
    expect(parseChatAudioChunk(encodeChatAudioChunk(chunk))).toEqual(chunk);

    const end = { type: 'chat-audio-end' as const, seq: 9, messageId: 'voice-1' };
    expect(parseChatAudioEnd(encodeChatAudioEnd(end))).toEqual(end);
  });

  it('rejects legacy, invalid, or non-audio payloads', () => {
    const legacy = { type: 'chat-audio-meta', messageId: 'voice-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Me', duration: 5, mime: 'audio/webm', size: 10, chunkSize: 2, totalChunks: 5, sha256: 'abc', timestamp: 12 };
    expect(parseChatAudioMeta(MSG_MAGIC + JSON.stringify(legacy))).toBeNull();

    const noChunks = { type: 'chat-audio-meta', seq: 1, messageId: 'voice-1', chatId: 'dm-1', chatName: 'Bob', senderName: 'Me', duration: 5, mime: 'audio/webm', size: 10, chunkSize: 0, totalChunks: 1, sha256: 'abc', timestamp: 12 };
    expect(parseChatAudioMeta(MSG_MAGIC + JSON.stringify(noChunks))).toBeNull();

    const badChunk = { type: 'chat-audio-chunk', seq: 1, messageId: 'voice-1' };
    expect(parseChatAudioChunk(MSG_MAGIC + JSON.stringify(badChunk))).toBeNull();

    expect(parseChatAudioEnd(MSG_MAGIC + JSON.stringify({ type: 'chat-audio-end' }))).toBeNull();
    expect(parseChatAudioMeta(`${MSG_MAGIC}{broken`)).toBeNull();
  });
});

describe('voice duration helpers', () => {
  it('parses m:ss strings into seconds', () => {
    expect(parseDurationStr('0:00')).toBe(0);
    expect(parseDurationStr('0:05')).toBe(5);
    expect(parseDurationStr('1:05')).toBe(65);
    expect(parseDurationStr('10')).toBe(10);
    expect(parseDurationStr('')).toBe(0);
    expect(parseDurationStr('bad')).toBe(0);
  });

  it('formats seconds as m:ss', () => {
    expect(formatDurationStr(0)).toBe('0:00');
    expect(formatDurationStr(5)).toBe('0:05');
    expect(formatDurationStr(65)).toBe('1:05');
    expect(formatDurationStr(-1)).toBe('0:00');
    expect(formatDurationStr(Number.NaN)).toBe('0:00');
  });
});