/**
 * JSON frame protocol for P2P chat text messages
 * Frames travel as raw string payloads over `p2pNetwork.broadcast()`
 * The receiving peer's identity is the wire `BroadcastMessage.senderId`,
 * not a field inside the frame.
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

const isSeq = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;

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
    return parsed.type === 'chat-text' && isSeq(parsed.seq) && typeof parsed.messageId === 'string'
      ? parsed
      : null;
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
