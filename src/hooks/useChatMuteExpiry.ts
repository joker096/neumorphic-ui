import { useEffect } from 'react';
import { useAppStore } from '../store';

/** How often timed chat mutes are checked. Cheap: the sweep is identity-preserving. */
export const MUTE_SWEEP_INTERVAL_MS = 30_000;

/**
 * Clearing of timed chat mutes ("Mute for 1 hour" and friends).
 *
 * The mute deadline is absolute, so it must also be honoured after the app was
 * closed — hence the immediate pass on mount, not only the interval. The store
 * action returns no patch when nothing expired, so an idle tick never triggers a
 * persistence write.
 */
export function useChatMuteExpiry(): void {
  const expireChatMutes = useAppStore((s) => s.expireChatMutes);

  useEffect(() => {
    if (!expireChatMutes) return;
    expireChatMutes();
    const id = setInterval(() => expireChatMutes(), MUTE_SWEEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [expireChatMutes]);
}
