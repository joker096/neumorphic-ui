import { describe, it, expect, beforeEach } from 'vitest';
import { getUnseenCount, markStoriesSeen, seenStoryKey } from './storySeen';
import { STORY_USERS } from '../../components/stories/storiesData';

beforeEach(() => {
  localStorage.clear();
});

describe('storySeen', () => {
  it('reports every story unseen for a fresh user', () => {
    expect(getUnseenCount(STORY_USERS[0])).toBe(STORY_USERS[0].stories.length);
  });

  it('marks all stories of a user as seen', () => {
    markStoriesSeen(STORY_USERS[0]);
    expect(getUnseenCount(STORY_USERS[0])).toBe(0);
  });

  it('keeps other users unseen', () => {
    markStoriesSeen(STORY_USERS[1]);
    expect(getUnseenCount(STORY_USERS[1])).toBe(0);
    expect(getUnseenCount(STORY_USERS[0])).toBe(STORY_USERS[0].stories.length);
  });

  it('persists seen keys across calls', () => {
    markStoriesSeen(STORY_USERS[2]);
    markStoriesSeen(STORY_USERS[0]);
    expect(getUnseenCount(STORY_USERS[2])).toBe(0);
    expect(getUnseenCount(STORY_USERS[0])).toBe(0);
  });

  it('fingerprints keys by user + story id', () => {
    expect(seenStoryKey(1, 11)).toBe('1:11');
    expect(seenStoryKey('me', 1)).toBe('me:1');
  });
});