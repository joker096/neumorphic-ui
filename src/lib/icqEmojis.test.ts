import { describe, it, expect } from 'vitest';
import { getICQStickerSrc } from './icqEmojis';

describe('getICQStickerSrc', () => {
  it('returns an ICQ sticker path for stored ICQ sticker codes', () => {
    expect(getICQStickerSrc('icq:nea', 'dark')).toBe('/ICQ/hd_dark_skin/nea.gif');
  });

  it('returns an ICQ sticker path for mapped Unicode stickers', () => {
    expect(getICQStickerSrc('👍', 'light')).toBe('/ICQ/hd_light_skin/ok.gif');
  });

  it('returns null for plain text stickers without an ICQ mapping', () => {
    expect(getICQStickerSrc('🤔', 'dark')).toBeNull();
  });
});
