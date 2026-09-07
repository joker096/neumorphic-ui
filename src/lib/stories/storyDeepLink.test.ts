import { describe, it, expect } from 'vitest';
import { parseStoryDeepLink } from './storyDeepLink';

describe('parseStoryDeepLink', () => {
  it('parses hash scheme link with numeric userId', () => {
    expect(parseStoryDeepLink('#nexus://story/1/11')).toEqual({ source: 'scheme', userId: 1, storyId: 11 });
  });

  it('parses hash scheme link with string userId', () => {
    expect(parseStoryDeepLink('#nexus://story/abc/22')).toEqual({ source: 'scheme', userId: 'abc', storyId: 22 });
  });

  it('parses query param link', () => {
    expect(parseStoryDeepLink('', '?story=3:7')).toEqual({ source: 'query', userId: 3, storyId: 7 });
  });

  it('parses query param with string userId', () => {
    expect(parseStoryDeepLink('', '?story=member:9')).toEqual({ source: 'query', userId: 'member', storyId: 9 });
  });

  it('returns null for unrelated hash', () => {
    expect(parseStoryDeepLink('#/chats')).toBeNull();
  });

  it('returns null for missing query param', () => {
    expect(parseStoryDeepLink('', '?foo=bar')).toBeNull();
  });

  it('returns null for malformed story query', () => {
    expect(parseStoryDeepLink('', '?story=abc')).toBeNull();
    expect(parseStoryDeepLink('', '?story=1:x')).toBeNull();
  });

  it('returns null when nothing provided', () => {
    expect(parseStoryDeepLink()).toBeNull();
  });
});
