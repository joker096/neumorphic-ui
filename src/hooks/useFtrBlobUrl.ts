import { useEffect, useState } from 'react';
import { resolveFtrBlobUrl, FTR_POLL_MS, FTR_POLL_MAX } from '../lib/fileTransfer/fileStore';

/** Resolved transfer: the cached blob URL plus its integrity verdict. */
export interface FtrBlobEntry {
  url: string;
  /** false when the reassembled blob's sha256 did not match the sent digest. */
  shaOk: boolean;
}

/**
 * Resolve an `ftr1:` P2P transfer id to a cached blob URL.
 * Polls while the transfer is still assembling; null while pending/failed.
 *
 * `active` gates the polling entirely so a caller can hold off resolving until
 * the user actually asks for the media (the `mediaAutoLoad` setting).
 */
export function useFtrBlobUrl(ftrId: string | null, active = true): FtrBlobEntry | null {
  const [entry, setEntry] = useState<FtrBlobEntry | null>(null);

  useEffect(() => {
    if (!ftrId || !active) {
      setEntry(null);
      return undefined;
    }
    let cancelled = false;
    let timer: number | undefined;
    let attempts = 0;
    const tick = async () => {
      let resolved: FtrBlobEntry | null = null;
      try {
        resolved = await resolveFtrBlobUrl(ftrId);
      } catch {
        resolved = null;
      }
      if (!resolved) {
        if (!cancelled && attempts < FTR_POLL_MAX) {
          attempts += 1;
          timer = window.setTimeout(() => { void tick(); }, FTR_POLL_MS);
        }
        return;
      }
      if (!cancelled) setEntry(resolved);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [ftrId, active]);

  return entry;
}