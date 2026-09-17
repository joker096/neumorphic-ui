/**
 * Signalling server seed URLs.
 *
 * `VITE_SIGNALING_SEED_URLS` explicitly opts a deployment into one or more
 * comma-separated `wss://` endpoints. Invalid entries are dropped.
 *
 * With no valid setting the client falls back to its own origin
 * (`wss://<location.host>/ws`). Every standard server deployment terminates
 * `/ws` at nginx (see `server/*.conf`), so a same-origin build needs no
 * build-time env. A purely static host without a relay surfaces as
 * `connecting` -> `error` instead of a silent `disconnected`.
 *
 * Multi-seed = resilience: the SignallingPool rotates to the next host when the
 * first one fails (see `SignallingPool.getNextAvailable`). The relay token
 * endpoint derives from `SIGNALING_SEED_URLS[0]`.
 */

/** Minimal shape of `window.location` we depend on (keeps this testable). */
export interface SeedLocation {
  protocol: string;
  host: string;
}

/**
 * Resolve the effective seed list.
 *
 * Order: explicit `wss://` env seeds, then the current origin (`/ws`) when the
 * page is served over http(s). Non-DOM contexts (SSR / Node / Tauri without a
 * URL) get an empty list — the caller treats that as serverless.
 */
export function resolveSeedUrls(
  envValue: string | undefined,
  loc: SeedLocation | null,
): string[] {
  const parsed = typeof envValue === 'string'
    ? envValue
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url.startsWith('wss://'))
    : [];
  if (parsed.length > 0) return parsed;

  if (!loc || !loc.host) return [];
  if (loc.protocol === 'https:') return [`wss://${loc.host}/ws`];
  if (loc.protocol === 'http:') return [`ws://${loc.host}/ws`];
  return [];
}

const envSeedUrls = import.meta.env.VITE_SIGNALING_SEED_URLS as string | undefined;
const browserLocation: SeedLocation | null =
  typeof window !== 'undefined' && window.location
    ? { protocol: window.location.protocol, host: window.location.host }
    : null;

export const SIGNALING_SEED_URLS: string[] = resolveSeedUrls(envSeedUrls, browserLocation);
