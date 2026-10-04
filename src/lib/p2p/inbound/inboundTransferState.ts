import type { AlbumManifest, TransferMeta } from "../../fileTransfer/frames";
import type { ChatAudioMetaFrame } from "../chatFrame";

/**
 * Module-level dedupe: `p2pNetwork.onMessage` has no unsubscribe, so StrictMode
 * double-mounts and multi-transport delivery can invoke handlers repeatedly.
 * Each wire `messageId` is processed exactly once per page.
 */
export const processedMessageIds = new Set<string>();
export const PROCESSED_ID_LIMIT = 1000;

/** In-memory transfer state for incoming files (meta → received chunk indices). */
export const incomingMetas = new Map<string, TransferMeta>();
export const incomingChunkIndices = new Map<string, Set<number>>();
export const incomingAudioMetas = new Map<string, ChatAudioMetaFrame>();
export const incomingAudioChunks = new Map<string, Map<number, Uint8Array>>();
/** Album state: manifest per albumId + the chat each album transferId belongs to
 * (their per-file meta frames must NOT render as separate single-file bubbles, and
 * they are authorized against the same chat the manifest was authorized for). */
export const incomingAlbums = new Map<string, AlbumManifest>();
export const albumChatByTransferId = new Map<string, any>();
export const ALBUM_STATE_LIMIT = 500;