import type { StoryUser } from '../../components/stories/storiesData';

const SEEN_STORAGE_KEY = 'nm_stories_seen_v1';

function readSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

function writeSeen(set: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore quota */
  }
}

export function seenStoryKey(userId: number | string, storyId: number): string {
  return `${userId}:${storyId}`;
}

/** Number of visible stories the current viewer has not opened yet. */
export function getUnseenCount(user: StoryUser): number {
  const seen = readSeen();
  return user.stories.filter((s) => !seen.has(seenStoryKey(user.id, s.id))).length;
}

/** Record all stories of a user as seen (idempotent, writes only on change). */
export function markStoriesSeen(user: StoryUser): void {
  const seen = readSeen();
  let changed = false;
  user.stories.forEach((s) => {
    const key = seenStoryKey(user.id, s.id);
    if (!seen.has(key)) {
      seen.add(key);
      changed = true;
    }
  });
  if (changed) writeSeen(seen);
}