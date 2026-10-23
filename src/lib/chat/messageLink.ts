/**
 * Deep links to a single message.
 *
 * Supported entry points (decoded locally, NO network, NO telemetry):
 *  - hash: `#nexus://chat/<chatId>/<messageId>`
 *  - query: `?msg=<chatId>:<messageId>`
 *
 * Chat ids are local to this device (the P2P protocol addresses peers, not
 * chats), so a link is only guaranteed to resolve on the client that produced
 * it. Unknown/unparseable links return null and the boot handler stays silent.
 */

export interface MessageLink {
  chatId: string | number;
  messageId: string | number;
}

const HASH_PREFIX = '#nexus://chat/';

function coerce(raw: string): string | number {
  return /^\d+$/.test(raw) ? Number(raw) : raw;
}

/** Builds an absolute link when an origin is given, a path-only hash otherwise. */
export function buildMessageLink(
  chatId: string | number,
  messageId: string | number,
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
): string {
  const path = `${HASH_PREFIX}${encodeURIComponent(String(chatId))}/${encodeURIComponent(String(messageId))}`;
  return `${origin}/${path}`;
}

export function parseMessageLink(hash?: string, search?: string): MessageLink | null {
  if (hash) {
    const at = hash.indexOf(HASH_PREFIX);
    if (at >= 0) {
      const [rawChat, rawMessage] = hash.slice(at + HASH_PREFIX.length).split('/');
      if (rawChat && rawMessage) {
        try {
          return { chatId: coerce(decodeURIComponent(rawChat)), messageId: coerce(decodeURIComponent(rawMessage)) };
        } catch {
          return null;
        }
      }
    }
  }
  if (search) {
    try {
      const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
      const raw = params.get('msg');
      if (raw) {
        const [rawChat, rawMessage] = raw.split(':');
        if (rawChat && rawMessage) return { chatId: coerce(rawChat), messageId: coerce(rawMessage) };
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** Strips a handled message deep link so it does not re-trigger on reload. */
export function clearMessageLink(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('msg');
    if (url.hash.includes(HASH_PREFIX)) url.hash = '';
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* ignore */
  }
}
