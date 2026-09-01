/**
 * Embed token + snippet generation for the site-chat widget.
 *
 * The token is a base64url-encoded JSON config carrying the public channel
 * inbox key (already public material) — no secret leaves the company. A
 * visitor's browser derives the same E2E key from this public key + an
 * ephemeral guest keypair (see embedCrypto.ts).
 */

import { b64encode, b64decode } from '../crypto/cryptoCore';

export interface EmbedConfig {
  v: 1;
  companyId: string;
  channelId: string;
  relayUrl?: string;
  channelPubKeyB64: string;
  label?: string;
}

function b64urlEncode(s: string): string {
  return b64encode(new TextEncoder().encode(s))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 ? norm + '='.repeat(4 - (norm.length % 4)) : norm;
  return new TextDecoder().decode(b64decode(pad));
}

export function createEmbedToken(cfg: Omit<EmbedConfig, 'v'>): string {
  const full: EmbedConfig = { v: 1, ...cfg };
  return b64urlEncode(JSON.stringify(full));
}

export function parseEmbedToken(token: string): EmbedConfig {
  const obj = JSON.parse(b64urlDecode(token)) as Partial<EmbedConfig>;
  if (obj?.v !== 1 || !obj.companyId || !obj.channelId || !obj.channelPubKeyB64) {
    throw new Error('invalid embed token');
  }
  return obj as EmbedConfig;
}

export function generateEmbedSnippet(
  token: string,
  widgetUrl = 'https://messanger.app/embed.js',
): string {
  return `<script src="${widgetUrl}" data-messanger-token="${token}" async></script>`;
}
