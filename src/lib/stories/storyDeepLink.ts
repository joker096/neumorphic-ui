/**
 * Deep-link support for stories.
 *
 * Supported entry points (decoded locally, NO network, NO telemetry):
 *  - hash: `#nexus://story/<userId>/<storyId>`
 *  - query: `?story=<userId>:<storyId>`
 *
 * The resolved ids drive the story viewer; unknown/unparseable links return null.
 */

export interface StoryDeepLink {
  source: 'query' | 'scheme';
  userId: number | string;
  storyId: number;
}

export function parseStoryDeepLink(hash?: string, search?: string): StoryDeepLink | null {
  if (hash) {
    const m = hash.match(/nexus:\/\/story\/([^/]+)\/(\d+)/);
    if (m) {
      const userId = /^\d+$/.test(m[1]) ? Number(m[1]) : m[1];
      return { source: 'scheme', userId, storyId: Number(m[2]) };
    }
  }
  if (search) {
    try {
      const sp = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
      const raw = sp.get('story');
      if (raw) {
        const [uid, sid] = raw.split(':');
        const storyId = Number(sid);
        if (uid && sid && Number.isFinite(storyId)) {
          return { source: 'query', userId: /^\d+$/.test(uid) ? Number(uid) : uid, storyId };
        }
      }
    } catch {
      return null;
    }
  }
  return null;
}

/** Strip a handled story deep link from the URL so it does not re-trigger on reload. */
export function clearStoryDeepLink(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('story');
    if (url.hash.startsWith('#nexus://story/')) url.hash = '';
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* ignore */
  }
}
