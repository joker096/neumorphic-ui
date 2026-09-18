import { useEffect, useState } from 'react';
import { getVoiceBlob } from '../lib/voiceStore';

/**
 * Resolves a playable URL for a voice note.
 *
 * Prefers the Blob persisted in IndexedDB (survives reloads) and falls back to
 * the transient URL on the message while the async read is in flight.
 */
export function useVoiceBlobUrl(voiceId?: string | number, fallbackUrl?: string): string | undefined {
  const [url, setUrl] = useState<string | undefined>(fallbackUrl || undefined);

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;

    const resolve = async () => {
      if (voiceId === undefined || voiceId === null || voiceId === '') {
        if (active) setUrl(fallbackUrl || undefined);
        return;
      }
      const blob = await getVoiceBlob(voiceId);
      if (!active) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } else {
        setUrl(fallbackUrl || undefined);
      }
    };

    void resolve();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [voiceId, fallbackUrl]);

  return url;
}
