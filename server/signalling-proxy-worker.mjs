/**
 * Cloudflare Workers reverse proxy for the signalling relay.
 *
 * Why: a single-host app has no resilience when the one domain is DNS-hijacked,
 * geo-poisoned or unroutable under a VPN. This worker re-exposes mess.cvr.name
 * on Cloudflare's own IPs (free Workers plan: 100k requests/day — far beyond a
 * messenger's signalling chatter), giving the client a second DNS path to the
 * same origin.
 *
 * It proxies BOTH:
 *   - WebSocket upgrade  -> wss://mess.cvr.name<path>  (the signalling tunnel)
 *   - REST /api/auth/*    -> https://mess.cvr.name<path> (relay token issue)
 *
 * Deploy (needs a Cloudflare account, free tier is enough):
 *   wrangler deploy server/signalling-proxy-worker.mjs --name signalling-relay-fallback
 *
 * Then build the app with both seeds; the pool rotates to this host
 * automatically once the primary fails (see SignallingPool.getNextAvailable):
 *   VITE_SIGNALING_SEED_URLS="wss://mess.cvr.name/ws,wss://signalling-relay-fallback.<your-subdomain>.workers.dev/ws"
 *
 * No app-code change required: the REST base derives from SIGNALING_SEED_URLS[0],
 * so keep mess.cvr.name first while its DNS is healthy.
 */

const ORIGIN_HOST = 'mess.cvr.name';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const isUpgrade = (request.headers.get('upgrade') || '').toLowerCase() === 'websocket';

    const target = new URL(url.pathname + url.search, `https://${ORIGIN_HOST}`);
    target.protocol = isUpgrade ? 'wss:' : 'https:';

    const headers = new Headers(request.headers);
    // The origin vhost routes on Host; leaving the worker host would 404.
    headers.set('host', ORIGIN_HOST);

    return fetch(
      new Request(target.toString(), {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      }),
    );
  },
};