/**
 * Rich chat frames (geolocation, article/site-link) — same JSON wire
 * protocol as `chatFrame.ts` (shared `MSG_MAGIC`), split out to keep each
 * codec module small. Parsers are strict: every optional field is validated
 * on receipt because the wire is untrusted input.
 */
import { MSG_MAGIC, isSeq, isNonNegativeInt, isFiniteNum } from './chatFrame';

/** Geolocation share carried as a single text-wire frame (no bytes). */
export interface ChatLocationFrame {
  type: 'chat-location';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  lat: number;
  lng: number;
  silent: boolean;
  timestamp: number;
  /** Remaining self-destruct duration; omitted when the message never expires. */
  ttlMs?: number;
  /**
   * Live-location updates reuse `messageId` and patch the same bubble. Every
   * field below is optional so that a peer speaking only the old dialect still
   * accepts the frame and simply renders a static pin.
   */
  live?: boolean;
  /** Absolute stop time. The receiver expires even if the final frame is lost. */
  expiresAt?: number;
  /** True when the sender deliberately blurred the coordinates. */
  approximate?: boolean;
  /** Reported horizontal accuracy in metres. */
  accuracy?: number;
}

/** Article/site-link share carried as a single text-wire frame. */
export interface ChatArticleFrame {
  type: 'chat-article';
  seq: number;
  messageId: string;
  chatId: string;
  chatName: string;
  senderName: string;
  url: string;
  title?: string;
  silent: boolean;
  timestamp: number;
  /** Remaining self-destruct duration; omitted when the message never expires. */
  ttlMs?: number;
}

export function encodeChatLocation(frame: ChatLocationFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

export function parseChatLocation(raw: string): ChatLocationFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatLocationFrame;
    if (!(parsed.type === 'chat-location' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && isFiniteNum(parsed.lat)
      && isFiniteNum(parsed.lng)
      && typeof parsed.silent === 'boolean'
      && isNonNegativeInt(parsed.timestamp))) {
      return null;
    }
    // The live fields are optional, but a present field must be well formed: a
    // non-finite expiry or a non-boolean flag would otherwise reach the
    // renderer and be printed as "[object Object]" or NaN.
    if (parsed.expiresAt !== undefined && !isNonNegativeInt(parsed.expiresAt)) return null;
    if (parsed.accuracy !== undefined && !(isFiniteNum(parsed.accuracy) && parsed.accuracy >= 0)) return null;
    if (parsed.live !== undefined && typeof parsed.live !== 'boolean') return null;
    if (parsed.approximate !== undefined && typeof parsed.approximate !== 'boolean') return null;
    // The wire is untrusted input: a peer could claim a latitude of 90.5 (not
    // a real point) or 1e9. Reject rather than hand nonsense to the renderer.
    if (parsed.lat < -90 || parsed.lat > 90) return null;
    if (parsed.lng < -180 || parsed.lng > 180) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function encodeChatArticle(frame: ChatArticleFrame): string {
  return MSG_MAGIC + JSON.stringify(frame);
}

export function parseChatArticle(raw: string): ChatArticleFrame | null {
  if (!raw.startsWith(MSG_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(MSG_MAGIC.length)) as ChatArticleFrame;
    return parsed.type === 'chat-article' && isSeq(parsed.seq)
      && typeof parsed.messageId === 'string'
      && typeof parsed.chatId === 'string'
      && typeof parsed.chatName === 'string'
      && typeof parsed.senderName === 'string'
      && typeof parsed.url === 'string'
      && (parsed.title === undefined || typeof parsed.title === 'string')
      && typeof parsed.silent === 'boolean'
      && isNonNegativeInt(parsed.timestamp)
      ? parsed
      : null;
  } catch {
    return null;
  }
}
