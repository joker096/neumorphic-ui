import { describe, it, expect } from 'vitest';
import { encodeMorse, decodeMorse, isMorseCode, decodeIfMorse } from './MorseDecoder';

describe('MorseDecoder', () => {
  it('encodes Latin text per ITU-R standard', () => {
    expect(encodeMorse('HELLO')).toBe('.... . .-.. .-.. ---');
    expect(encodeMorse('SOS')).toBe('... --- ...');
  });

  it('encodes Cyrillic text with standard Russian codes (same as Latin equivalents)', () => {
    expect(encodeMorse('ПРИВЕТ')).toBe('.--. .-. .. .-- . -');
    expect(encodeMorse('МАМА')).toBe('-- .- -- .-');
    expect(encodeMorse('КАША')).toBe('-.- .- ---- .-');
  });

  it('uses "/" as word separator', () => {
    expect(encodeMorse('GO HOME')).toBe('--. --- / .... --- -- .');
  });

  it('keeps unsupported characters as-is', () => {
    expect(encodeMorse('A1')).toBe('.- .----');
    expect(encodeMorse('до')).toBe('-.. ---');
  });

  it('decodes morse back to text (Latin round-trip)', () => {
    expect(decodeMorse('.... . .-.. .-.. ---')).toBe('HELLO');
    expect(decodeMorse('--- / .-- --- .-. .-.. -..')).toBe('O WORLD');
  });

  it('decodes Cyrillic morse without crashing (reverse map resolves Latin)', () => {
    const decoded = decodeMorse(encodeMorse('ПРИВЕТ'));
    expect(decoded).toHaveLength(6);
    expect([...decoded].every((ch) => /[A-ZА-Я]/.test(ch))).toBe(true);
  });

  it('isMorseCode only accepts dot / dash / space / slash', () => {
    expect(isMorseCode('.--')).toBe(true);
    expect(isMorseCode('.... . .-..')).toBe(true);
    expect(isMorseCode('hello')).toBe(false);
    expect(isMorseCode('')).toBe(false);
  });

  it('decodeIfMorse only decodes morse-looking strings', () => {
    expect(decodeIfMorse('-.-- . ...')).toBe('YES');
    expect(decodeIfMorse('hello')).toBe('hello');
  });
});