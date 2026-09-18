/**
 * Persistence for recorded voice notes.
 *
 * Voice messages are captured as an `audio/webm` Blob and referenced from the
 * chat history by an object URL, which dies on reload. Storing the Blob in
 * IndexedDB lets us rebuild a fresh object URL whenever the message is shown,
 * so a recorded note stays playable after a restart (and instead of falling
 * back to synthesized noise).
 */

import { set, get, del } from './idb';

const VOICE_PREFIX = 'voice_blob_';

function voiceKey(id: string | number): string {
  return `${VOICE_PREFIX}${id}`;
}

export async function saveVoiceBlob(id: string | number, blob: Blob): Promise<void> {
  await set(voiceKey(id), blob);
}

export async function getVoiceBlob(id: string | number): Promise<Blob | undefined> {
  const value = await get<Blob>(voiceKey(id));
  return value instanceof Blob ? value : undefined;
}

export async function deleteVoiceBlob(id: string | number): Promise<void> {
  await del(voiceKey(id));
}

/**
 * Best-effort capture of a freshly recorded voice note into IndexedDB.
 * Accepts the live Blob (preferred — no fetch round-trip) or an object URL
 * (legacy path). Never throws: persistence must not break sending.
 */
export async function persistVoiceBlob(id: string | number, source: Blob | string): Promise<void> {
  if (!source) return;
  try {
    let blob: Blob;
    if (source instanceof Blob) {
      blob = source;
    } else {
      const resp = await fetch(source);
      if (!resp.ok) return;
      blob = await resp.blob();
    }
    if (!blob || blob.size === 0) return;
    await saveVoiceBlob(id, blob);
  } catch {
    /* best effort */
  }
}
