/**
 * Poll vote frame.
 *
 * A poll is a normal chat message carrying a `poll` payload; only the vote
 * delta travels on the wire. Each option keeps the list of voters (display
 * names, `"me"` for the local user), so a vote is idempotent: `add` appends a
 * name once, `remove` drops it. Counting on the receiver from the same
 * primitive the sender uses keeps both sides agree on the totals without a
 * separate state-sync protocol.
 */

import { MSG_MAGIC, isSeq, isNonNegativeInt } from './chatFrameCore';

export interface ChatPollFrame {
  type: 'chat-poll';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  question: string;
  optionTexts: string[];
  multiple: boolean;
  silent?: boolean;
  timestamp: number;
  ttlMs?: number;
}

/** Option ceiling the wire accepts (the composer offers five). */
const MAX_POLL_OPTIONS = 10;

export interface ChatPollVoteFrame {
  type: 'chat-poll-vote';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  optionId: string;
  op: 'add' | 'remove';
  timestamp: number;
}

export function encodeChatPollVote(frame: ChatPollVoteFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse a poll vote frame; null when the payload is not a valid vote. */
export function parseChatPollVote(raw: string): ChatPollVoteFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatPollVoteFrame;
    return parsed.type === 'chat-poll-vote' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && typeof parsed.optionId === 'string'
      && (parsed.op === 'add' || parsed.op === 'remove')
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/** Encode the poll itself; individual votes travel as `chat-poll-vote`. */
export function encodeChatPoll(frame: ChatPollFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse an inbound poll message; null when the payload is malformed. */
export function parseChatPoll(raw: string): ChatPollFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatPollFrame;
    const optionTexts = Array.isArray(parsed.optionTexts) ? parsed.optionTexts : null;
    return parsed.type === 'chat-poll' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && typeof parsed.question === 'string'
      && parsed.question.trim() !== ''
      && optionTexts !== null
      && optionTexts.length >= 2
      && optionTexts.length <= MAX_POLL_OPTIONS
      && optionTexts.every((text) => typeof text === 'string' && text.trim() !== '')
      && typeof parsed.multiple === 'boolean'
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
