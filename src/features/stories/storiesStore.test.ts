import { describe, it, expect, beforeEach } from 'vitest';
import { useStoriesStore, selectAuthorUnseen, selectUnseenTotal } from './storiesStore';
import { filterVisibleAuthors } from './api';
import type { StoryAuthor } from './types';

function makeAuthor(id: string, stories: number, seen: boolean): StoryAuthor {
  return {
    id,
    name: `A ${id}`,
    avatarUrl: 'https://example.com/a.png',
    stories: Array.from({ length: stories }, (_, i) => ({
      id: `${id}s${i}`,
      authorId: id,
      media: { kind: 'image' as const, src: 'https://example.com/s.png' },
      createdAt: new Date(Date.now() - 1000).toISOString(),
      viewsCount: 0,
      likesCount: 0,
      likedByMe: false,
      viewedByMe: seen,
    })),
  };
}

describe('storiesStore', () => {
  beforeEach(() => {
    useStoriesStore.setState({ authors: [], authorIdx: null, storyIdx: null, paused: false, muted: false, loading: false });
  });

  it('opens the viewer on an author', () => {
    const { openViewer } = useStoriesStore.getState();
    useStoriesStore.setState({ authors: [makeAuthor('a', 2, false), makeAuthor('b', 1, false)] });
    openViewer('b');
    const s = useStoriesStore.getState();
    expect(s.authorIdx).toBe(1);
    expect(s.storyIdx).toBe(0);
  });

  it('navigates next across authors and closes at the end', () => {
    const { openViewer, next } = useStoriesStore.getState();
    useStoriesStore.setState({ authors: [makeAuthor('a', 1, false), makeAuthor('b', 1, false)] });
    openViewer('a');
    next();
    expect(useStoriesStore.getState().authorIdx).toBe(1);
    next();
    expect(useStoriesStore.getState().authorIdx).toBeNull();
  });

  it('marks a story viewed', () => {
    const { openViewer, markViewed } = useStoriesStore.getState();
    useStoriesStore.setState({ authors: [makeAuthor('a', 1, false)] });
    openViewer('a');
    markViewed('as0');
    expect(selectAuthorUnseen(useStoriesStore.getState().authors[0])).toBe(0);
  });

  it('toggles a like without going negative', () => {
    const { toggleLike } = useStoriesStore.getState();
    useStoriesStore.setState({ authors: [makeAuthor('a', 1, false)] });
    toggleLike('as0');
    const s = useStoriesStore.getState().authors[0].stories[0];
    expect(s.likedByMe).toBe(true);
    expect(s.likesCount).toBe(1);
    toggleLike('as0');
    expect(useStoriesStore.getState().authors[0].stories[0].likesCount).toBe(0);
  });

  it('selectUnseenTotal sums unviewed stories', () => {
    const authors = [makeAuthor('a', 2, false), makeAuthor('b', 1, true)];
    expect(selectUnseenTotal(authors)).toBe(2);
    expect(selectAuthorUnseen(authors[1])).toBe(0);
  });
});

describe('filterVisibleAuthors', () => {
  it('keeps only authors with stories from the last 24h', () => {
    const old: StoryAuthor = {
      id: 'old',
      name: 'old',
      avatarUrl: '',
      stories: [{ id: 'o', authorId: 'old', media: { kind: 'image', src: '' }, createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), viewsCount: 0, likesCount: 0, likedByMe: false, viewedByMe: false }],
    };
    const fresh = makeAuthor('n', 1, false);
    const out = filterVisibleAuthors([old, fresh]);
    expect(out.map((a) => a.id)).toEqual(['n']);
  });
});
