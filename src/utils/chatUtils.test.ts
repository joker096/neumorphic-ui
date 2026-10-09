import { describe, it, expect } from 'vitest';
import { groupMessages, formatDateLabel, formatShortDate, formatClockTime, fuzzTime, getBubbleCornerClass, sendTimeOf, chatActivityOf, chatListTime } from './chatUtils';

describe('formatClockTime', () => {
  it('matches the previous toLocaleTimeString call it replaces', () => {
    const ts = new Date(2026, 0, 2, 9, 5).getTime();
    expect(formatClockTime(ts)).toBe(new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    expect(formatClockTime(new Date(ts))).toBe(new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  });

  it('renders nothing instead of throwing on a sender-asserted junk timestamp', () => {
    expect(formatClockTime(Number.NaN)).toBe('');
    expect(formatClockTime(new Date('nope'))).toBe('');
    expect(formatClockTime(undefined as unknown as number)).toBe('');
  });

  it('follows the UI language for the 12/24-hour clock', () => {
    const ts = new Date(2026, 0, 2, 14, 5).getTime();
    expect(formatClockTime(ts, 'ru-RU')).toContain('14:05');
    expect(formatClockTime(ts, 'en-US')).toMatch(/0?2:05/);
  });
});

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

  it('renders the injected relative labels instead of the English literals', () => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    expect(formatDateLabel(timeStr, undefined, { today: 'Сегодня', yesterday: 'Вчера' })).toBe('Сегодня');

    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    expect(formatDateLabel('', yesterday, { today: 'Сегодня', yesterday: 'Вчера' })).toBe('Вчера');
  });

  it('resolves a clock-only label to the current day (no timestamp to anchor it)', () => {
    // The string path rebuilds the time on TODAY's date, so a bare "14:05" can
    // never be a day old — it is either today or the next date boundary.
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    expect(formatDateLabel(timeStr, undefined, { today: 'Сегодня' })).toBe('Сегодня');
  });

  it('formats the separator date in the UI language, not the host runtime', () => {
    const older = Date.now() - 40 * 24 * 60 * 60 * 1000;
    const ru = formatDateLabel('', older, { lang: 'ru-RU' });
    const de = formatDateLabel('', older, { lang: 'de-DE' });
    expect(ru).not.toBe(de);
    // 40 days back lands inside the current year → no year in the label.
    expect(ru).not.toMatch(/\d{4}/);
  });

  it('adds the year once the message is from an earlier year', () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const label = formatDateLabel('', lastYear.getTime(), { lang: 'en-US' });
    expect(label).toMatch(/\d{4}/);
  });

  it('renders nothing for a sender-asserted junk timestamp', () => {
    expect(formatDateLabel('', Number.NaN)).toBe('');
  });
});

describe('formatShortDate', () => {
  it('prints no date stamp for today, whatever the labels say', () => {
    expect(formatShortDate(Date.now())).toBe('');
    expect(formatShortDate(Date.now(), { today: 'Сегодня', yesterday: 'Вчера' })).toBe('');
  });

  it('prints the injected Yesterday label', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    expect(formatShortDate(yesterday)).toBe('Yesterday');
    expect(formatShortDate(yesterday, { today: 'Сегодня', yesterday: 'Вчера' })).toBe('Вчера');
  });

  it('formats older stamps in the UI language without a year', () => {
    const older = Date.now() - 40 * 24 * 60 * 60 * 1000;
    const ru = formatShortDate(older, { lang: 'ru-RU' });
    const de = formatShortDate(older, { lang: 'de-DE' });
    expect(ru).not.toBe(de);
    expect(ru).not.toMatch(/\d{4}/);
  });

  it('renders nothing for a sender-asserted junk timestamp', () => {
    expect(formatShortDate(Number.NaN)).toBe('');
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

describe('sendTimeOf / chatActivityOf', () => {
  it('prefers ts, then a numeric id, then timestamp', () => {
    expect(sendTimeOf({ ts: 5 })).toBe(5);
    expect(sendTimeOf({ id: 7 })).toBe(7);
    expect(sendTimeOf({ timestamp: 9 })).toBe(9);
  });

  it('does not treat a string live-location id as a timestamp', () => {
    // `Number("live_<chat>_<ts>")` is NaN → must not collapse to 0 and bump a
    // freshly started share to the top of the list.
    expect(sendTimeOf({ id: 'live_1_1700000000000' })).toBe(0);
    expect(sendTimeOf(undefined)).toBe(0);
  });

  it('keys chat activity on the newest bubble, else createdAt, else 0', () => {
    expect(chatActivityOf({ history: [{ ts: 1 }, { ts: 3 }] })).toBe(3);
    expect(chatActivityOf({ history: [], createdAt: 42 })).toBe(42);
    expect(chatActivityOf({})).toBe(0);
  });
});

describe('chatListTime', () => {
  const t = (key: string) =>
    key === 'chat.today' ? 'Today' : key === 'chat.yesterday' ? 'Yesterday' : key;

  it('shows the newest bubble stamp for a message from today', () => {
    const now = Date.now();
    expect(chatListTime({ history: [{ ts: now, time: '10:42' }], time: '09:00' }, t)).toBe('10:42');
  });

  it('re-formats from ts when the bubble carries no stamp', () => {
    const now = Date.now();
    expect(chatListTime({ history: [{ ts: now }] }, t)).toBe(formatClockTime(now));
  });

  it('shows the injected Yesterday label for a day-old bubble', () => {
    const ts = Date.now() - 24 * 60 * 60 * 1000;
    expect(chatListTime({ history: [{ ts, time: '23:59' }], time: '23:59' }, t)).toBe('Yesterday');
  });

  it('shows a localized day label for older bubbles', () => {
    const ts = Date.now() - 40 * 24 * 60 * 60 * 1000;
    const label = chatListTime({ history: [{ ts, time: '11:00' }] }, t, 'ru-RU');
    expect(label).not.toBe('11:00');
    expect(label).toBe(formatDateLabel('', ts, { lang: 'ru-RU', today: 'Today', yesterday: 'Yesterday' }));
  });

  it('falls back to the stamped chat.time without a usable ts', () => {
    expect(chatListTime({ history: [{ time: '12:00' }], time: '12:00' }, t)).toBe('12:00');
    expect(chatListTime({ time: 'Jul 28' }, t)).toBe('Jul 28');
  });
});