/**
 * Signalling server seed URLs.
 *
 * `VITE_SIGNALING_SEED_URLS` explicitly opts a deployment into one or more
 * comma-separated `wss://` endpoints. Invalid entries are dropped. With no
 * valid setting, the client is serverless and makes no relay connection.
 *
 * Multi-seed = resilience: the SignallingPool rotates to the next host when the
 * first one fails (see `SignallingPool.getNextAvailable`). The relay token
 * endpoint derives from `SIGNALING_SEED_URLS[0]` when the operator opted in.
 */
const envSeedUrls = import.meta.env.VITE_SIGNALING_SEED_URLS as string | undefined;
const parsedSeedUrls = typeof envSeedUrls === 'string'
  ? envSeedUrls
      .split(',')
      .map((url: string) => url.trim())
      .filter((url: string) => url.startsWith('wss://'))
  : [];

export const SIGNALING_SEED_URLS: string[] =
  parsedSeedUrls;
