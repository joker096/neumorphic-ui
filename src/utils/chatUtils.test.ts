import { describe, it, expect } from 'vitest';
import { groupMessages, formatDateLabel, fuzzTime, getBubbleCornerClass } from './chatUtils';

describe('groupMessages', () => {
  it('groups messages by sender', () => {
    const history = [
      { id: 1, sender: 'me', text: 'Hello' },
      { id: 2, sender: 'me', text: 'How are you?' },
      { id: 3, sender: 'them', text: 'Fine thanks' },
    ];

    const result = groupMessages(history);

    expect(result).toHaveLength(2);
    expect(result[0].messages).toHaveLength(2);
    expect(result[1].messages).toHaveLength(1);
  });

  it('assigns single group position for solo messages', () => {
    const history = [
      { id: 1, sender: 'them', text: 'Hello' },
    ];

    const result = groupMessages(history);

    expect(result[0].groupPositions).toEqual(['single']);
  });

  it('assigns first/middle/last positions for grouped messages', () => {
    const history = [
      { id: 1, sender: 'me', text: '1' },
      { id: 2, sender: 'me', text: '2' },
      { id: 3, sender: 'me', text: '3' },
    ];

    const result = groupMessages(history);

    expect(result[0].groupPositions).toEqual(['first', 'middle', 'last']);
  });

  it('creates separate groups for different senders', () => {
    const history = [
      { id: 1, sender: 'me', text: '1' },
      { id: 2, sender: 'them', text: '2' },
      { id: 3, sender: 'me', text: '3' },
    ];

    const result = groupMessages(history);

    expect(result).toHaveLength(3);
  });

  it('handles empty history', () => {
    const result = groupMessages([]);
    expect(result).toEqual([]);
  });
});

describe('formatDateLabel', () => {
  it('returns Today for messages from today', () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    expect(formatDateLabel(timeStr)).toBe('Today');
  });

  it('returns a date string for older messages', () => {
    const past = new Date('2024-01-15 10:30');
    const timeStr = `${past.getHours().toString().padStart(2, '0')}:${past.getMinutes().toString().padStart(2, '0')}`;
    const result = formatDateLabel(timeStr);
    expect(result).not.toBe(timeStr);
  });

  it('returns input unchanged for invalid time strings', () => {
    expect(formatDateLabel('not-a-time')).toBe('not-a-time');
  });
});

describe('fuzzTime', () => {
  it('returns formatted time string', () => {
    const result = fuzzTime('10:30', 0);
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('applies deterministic offset based on id', () => {
    const result1 = fuzzTime('10:30', 1);
    const result2 = fuzzTime('10:30', 2);
    expect(result1).not.toBe('10:30');
    expect(result2).not.toBe('10:30');
  });

  it('handles id 0 offset', () => {
    const result = fuzzTime('10:30', 0);
    expect(result).toBeDefined();
  });

  it('returns input unchanged for invalid time strings', () => {
    expect(fuzzTime('not-a-time', 1)).toBe('not-a-time');
  });
});

describe('getBubbleCornerClass', () => {
  it('returns correct class for single me message', () => {
    expect(getBubbleCornerClass('single', true)).toBe('rounded-xl rounded-br-sm');
  });

  it('returns correct class for first me message', () => {
    expect(getBubbleCornerClass('first', true)).toBe('rounded-t-xl rounded-bl-xl rounded-br-xl rounded-bl-sm');
  });

  it('returns correct class for middle me message', () => {
    expect(getBubbleCornerClass('middle', true)).toBe('rounded-l-xl rounded-r-xl rounded-br-xl rounded-bl-xl');
  });

  it('returns correct class for last me message', () => {
    expect(getBubbleCornerClass('last', true)).toBe('rounded-tl-xl rounded-tr-xl rounded-br-sm rounded-bl-xl');
  });

  it('returns correct class for single them message', () => {
    expect(getBubbleCornerClass('single', false)).toBe('rounded-xl rounded-bl-sm');
  });

  it('returns correct class for first them message', () => {
    expect(getBubbleCornerClass('first', false)).toBe('rounded-t-xl rounded-br-xl rounded-br-sm rounded-bl-xl');
  });

  it('returns correct class for middle them message', () => {
    expect(getBubbleCornerClass('middle', false)).toBe('rounded-r-xl rounded-l-xl rounded-bl-xl rounded-br-xl');
  });

  it('returns correct class for last them message', () => {
    expect(getBubbleCornerClass('last', false)).toBe('rounded-tr-xl rounded-tl-xl rounded-bl-sm rounded-br-xl');
  });

  it('falls back to single for invalid group position', () => {
    expect(getBubbleCornerClass('invalid' as any, true)).toBe('rounded-xl rounded-br-sm');
  });
});