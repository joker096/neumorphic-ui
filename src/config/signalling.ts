/**
 * Signalling server seed URLs.
 *
 * `VITE_SIGNALING_SEED_URLS` can override the default seed list with a
 * comma-separated list of `wss://` endpoints. Invalid entries are dropped and
 * the default seed is restored when no valid override remains.
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
