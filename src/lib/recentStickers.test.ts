import { describe, it, expect, beforeEach } from 'vitest';
import { getRecentStickers, pushRecentSticker, RECENT_STICKER_LIMIT } from './recentStickers';
import { STORAGE_KEYS } from '../constants/storage';

describe('recentStickers', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(getRecentStickers()).toEqual([]);
  });

  it('keeps the newest first and moves a repeated sticker to the front', () => {
    pushRecentSticker('🔥');
    pushRecentSticker('❤️');
    expect(getRecentStickers()).toEqual(['❤️', '🔥']);
    pushRecentSticker('🔥');
    expect(getRecentStickers()).toEqual(['🔥', '❤️']);
  });

  it('caps the list and keeps the ICQ prefix intact', () => {
    for (let i = 0; i < RECENT_STICKER_LIMIT + 5; i++) pushRecentSticker(`icq:${i}`);
    const list = getRecentStickers();
    expect(list).toHaveLength(RECENT_STICKER_LIMIT);
    expect(list[0]).toBe(`icq:${RECENT_STICKER_LIMIT + 4}`);
  });

  it('degrades to empty on corrupted storage instead of throwing', () => {
    localStorage.setItem(STORAGE_KEYS.RECENT_STICKERS, '{not json');
    expect(getRecentStickers()).toEqual([]);
    localStorage.setItem(STORAGE_KEYS.RECENT_STICKERS, JSON.stringify([1, '', 'ok']));
    expect(getRecentStickers()).toEqual(['ok']);
  });

  it('ignores an empty value without writing a blank entry', () => {
    pushRecentSticker('  ');
    expect(getRecentStickers()).toEqual([]);
  });
});
