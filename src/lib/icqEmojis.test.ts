import { describe, it, expect } from 'vitest';
import { getICQStickerSrc, ICQ_EMOJI_MAP, getIcqStickerIds } from './icqEmojis';
import { ICQ_FREE_STICKER_COUNT } from '../config/premium';

describe('getICQStickerSrc', () => {
  it('returns an ICQ sticker path for stored ICQ sticker codes', () => {
    expect(getICQStickerSrc('icq:nea', 'dark')).toBe('/ICQ/hd_dark_skin/nea.gif');
  });

  it('returns null for plain text stickers without an ICQ mapping', () => {
    expect(getICQStickerSrc('🤔', 'dark')).toBeNull();
  });
});

describe('ICQ_EMOJI_MAP', () => {
  it('contains ICQ emojis without standard emoji mappings', () => {
    expect(ICQ_EMOJI_MAP.length).toBeGreaterThan(0);
    expect(ICQ_EMOJI_MAP.find(e => e.id === 'ok')).toBeDefined();
  });
});

describe('getIcqStickerIds', () => {
  it('free tier gets only the first 24 ICQ stickers', () => {
    expect(getIcqStickerIds(false)).toHaveLength(ICQ_FREE_STICKER_COUNT);
    expect(getIcqStickerIds(false)).toEqual(ICQ_EMOJI_MAP.slice(0, ICQ_FREE_STICKER_COUNT).map(e => e.id));
  });

  it('premium tier gets the full ICQ pack', () => {
    expect(getIcqStickerIds(true)).toHaveLength(ICQ_EMOJI_MAP.length);
  });
});
