import { describe, it, expect } from 'vitest';
import { getICQStickerSrc, CAVEMAN_STICKERS, ICQ_EMOJI_MAP, RACOON_STICKERS } from './icqEmojis';

describe('getICQStickerSrc', () => {
  it('returns an ICQ sticker path for stored ICQ sticker codes', () => {
    expect(getICQStickerSrc('icq:nea', 'dark')).toBe('/ICQ/hd_dark_skin/nea.gif');
  });

  it('returns null for plain text stickers without an ICQ mapping', () => {
    expect(getICQStickerSrc('🤔', 'dark')).toBeNull();
  });

  it('returns a caveman sticker path for caveman: prefix', () => {
    expect(getICQStickerSrc('caveman:caveman-train', 'dark')).toBe('/stickers/caveman/caveman-train.png');
  });

  it('returns a raccoon sticker path for raccoon: prefix', () => {
    expect(getICQStickerSrc('raccoon:racoon-workout2', 'light')).toBe('/stickers/raccoon/racoon-workout2.png');
  });
});

describe('CAVEMAN_STICKERS', () => {
  it('contains 23 caveman stickers', () => {
    expect(CAVEMAN_STICKERS).toHaveLength(23);
  });

  it('has correct structure for each sticker', () => {
    CAVEMAN_STICKERS.forEach(sticker => {
      expect(sticker).toHaveProperty('id');
      expect(sticker).toHaveProperty('name');
      expect(sticker).toHaveProperty('file');
      expect(sticker.file).toMatch(/^caveman-.*\.png$/);
    });
  });
});

describe('RACOON_STICKERS', () => {
  it('contains 31 raccoon stickers', () => {
    expect(RACOON_STICKERS).toHaveLength(31);
  });

  it('has correct structure for each sticker', () => {
    RACOON_STICKERS.forEach(sticker => {
      expect(sticker).toHaveProperty('id');
      expect(sticker).toHaveProperty('name');
      expect(sticker).toHaveProperty('file');
      expect(sticker.file).toMatch(/^racoon-.*\.png$/);
    });
  });
});

describe('ICQ_EMOJI_MAP', () => {
  it('contains ICQ emojis without standard emoji mappings', () => {
    expect(ICQ_EMOJI_MAP.length).toBeGreaterThan(0);
    expect(ICQ_EMOJI_MAP.find(e => e.id === 'ok')).toBeDefined();
  });
});
