import { describe, it, expect } from 'vitest';
import { isSingleEmojiText } from './emoji';

describe('isSingleEmojiText', () => {
  it('accepts a single emoji', () => {
    expect(isSingleEmojiText('🔥')).toBe(true);
    expect(isSingleEmojiText('👍')).toBe(true);
    expect(isSingleEmojiText('😂')).toBe(true);
  });

  it('accepts a single emoji with skin tone / variation selector', () => {
    expect(isSingleEmojiText('👍🏽')).toBe(true);
    expect(isSingleEmojiText('❤️')).toBe(true);
  });

  it('accepts a multi-codepoint emoji (family/flag) as one glyph', () => {
    expect(isSingleEmojiText('👨‍👩‍👧')).toBe(true);
    expect(isSingleEmojiText('🇷🇺')).toBe(true);
  });

  it('rejects plain text, multiple glyphs and mixed content', () => {
    expect(isSingleEmojiText('hello')).toBe(false);
    expect(isSingleEmojiText('🔥🔥')).toBe(false);
    expect(isSingleEmojiText('hi 🔥')).toBe(false);
    expect(isSingleEmojiText('🔥 hi')).toBe(false);
    expect(isSingleEmojiText('123')).toBe(false);
  });

  it('rejects empty/whitespace/undefined', () => {
    expect(isSingleEmojiText('')).toBe(false);
    expect(isSingleEmojiText('   ')).toBe(false);
    expect(isSingleEmojiText(undefined)).toBe(false);
    expect(isSingleEmojiText(null)).toBe(false);
  });

  it('rejects text that is only a number/punctuation', () => {
    expect(isSingleEmojiText('!')).toBe(false);
    expect(isSingleEmojiText('?')).toBe(false);
    expect(isSingleEmojiText('-')).toBe(false);
  });
});
