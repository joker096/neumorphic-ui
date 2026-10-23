/**
 * "Delete for everyone" frame.
 *
 * Telegram and WhatsApp let the author retract a message from the other side,
 * not only from their own device. Until this frame existed a P2P delete was
 * local-only: the bubble vanished for the sender and stayed forever on the peer,
 * which is the worst variant of the two (the sender believes it is gone).
 *
 * The frame carries no message body, so it cannot be replayed as content, and
 * the receiver only removes bubbles it received from that peer — a frame can
 * never erase a message the local user wrote (see `handleChatDelete`).
 */

import { MSG_MAGIC, isSeq, isNonNegativeInt } from './chatFrameCore';

export interface ChatDeleteFrame {
  type: 'chat-delete';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  timestamp: number;
}

export function encodeChatDelete(frame: ChatDeleteFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse a delete frame; null when the payload is not a valid delete frame. */
export function parseChatDelete(raw: string): ChatDeleteFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatDeleteFrame;
    return parsed.type === 'chat-delete' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
