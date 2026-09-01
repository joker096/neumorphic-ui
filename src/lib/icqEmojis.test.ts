import { describe, it, expect } from 'vitest';
import { getICQStickerSrc, ICQ_EMOJI_MAP, getIcqStickerIds } from './icqEmojis';

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
  it('returns the full ICQ pack for every tier (ICQ is free)', () => {
    expect(getIcqStickerIds(false)).toHaveLength(ICQ_EMOJI_MAP.length);
    expect(getIcqStickerIds(true)).toHaveLength(ICQ_EMOJI_MAP.length);
  });
});
