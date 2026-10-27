import { create } from 'zustand';
import type { StoryAuthor, StoryMedia } from './types';
import { fetchStories } from './api';
import { storyImage } from './placeholder';
import { useAppStore } from '../../store';

interface StoriesState {
  authors: StoryAuthor[];
  authorIdx: number | null;
  storyIdx: number | null;
  paused: boolean;
  muted: boolean;
  loading: boolean;
  init: () => Promise<void>;
  openViewer: (authorId: string, storyId?: string) => void;
  closeViewer: () => void;
  next: () => void;
  prev: () => void;
  /** Jump to the next author's first story (vertical swipe up in the viewer). */
  nextAuthor: () => void;
  pause: () => void;
  resume: () => void;
  toggleMute: () => void;
  markViewed: (storyId: string) => void;
  toggleLike: (storyId: string) => void;
  publishMyStory: (input: { media: StoryMedia; caption?: string }) => Promise<void>;
}

export const useStoriesStore = create<StoriesState>((set, get) => ({
  authors: [],
  authorIdx: null,
  storyIdx: null,
  paused: false,
  muted: false,
  loading: false,

  init: async () => {
    if (get().loading || get().authors.length > 0) return;
    set({ loading: true });
    const authors = await fetchStories();
    set({ authors, loading: false });
  },

  openViewer: (authorId, storyId) => {
    const { authors } = get();
    const authorIdx = authors.findIndex((a) => a.id === authorId);
    if (authorIdx === -1) return;
    let storyIdx = 0;
    if (storyId) {
      const i = authors[authorIdx].stories.findIndex((s) => s.id === storyId);
      if (i !== -1) storyIdx = i;
    }
    set({ authorIdx, storyIdx, paused: false });
  },

  closeViewer: () => set({ authorIdx: null, storyIdx: null, paused: false }),

  next: () => {
    const { authors, authorIdx, storyIdx } = get();
    if (authorIdx === null || storyIdx === null) return;
    const cur = authors[authorIdx];
    if (storyIdx + 1 < cur.stories.length) {
      set({ storyIdx: storyIdx + 1, paused: false });
      return;
    }
    const nextAuthor = authors.slice(authorIdx + 1).find((a) => a.stories.length > 0);
    if (nextAuthor) {
      const nextIdx = authors.indexOf(nextAuthor);
      set({ authorIdx: nextIdx, storyIdx: 0, paused: false });
    } else {
      set({ authorIdx: null, storyIdx: null, paused: false });
    }
  },

  prev: () => {
    const { authors, authorIdx, storyIdx } = get();
    if (authorIdx === null || storyIdx === null) return;
    if (storyIdx > 0) {
      set({ storyIdx: storyIdx - 1, paused: false });
      return;
    }
    const prevAuthors = authors.slice(0, authorIdx).reverse();
    const prevAuthor = prevAuthors.find((a) => a.stories.length > 0);
    if (prevAuthor) {
      const prevIdx = authors.indexOf(prevAuthor);
      set({ authorIdx: prevIdx, storyIdx: authors[prevIdx].stories.length - 1, paused: false });
    } else {
      set({ storyIdx: 0, paused: false });
    }
  },

  nextAuthor: () => {
    const { authors, authorIdx } = get();
    if (authorIdx === null) return;
    for (let i = authorIdx + 1; i < authors.length; i += 1) {
      if (authors[i].stories.length > 0) {
        set({ authorIdx: i, storyIdx: 0, paused: false });
        return;
      }
    }
  },

  pause: () => set({ paused: true }),  resume: () => set({ paused: false }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),

  markViewed: (storyId) =>
    set((s) => ({
      authors: s.authors.map((a) => ({
        ...a,
        stories: a.stories.map((st) => (st.id === storyId && !st.viewedByMe ? { ...st, viewedByMe: true } : st)),
      })),
    })),

  toggleLike: (storyId) =>
    set((s) => ({
      authors: s.authors.map((a) => ({
        ...a,
        stories: a.stories.map((st) =>
          st.id === storyId
            ? { ...st, likedByMe: !st.likedByMe, likesCount: st.likesCount + (st.likedByMe ? -1 : 1) }
            : st,
        ),
      })),
    })),

  publishMyStory: async ({ media, caption }) => {
    let authors = get().authors;
    if (authors.length === 0) {
      authors = await fetchStories();
      set({ authors });
    }
    const selfId = 'me';
    if (!authors.some((a) => a.id === selfId)) {
      const name = useAppStore.getState().userProfile?.name || 'You';
      authors = [{ id: selfId, name, avatarUrl: storyImage('me', { width: 200, height: 200, label: name }), stories: [] }, ...authors];
      set({ authors });
    }
    const story = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      authorId: selfId,
      media,
      caption: caption || undefined,
      createdAt: new Date().toISOString(),
      viewsCount: 0,
      likesCount: 0,
      likedByMe: false,
      viewedByMe: true,
    };
    set({
      authors: get().authors.map((a) => (a.id === selfId ? { ...a, stories: [story, ...a.stories] } : a)),
    });
  },
}));

/** Total unviewed stories across all authors (drives badges/rings). */
export function selectUnseenTotal(authors: StoryAuthor[]): number {
  return authors.reduce((acc, a) => acc + a.stories.filter((s) => !s.viewedByMe).length, 0);
}

/** Number of unviewed stories for a single author. */
export function selectAuthorUnseen(author: StoryAuthor): number {
  return author.stories.filter((s) => !s.viewedByMe).length;
}
