/**
 * JSON frame protocol for P2P chat text messages
 * Frames travel as raw string payloads over `p2pNetwork.broadcast()`
 * The receiving peer's identity is the wire `BroadcastMessage.senderId`,
 * not a field inside the frame.
 *
 * Strict mode: every frame carries a payload-level `seq` (per-sender
 * monotonic counter). Frames without a valid `seq`/`messageId` are legacy
 * and always rejected — parsers return `null` for them.
 *
 * Self-destruct: message-creating frames may carry `ttlMs`, the *remaining*
 * duration in ms — never an absolute deadline, so a skewed clock can neither
 * delete the message on arrival nor make it immortal. The field is optional
 * (legacy peers omit it) and validated on receipt by `resolveInboundSelfDestruct`,
 * so junk degrades to "no timer" instead of dropping the message.
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

export interface ChatAudioMetaFrame {
  type: 'chat-audio-meta';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  duration: number;
  mime: string;
  size: number;
  chunkSize: number;
  totalChunks: number;
  sha256: string;
  timestamp: number;
  /** Remaining self-destruct duration; omitted when the message never expires. */
  ttlMs?: number;
}

export interface ChatAudioChunkFrame {
  type: 'chat-audio-chunk';
  seq: number;
  messageId: string;
  index: number;
  data: string;
}

export interface ChatAudioEndFrame {
  type: 'chat-audio-end';
  seq: number;
  messageId: string;
}

const isPositiveInt = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) > 0;
export const isNonNegativeInt = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
export const isFiniteNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export function encodeChatAudioMeta(frame: ChatAudioMetaFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

export function parseChatAudioMeta(raw: string): ChatAudioMetaFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatAudioMetaFrame;
    return parsed.type === 'chat-audio-meta' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && isNonNegativeInt(parsed.duration)
      && typeof parsed.mime === 'string'
      && isPositiveInt(parsed.size)
      && isPositiveInt(parsed.chunkSize)
      && isPositiveInt(parsed.totalChunks)
      && typeof parsed.sha256 === 'string'
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function encodeChatAudioChunk(frame: ChatAudioChunkFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

export function parseChatAudioChunk(raw: string): ChatAudioChunkFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatAudioChunkFrame;
    return parsed.type === 'chat-audio-chunk' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && isNonNegativeInt(parsed.index)
      && typeof parsed.data === 'string'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function encodeChatAudioEnd(frame: ChatAudioEndFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

export function parseChatAudioEnd(raw: string): ChatAudioEndFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatAudioEndFrame;
    return parsed.type === 'chat-audio-end' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export const VOICE_P2P_CHUNK_SIZE = 46080;
export const VOICE_P2P_MAX_SIZE = 32 * 1024 * 1024;
export const VOICE_P2P_MAX_CHUNKS = 4096;

/** Parse a `"m:ss"` voice duration string into seconds. */
export function parseDurationStr(duration: string): number {
  const trimmed = String(duration ?? '').trim();
  if (!trimmed) return 0;
  let total = 0;
  for (const part of trimmed.split(':')) {
    const value = Number.parseInt(part, 10);
    if (!Number.isFinite(value) || value < 0) return 0;
    total = total * 60 + value;
  }
  return total;
}

/** Format seconds as the `"m:ss"` voice duration string used by chat UI. */
export function formatDurationStr(seconds: number): string {
  const normalized = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(normalized / 60);
  const secs = normalized % 60;
  return `${minutes}:${String(secs).padStart(2, '0')}`;
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
