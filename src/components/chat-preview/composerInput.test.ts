import { describe, it, expect } from 'vitest';
import { wrapSelection, FORMAT_WRAPS } from './composerInput';

describe('wrapSelection', () => {
  it('wraps a selection in the delimiter', () => {
    const r = wrapSelection('hello world', 6, 11, 'bold');
    expect(r.text).toBe('hello **world**');
    expect(r.caret).toBe('hello **world**'.length);
  });

  it('puts the caret between the delimiters when nothing is selected', () => {
    const r = wrapSelection('ab', 1, 1, 'bold');
    expect(r.text).toBe('a****b');
    expect(r.caret).toBe(3);
  });

  it('unwraps when the selection is already wrapped', () => {
    const r = wrapSelection('a **b** c', 2, 7, 'bold');
    expect(r.text).toBe('a b c');
    expect(r.caret).toBe(3);
  });

  it('round-trips: wrapping then unwrapping is the identity', () => {
    const start = 'hello world';
    const wrapped = wrapSelection(start, 6, 11, 'bold');
    const back = wrapSelection(wrapped.text, 6, 17, 'bold');
    expect(back.text).toBe(start);
  });

  it('uses __ for italic because the renderer never parses a single *', () => {
    const r = wrapSelection('word', 0, 4, 'italic');
    expect(r.text).toBe('__word__');
    expect(r.text).not.toContain('*');
  });

  it('removes a bare delimiter pair selected on its own', () => {
    expect(wrapSelection('a **** b', 2, 6, 'bold').text).toBe('a  b');
  });

  it('leaves text containing a delimiter in the middle untouched', () => {
    // Only a selection that *starts and ends* with the delimiter unwraps, so a
    // lone `**` inside the text is wrapped like ordinary text.
    const r = wrapSelection('2**3 and 4**5', 0, 13, 'bold');
    expect(r.text).toBe('**2**3 and 4**5**');
  });

  it('supports every renderer delimiter', () => {
    for (const [key, delim] of Object.entries(FORMAT_WRAPS)) {
      const r = wrapSelection('x', 0, 1, key as keyof typeof FORMAT_WRAPS);
      expect(r.text).toBe(`${delim}x${delim}`);
    }
  });

  it('clamps out-of-range selections', () => {
    expect(wrapSelection('abc', 0, 999, 'bold').text).toBe('**abc**');
    expect(wrapSelection('abc', -5, 1, 'bold').text).toBe('**a**bc');
  });

  it('treats an inverted selection as a collapsed caret, not a backwards span', () => {
    const r = wrapSelection('abc', 2, 1, 'bold');
    expect(r.text).toBe('ab****c');
    expect(r.caret).toBe(4); // between the delimiters
  });

  it('works on an empty composer', () => {
    const r = wrapSelection('', 0, 0, 'bold');
    expect(r.text).toBe('****');
    expect(r.caret).toBe(2);
  });
});
