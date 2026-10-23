import { describe, it, expect } from 'vitest';
import { encodeChatPoll, parseChatPoll } from './chatFramePoll';

const base = {
  type: 'chat-poll' as const,
  seq: 1,
  messageId: 'm1',
  chatId: 'c1',
  chatName: 'Ann',
  senderName: 'Me',
  question: 'Lunch?',
  optionTexts: ['Sushi', 'Pizza'],
  multiple: false,
  timestamp: 1_700_000_000_000,
};

describe('chat-poll frame', () => {
  it('round-trips a ballot', () => {
    const parsed = parseChatPoll(encodeChatPoll(base));
    expect(parsed?.question).toBe('Lunch?');
    expect(parsed?.optionTexts).toEqual(['Sushi', 'Pizza']);
    expect(parsed?.multiple).toBe(false);
  });

  it('rejects an empty question', () => {
    expect(parseChatPoll(encodeChatPoll({ ...base, question: '  ' }))).toBeNull();
  });

  it('rejects a single option and an empty option text', () => {
    expect(parseChatPoll(encodeChatPoll({ ...base, optionTexts: ['Sushi'] }))).toBeNull();
    expect(parseChatPoll(encodeChatPoll({ ...base, optionTexts: ['Sushi', ' '] }))).toBeNull();
  });

  it('rejects too many options and a malformed timestamp', () => {
    const many = Array.from({ length: 11 }, (_, i) => `o${i}`);
    expect(parseChatPoll(encodeChatPoll({ ...base, optionTexts: many }))).toBeNull();
    expect(parseChatPoll(encodeChatPoll({ ...base, timestamp: -1 }))).toBeNull();
  });

  it('ignores a vote frame and junk', () => {
    expect(parseChatPoll('msg1:{"type":"chat-poll-vote"}')).toBeNull();
    expect(parseChatPoll('nope')).toBeNull();
  });
});
