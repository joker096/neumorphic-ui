import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StoryViewer } from './StoryViewer';
import { useStoriesStore } from '../storiesStore';
import type { StoryAuthor } from '../types';

vi.mock('../../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key),
    lang: 'en',
  }),
}));

function author(id: string, stories: number, name = id): StoryAuthor {
  return {
    id,
    name,
    avatarUrl: '',
    stories: Array.from({ length: stories }, (_, i) => ({
      id: `${id}s${i}`,
      authorId: id,
      media: { kind: 'image' as const, src: '' },
      createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      viewsCount: 3,
      likesCount: 1,
      likedByMe: false,
      viewedByMe: false,
    })),
  };
}

function swipe(el: HTMLElement, from: [number, number], to: [number, number]) {
  fireEvent.touchStart(el, { touches: [{ clientX: from[0], clientY: from[1] }] });
  fireEvent.touchMove(el, { touches: [{ clientX: to[0], clientY: to[1] }] });
  fireEvent.touchEnd(el, { changedTouches: [{ clientX: to[0], clientY: to[1] }] });
}

describe('StoryViewer gestures', () => {
  beforeEach(() => {
    cleanup();
    useStoriesStore.setState({
      authors: [author('a', 2, 'Alice'), author('b', 1, 'Bob')],
      authorIdx: 0,
      storyIdx: 0,
      paused: false,
      muted: false,
      loading: false,
    });
  });

  it('closes on a downward swipe', () => {
    render(<StoryViewer />);
    swipe(screen.getByRole('dialog', { name: 'Alice' }), [100, 100], [100, 260]);
    expect(useStoriesStore.getState().authorIdx).toBeNull();
  });

  it('keeps the viewer open on a short downward nudge', () => {
    render(<StoryViewer />);
    swipe(screen.getByRole('dialog', { name: 'Alice' }), [100, 100], [100, 140]);
    expect(useStoriesStore.getState().authorIdx).toBe(0);
  });

  it('goes to the next author on an upward swipe', () => {
    render(<StoryViewer />);
    swipe(screen.getByRole('dialog', { name: 'Alice' }), [100, 260], [100, 100]);
    expect(useStoriesStore.getState().authorIdx).toBe(1);
    expect(screen.getByRole('dialog', { name: 'Bob' })).toBeTruthy();
  });

  it('advances within the author on a left swipe', () => {
    render(<StoryViewer />);
    swipe(screen.getByRole('dialog', { name: 'Alice' }), [260, 100], [100, 100]);
    expect(useStoriesStore.getState().storyIdx).toBe(1);
  });

  it('ArrowUp goes to the next author, ArrowDown closes', () => {
    render(<StoryViewer />);
    fireEvent.keyDown(window, { key: 'ArrowUp' });
    expect(useStoriesStore.getState().authorIdx).toBe(1);
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    expect(useStoriesStore.getState().authorIdx).toBeNull();
  });
});
