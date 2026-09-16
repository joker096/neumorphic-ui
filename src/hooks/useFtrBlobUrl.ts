import { useEffect, useState } from 'react';
import { resolveFtrBlobUrl, FTR_POLL_MS, FTR_POLL_MAX } from '../lib/fileTransfer/fileStore';

/**
 * Resolve an `ftr1:` P2P transfer id to a cached blob URL.
 * Polls while the transfer is still assembling; null while pending/failed.
 */
export function useFtrBlobUrl(ftrId: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ftrId) {
      setUrl(null);
      return undefined;
    }
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;
    const tick = async () => {
      let entry: { url: string; shaOk: boolean } | null = null;
      try {
        entry = await resolveFtrBlobUrl(ftrId);
      } catch {
        entry = null;
      }
      if (!entry) {
        if (!cancelled && attempts < FTR_POLL_MAX) {
          attempts += 1;
          timer = window.setTimeout(() => { void tick(); }, FTR_POLL_MS);
        }
        return;
      }
      if (!cancelled) setUrl(entry.url);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [ftrId]);

  return url;
}