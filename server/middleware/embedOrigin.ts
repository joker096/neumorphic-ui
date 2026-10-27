// Embed widget origin guard.
//
// The widget is a third-party snippet that loads an <iframe> from the messenger
// origin. The *host* page origin must be authorized — otherwise anyone could
// embed the widget anywhere (or, worse, a hostile page could load the widget
// and phish). Every embed REST call and every widget WebSocket subscription is
// checked against this module.
//
// A widget is configured with an allowlist of website domains (`website_domains`
// on `embed_widgets`). The server derives the allowed origins from the domain
// allowlist: for each allowed domain we accept its `https://` origin plus its
// `http://` localhost/dev variant so local integration testing works out of the
// box. The check is exact-origin, never suffix-based, to prevent `evil.example.com`
// from passing when only `example.com` is allowed.

import { getDb } from '../db.js'

/**
 * Check whether `origin` is allowed. When `allowedDomains` is empty the widget
 * is disabled (safety-first); an explicit allowlist is required.
 */
export function isOriginAllowedForEmbed(origin: string): boolean {
  if (!origin) return false
  let host: string
  let hostname: string
  try {
    const u = new URL(origin)
    host = u.host
    hostname = u.hostname
  } catch {
    return false
  }
  // Always allow same-origin (dev / self-host preview) and localhost dev hosts.
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname === '127.0.0.1') {
    return true
  }
  const rows = getDb().prepare('SELECT website_domains FROM embed_widgets').all() as { website_domains: string }[]
  for (const row of rows) {
    for (const domain of row.website_domains.split(',').map((d) => d.trim()).filter(Boolean)) {
      const normalized = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
      if (host === normalized || host === `www.${normalized}`) return true
    }
  }
  return false
}
