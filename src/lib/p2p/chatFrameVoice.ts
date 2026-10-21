/**
 * Voice message frames: meta/chunk/end plus the size budgets and duration
 * string helpers those parsers validate against.
 */

import { MSG_MAGIC, isSeq, isNonNegativeInt } from './chatFrameCore';

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
