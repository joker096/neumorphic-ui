/**
 * Framing core for the P2P chat wire protocol: magic prefixes, per-sender
 * sequence, shared numeric guards and the message/ack/receipt/call codecs.
 *
 * Strict mode: every frame carries a payload-level `seq` (per-sender
 * monotonic counter). Frames without a valid `seq`/`messageId` are legacy
 * and always rejected — parsers return `null` for them.
 */

export const MSG_MAGIC = 'msg1:';

/** Call signaling frames (ring/accept/end) carried over the messenger data channel. */
export const CALL_MAGIC = 'call1:';

let frameCounter = 0;

/** Next per-sender payload sequence (strict-mode anti-legacy + payload anti-replay). */
export function nextFrameSeq(): number {
  frameCounter += 1;
  return frameCounter;
}

export const isSeq = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;

/** Quoted message snapshot carried by a reply. The id is always the wire string
 * id (`String(senderMessageId)`), so both peers resolve it via `String(m.id)`.
 * `text` is untrusted — it is only ever rendered as plain text. */
export interface ChatQuote {
  id: string;
  sender: string;
  text?: string;
  type?: string;
  duration?: string;
}

/** Text chat message carried across peers. */
export interface ChatTextFrame {
  type: 'chat-text';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  text: string;
  silent: boolean;
  timestamp: number;
  /** Remaining self-destruct duration; omitted when the message never expires. */
  ttlMs?: number;
  /** Quoted message when this is a reply; omitted otherwise. */
  replyTo?: ChatQuote;
}

export interface ChatDeliveryAckFrame {
  type: 'chat-ack';
  seq: number;
  messageId: string;
  chatId: string;
  timestamp: number;
}

export interface ChatReadReceiptFrame {
  type: 'chat-read';
  seq: number;
  messageId: string;
  chatId: string;
  timestamp: number;
}

/** Encode a frame as the wire payload (magic prefix + JSON). */
export function encodeChatText(frame: ChatTextFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

/** Parse a wire payload into a frame; null when the payload is not a frame. */
export function parseChatText(raw: string): ChatTextFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatTextFrame;
    if (parsed.type !== 'chat-text' || !isSeq(parsed.seq) || typeof parsed.messageId !== 'string') {
      return null;
    }
    // A malformed quote is dropped, not fatal — the message itself still lands.
    const quote = parsed.replyTo;
    if (quote != null && (typeof quote.id !== 'string' || typeof quote.sender !== 'string')) {
      return { ...parsed, replyTo: undefined };
    }
    return parsed;
  } catch {
    return null;
  }
}

export function encodeChatDeliveryAck(frame: ChatDeliveryAckFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

export function parseChatDeliveryAck(raw: string): ChatDeliveryAckFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatDeliveryAckFrame;
    return parsed.type === 'chat-ack' && isSeq(parsed.seq) && typeof parsed.messageId === 'string' && typeof parsed.chatId === 'string'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function encodeChatReadReceipt(frame: ChatReadReceiptFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

export function parseChatReadReceipt(raw: string): ChatReadReceiptFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatReadReceiptFrame;
    return parsed.type === 'chat-read' && isSeq(parsed.seq) && typeof parsed.messageId === 'string' && typeof parsed.chatId === 'string'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export const isNonNegativeInt = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
export const isFiniteNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export interface CallSignalFrame {
  type: 'call-ring' | 'call-accept' | 'call-end';
  seq: number;
  callId: string;
  callType?: 'audio' | 'video';
  timestamp: number;
}

/** Encode a call signal frame as the wire payload (CALL_MAGIC prefix + JSON). */
export function encodeCallSignal(frame: CallSignalFrame): string {
  return CALL_MAGIC + JSON.stringify(frame);
}

/** Parse a call signal frame; null when not a call signal. */
export function parseCallSignal(raw: string): CallSignalFrame | null {
  if (!raw.startsWith(CALL_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(CALL_MAGIC.length)) as CallSignalFrame;
    return (parsed.type === 'call-ring' || parsed.type === 'call-accept' || parsed.type === 'call-end') && isSeq(parsed.seq)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
