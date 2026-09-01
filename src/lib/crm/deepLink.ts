/**
 * Deep-link support for CRM import.
 *
 * Supported entry points (decoded locally, NO network, NO telemetry):
 *  - `?crmImport=<base64>` query param (CSV or JSON payload)
 *  - `messanger://import?data=<base64>`
 *
 * The decoded payload is handed to the SDK import path.
 */

import type { MessAngerSdk } from '../sdk';

export interface DeepLinkResult {
  source: 'query' | 'scheme';
  text: string;
}

function b64Decode(input: string): string {
  try {
    if (typeof atob === 'function') return atob(input);
    // Node fallback
    return Buffer.from(input, 'base64').toString('utf-8');
  } catch {
    return '';
  }
}

function fromQuery(qs: string): string | null {
  try {
    const sp = new URLSearchParams(qs.startsWith('?') ? qs.slice(1) : qs);
    const raw = sp.get('crmImport') || sp.get('data');
    return raw ? b64Decode(raw) : null;
  } catch {
    return null;
  }
}

export function parseCrmDeepLink(search: string, hash?: string): DeepLinkResult | null {
  const q = fromQuery(search);
  if (q) return { source: 'query', text: q };
  if (hash && (hash.startsWith('messanger://') || hash.startsWith('messanger:/'))) {
    const idx = hash.indexOf('data=');
    if (idx >= 0) {
      const raw = decodeURIComponent(hash.slice(idx + 5));
      const text = b64Decode(raw);
      if (text) return { source: 'scheme', text };
    }
  }
  return null;
}

/** Run a deep-link import through the SDK. Returns null when no link present. */
export async function runCrmDeepLink(
  sdk: MessAngerSdk,
  search: string,
  hash?: string,
): Promise<{ imported: number } | null> {
  const parsed = parseCrmDeepLink(search, hash);
  if (!parsed) return null;
  const res = await sdk.importText(parsed.text);
  return { imported: res.imported };
}
