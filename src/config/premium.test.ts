import { describe, it, expect } from 'vitest';
import { PREMIUM_FILE_LIMITS, getAttachmentLimit, ICQ_FREE_STICKER_COUNT } from './premium';

describe('attachment limits', () => {
  it('free tier is limited to 50 MB', () => {
    expect(getAttachmentLimit(false)).toBe(50 * 1024 * 1024);
  });

  it('premium tier is limited to 500 MB', () => {
    expect(getAttachmentLimit(true)).toBe(500 * 1024 * 1024);
  });

  it('free limit is lower than premium limit', () => {
    expect(PREMIUM_FILE_LIMITS.free).toBeLessThan(PREMIUM_FILE_LIMITS.premium);
  });
});

describe('ICQ free sticker count', () => {
  it('free tier unlocks the first 24 ICQ stickers', () => {
    expect(ICQ_FREE_STICKER_COUNT).toBe(24);
  });
});
