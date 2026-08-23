import { describe, it, expect } from 'vitest';
import {
  isStoryExpired,
  getExpirationMs,
  getVisibleStories,
  publishMyStory,
  deleteMyStory,
  MY_STORY_USER,
  type StoryUser,
} from './storiesData';

const makeUser = (stories: StoryUser['stories']): StoryUser => ({
  id: 99,
  name: 'Test',
  color: 'from-[var(--accent)] to-purple-500',
  avatarColor: 'from-[var(--accent)] to-purple-500',
  stories,
});

describe('expiration helpers', () => {
  it('parses known expiration strings to ms', () => {
    expect(getExpirationMs('6h')).toBe(6 * 60 * 60_000);
    expect(getExpirationMs('12h')).toBe(12 * 60 * 60_000);
    expect(getExpirationMs('24h')).toBe(24 * 60 * 60_000);
    expect(getExpirationMs('48h')).toBe(48 * 60 * 60_000);
  });

  it('returns null for missing/unknown expiration (permanent)', () => {
    expect(getExpirationMs(undefined)).toBeNull();
    expect(getExpirationMs('never')).toBeNull();
  });

  it('treats missing expiration as never expired', () => {
    const s = { id: 1, type: 'gradient' as const, time: Date.now() - 1000, views: 0, reactions: 0 };
    expect(isStoryExpired(s)).toBe(false);
  });

  it('marks story expired after its window', () => {
    const s = { id: 1, type: 'gradient' as const, time: Date.now() - 25 * 60 * 60_000, expiration: '24h', views: 0, reactions: 0 };
    expect(isStoryExpired(s)).toBe(true);
  });

  it('keeps story visible inside its window', () => {
    const s = { id: 1, type: 'gradient' as const, time: Date.now() - 1 * 60 * 60_000, expiration: '24h', views: 0, reactions: 0 };
    expect(isStoryExpired(s)).toBe(false);
  });

  it('filters expired stories out of a user', () => {
    const now = Date.now();
    const user = makeUser([
      { id: 1, type: 'gradient', time: now - 1000, expiration: '24h', views: 0, reactions: 0 },
      { id: 2, type: 'gradient', time: now - 47 * 60 * 60_000, expiration: '48h', views: 0, reactions: 0 },
      { id: 3, type: 'gradient', time: now - 49 * 60 * 60_000, expiration: '24h', views: 0, reactions: 0 },
    ]);
    const visible = getVisibleStories(user);
    expect(visible.map((s) => s.id)).toEqual([1, 2]);
  });
});

describe('publishMyStory media', () => {
  it('stores image as photo type', () => {
    const before = MY_STORY_USER.stories.length;
    publishMyStory('from-rose-500 to-orange-500', 'hi', 'all', '24h', 'blob:img', undefined);
    const top = MY_STORY_USER.stories[0];
    expect(MY_STORY_USER.stories.length).toBe(before + 1);
    expect(top.type).toBe('photo');
    expect(top.image).toBe('blob:img');
    expect(top.video).toBeUndefined();
  });

  it('stores video as video type and ignores image', () => {
    publishMyStory('from-blue-500 to-purple-500', 'clip', 'close', '48h', undefined, 'blob:vid');
    const top = MY_STORY_USER.stories[0];
    expect(top.type).toBe('video');
    expect(top.video).toBe('blob:vid');
    expect(top.image).toBeUndefined();
  });

  it('defaults to gradient with no media', () => {
    publishMyStory('from-emerald-500 to-cyan-500', '', 'all');
    const top = MY_STORY_USER.stories[0];
    expect(top.type).toBe('gradient');
    expect(top.image).toBeUndefined();
    expect(top.video).toBeUndefined();
  });
});

describe('story persistence', () => {
  it('persists gradient stories to localStorage', () => {
    window.localStorage.clear();
    publishMyStory('from-rose-500 to-orange-500', 'keep me', 'all', '24h');
    const parsed = JSON.parse(window.localStorage.getItem('nm_stories_v1') ?? '[]');
    expect(parsed.some((s: { caption?: string; type?: string }) => s.caption === 'keep me' && s.type === 'gradient')).toBe(true);
  });

  it('does not persist blob-backed media stories', () => {
    window.localStorage.clear();
    publishMyStory('x', 'media', 'all', '24h', 'blob:abc');
    const parsed = JSON.parse(window.localStorage.getItem('nm_stories_v1') ?? '[]');
    expect(parsed.find((s: { caption?: string }) => s.caption === 'media')).toBeFalsy();
  });

  it('removes deleted story from state and storage', () => {
    window.localStorage.clear();
    publishMyStory('from-rose-500 to-orange-500', 'delete me', 'all', '24h');
    const top = MY_STORY_USER.stories[0];
    expect(top.caption).toBe('delete me');
    deleteMyStory(top.id);
    expect(MY_STORY_USER.stories.find((s) => s.id === top.id)).toBeUndefined();
    const parsed = JSON.parse(window.localStorage.getItem('nm_stories_v1') ?? '[]');
    expect(parsed.find((s: { id: number }) => s.id === top.id)).toBeFalsy();
  });
});
