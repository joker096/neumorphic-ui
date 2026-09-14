/**
 * JSON frame protocol for P2P file transfers
 * Frames travel as raw string payloads over `p2pNetwork.broadcast()`
 */

export const FTR_MAGIC = 'ftr1:';

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
}

export type FtrFrame =
  | ({ type: 'meta' } & TransferMeta)
  | { type: 'chunk'; transferId: string; index: number; data: string }
  | { type: 'end'; transferId: string };

/** Encode a frame as the wire payload (magic prefix + JSON). */
export function encodeFrame(frame: FtrFrame): string {
  return FTR_MAGIC + JSON.stringify(frame);
}

/** Parse a wire payload into a frame; null when the payload is not a frame. */
export function parseFrame(raw: string): FtrFrame | null {
  if (!raw.startsWith(FTR_MAGIC)) return null;
  try {
    const parsed = JSON.parse(raw.slice(FTR_MAGIC.length)) as FtrFrame;
    return parsed.type === 'meta' || parsed.type === 'chunk' || parsed.type === 'end' ? parsed : null;
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
