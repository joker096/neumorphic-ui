/**
 * Signalling server seed URLs.
 *
 * `VITE_SIGNALING_SEED_URLS` can override the default seed list with a
 * comma-separated list of `wss://` endpoints. Invalid entries are dropped and
 * the default seed is restored when no valid override remains.
 *
 * Multi-seed = resilience: the SignallingPool rotates to the next host when the
 * first one fails (see `SignallingPool.getNextAvailable`), and the relay token
 * endpoint derives from `SIGNALING_SEED_URLS[0]`. For VPN / DNS-poisoning
 * resilience a free Cloudflare Workers proxy of the same origin is provided in
 * `server/signalling-proxy-worker.mjs` — add its URL as the second seed:
 *   VITE_SIGNALING_SEED_URLS="wss://mess.cvr.name/ws,wss://<worker>.workers.dev/ws"
 */
const DEFAULT_SIGNALING_SEED_URLS = ['wss://mess.cvr.name/ws'];

const envSeedUrls = import.meta.env.VITE_SIGNALING_SEED_URLS as string | undefined;
const parsedSeedUrls = typeof envSeedUrls === 'string'
  ? envSeedUrls
      .split(',')
      .map((url: string) => url.trim())
      .filter((url: string) => url.startsWith('wss://'))
  : [];

export const SIGNALING_SEED_URLS: string[] =
  parsedSeedUrls.length > 0 ? parsedSeedUrls : DEFAULT_SIGNALING_SEED_URLS;
