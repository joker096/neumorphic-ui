/**
 * Interaction frames: edit, reaction and pin toggles. Each one is a delta
 * against an existing message, never a full snapshot of it.
 */

import { MSG_MAGIC, isSeq, isNonNegativeInt } from './chatFrameCore';

export interface ChatEditFrame {
  type: 'chat-edit';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export function encodeChatEdit(frame: ChatEditFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse an edit frame; null when the payload is not a valid edit frame. */
export function parseChatEdit(raw: string): ChatEditFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatEditFrame;
    return parsed.type === 'chat-edit' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && typeof parsed.text === 'string'
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/**
 * Reaction toggle for one emoji on one message. Only the delta travels — the
 * receiver bumps or removes a single count — so a peer can never rewrite the
 * whole reaction map. The sender's own reaction is tracked locally under
 * `msg.myReactions`; it is never asserted over the wire.
 */
export interface ChatReactionFrame {
  type: 'chat-reaction';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  emoji: string;
  op: 'add' | 'remove';
  timestamp: number;
}

export function encodeChatReaction(frame: ChatReactionFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse a reaction frame; null when the payload is not a valid reaction frame. */
export function parseChatReaction(raw: string): ChatReactionFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatReactionFrame;
    return parsed.type === 'chat-reaction' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && typeof parsed.emoji === 'string'
      && (parsed.op === 'add' || parsed.op === 'remove')
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

/**
 * Pin/unpin of one message. Only the delta travels — the receiver adds or
 * removes a single pin entry — so a peer can never rewrite the whole pin list.
 * `chatId`/`chatName` address the direct chat; the receiver resolves the local
 * chat and the local message id (own ids may be numeric while a received copy
 * is keyed by the wire string id).
 */
export interface ChatPinFrame {
  type: 'chat-pin';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  op: 'pin' | 'unpin';
  timestamp: number;
}

export function encodeChatPin(frame: ChatPinFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse a pin frame; null when the payload is not a valid pin frame. */
export function parseChatPin(raw: string): ChatPinFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatPinFrame;
    return parsed.type === 'chat-pin' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && (parsed.op === 'pin' || parsed.op === 'unpin')
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
