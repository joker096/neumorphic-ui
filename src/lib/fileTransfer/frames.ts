/**
 * JSON frame protocol for P2P file transfers
 * Frames travel as raw string payloads over `p2pNetwork.broadcast()`
 *
 * Strict mode: every frame carries a payload-level `seq` (per-sender
 * monotonic counter). Frames without a valid `seq` are legacy and
 * rejected — `parseFrame` returns `null` for them.
 */

export const FTR_MAGIC = 'ftr1:';

let frameCounter = 0;

/** Next per-sender payload sequence (strict-mode anti-legacy + payload anti-replay). */
export function nextFileSeq(): number {
  frameCounter += 1;
  return frameCounter;
}

const isSeq = (n: unknown): n is number => Number.isSafeInteger(n) && (n as number) >= 0;
const isStr = (n: unknown): n is string => typeof n === 'string' && n.length > 0;
const isNum = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

/** Transfer metadata carried by the `meta` frame and persisted in fileStore. */
export interface TransferMeta {
  transferId: string;
  name: string;
  mime: string;
  size: number;
  chunkSize: number;
  totalChunks: number;
  sha256: string;
  senderPeerId: string;
  senderName: string;
  /** Round video-note bubble marker (Telegram-parity video notes). */
  videoNote?: boolean;
  /**
   * Remaining self-destruct duration for the receiver (ms). Omitted when the
   * message never expires; validated on receipt by `resolveInboundSelfDestruct`.
   */
  ttlMs?: number;
}

export type FtrFrame =
  | ({ type: 'meta'; seq: number } & TransferMeta)
  | { type: 'chunk'; seq: number; transferId: string; index: number; data: string }
  | { type: 'end'; seq: number; transferId: string };

/** Encode a frame as the wire payload (magic prefix + JSON). */
export function encodeFrame(frame: FtrFrame): string {
  return FTR_MAGIC + JSON.stringify(frame);
}

/** Parse a wire payload into a frame; null when invalid, legacy or not a frame. */
export function parseFrame(raw: string): FtrFrame | null {
  if (!raw.startsWith(FTR_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(FTR_MAGIC.length)) as FtrFrame;
    if (!isSeq(parsed.seq)) return null;
    switch (parsed.type) {
      case 'meta':
        return isStr(parsed.transferId) &&
          isStr(parsed.name) &&
          isStr(parsed.mime) &&
          isNum(parsed.size) &&
          parsed.size >= 0 &&
          isNum(parsed.chunkSize) &&
          parsed.chunkSize > 0 &&
          isNum(parsed.totalChunks) &&
          parsed.totalChunks > 0 &&
          isStr(parsed.sha256) &&
          isStr(parsed.senderPeerId)
          ? parsed
          : null;
      case 'chunk':
        return isStr(parsed.transferId) &&
          Number.isSafeInteger(parsed.index) &&
          (parsed.index as number) >= 0 &&
          isStr(parsed.data)
          ? parsed
          : null;
      case 'end':
        return isStr(parsed.transferId) ? parsed : null;
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/** Album group: a multi-file message assembled from N individual FTR transfers.
 * Sender streams each file as its own meta/chunk/end sequence, then emits ONE
 * album manifest AFTER the last `end` so the receiver already holds every transfer
 * before the album bubble is rendered. Each manifest `entry.transferId` maps to a
 * completed (or completing) transfer; per-tile blob URLs resolve via useFtrBlobUrl.
 */
export const ALBUM_MAGIC = 'abm1:';

export interface AlbumEntry {
  transferId: string;
  name: string;
  mime: string;
  size: number;
}

export interface AlbumManifest {
  albumId: string;
  messageId: number;
  chatId: string;
  chatName: string;
  senderName: string;
  timestamp: number;
  silent?: boolean;
  entries: AlbumEntry[];
  /** Remaining self-destruct duration for the receiver (ms); see `TransferMeta.ttlMs`. */
  ttlMs?: number;
}

/** Encode an album manifest (magic prefix + JSON). */
export function encodeAlbumManifest(manifest: AlbumManifest): string {
  return ALBUM_MAGIC + JSON.stringify(manifest);
}

/** Parse a wire payload into an album manifest; null when invalid/legacy. */
export function parseAlbumManifest(raw: string): AlbumManifest | null {
  if (!raw.startsWith(ALBUM_MAGIC)) return null;
  try {
    const p = JSON.parse(raw.slice(ALBUM_MAGIC.length)) as AlbumManifest;
    if (!isStr(p.albumId) || !isStr(p.chatId) || !isStr(p.chatName) || !isStr(p.senderName)) return null;
    if (!Number.isSafeInteger(p.messageId) || !isNum(p.timestamp)) return null;
    if (!Array.isArray(p.entries) || p.entries.length < 2) return null;
    for (const e of p.entries) {
      if (!isStr(e?.transferId) || !isStr(e?.name) || !isStr(e?.mime) || !isNum(e?.size) || (e?.size as number) < 0) return null;
    }
    return p;
  } catch {
    return null;
  }
}

/** Encode binary chunk data as a base64 payload (btoa is not binary-safe per-call). */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    binary += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(binary);
}

/** Decode a base64 chunk payload back to binary. */
export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
