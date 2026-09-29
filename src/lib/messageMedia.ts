/**
 * Single owner of "a deleted message must not leave bytes behind".
 *
 * Deleting a message only ever touched the store snapshot. Everything the
 * bubble owned elsewhere — the voice Blob in IndexedDB, the assembled file
 * transfer (meta + chunks + the resolved blob URL), the live `audioUrl` object
 * URL minted at send/receive time — survived the delete, so both bytes and
 * object URLs accumulated for the lifetime of the tab.
 *
 * `useSelfDestructSweep` already had this logic for expired messages, but as a
 * private copy. The manual single/batch delete path had no cleanup at all. Both
 * now go through `releaseMessageMedia`, so "deleted" means erased everywhere.
 */

import { deleteVoiceBlob } from './voiceStore';
import { deleteTransfer } from './fileTransfer/fileStore';
import { collectMessageMedia, type ExpiredMedia } from './selfDestruct';

/** Only `blob:` URLs are ours to revoke; never touch a remote/relative src. */
function revokeIfBlob(url: unknown): void {
  if (typeof url !== 'string' || !url.startsWith('blob:')) return;
  try {
    URL.revokeObjectURL(url);
  } catch {
    /* already revoked or unsupported — nothing to clean */
  }
}

/** The transient object URL a voice bubble was sent/received with, if any. */
function liveAudioUrlOf(msg: any): string | undefined {
  const url = msg?.audioUrl;
  return typeof url === 'string' ? url : undefined;
}

/**
 * Best-effort erasure of the media owned by messages that are being removed.
 *
 * Never throws and never rejects: a storage failure must not leave the message
 * on screen. Revocation happens synchronously before the awaits, so a failing
 * store still cannot leak the object URL.
 */
export async function releaseMessageMedia(messages: any[] | undefined): Promise<void> {
  if (!messages?.length) return;

  const media: ExpiredMedia = { voiceIds: [], transferIds: [] };
  for (const msg of messages) {
    if (!msg) continue;
    collectMessageMedia(msg, media);
    revokeIfBlob(liveAudioUrlOf(msg));
  }

  await Promise.all([
    ...media.voiceIds.map(async (id) => {
      try {
        await deleteVoiceBlob(id);
      } catch {
        /* keep erasing the rest */
      }
    }),
    ...media.transferIds.map(async (id) => {
      try {
        await deleteTransfer(id);
      } catch {
        /* keep erasing the rest */
      }
    }),
  ]);
}
