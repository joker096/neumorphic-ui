import { describe, it, expect } from 'vitest';
import {
  telegramContactToCrm,
  telegramContactsToCrm,
  telegramStatusToCrm,
  parseTelegramExport,
} from './telegram';

describe('Telegram connector', () => {
  it('maps a contact row', () => {
    const c = telegramContactToCrm({
      first_name: 'Ivan',
      last_name: 'Petrov',
      phone_number: '+79110000000',
      username: 'ivanp',
      about: 'bio',
    });
    expect(c.displayName).toBe('Ivan Petrov');
    expect(c.phone).toBe('+79110000000');
    expect(c.userId).toBe('tg_ivanp');
    expect(c.tags).toContain('telegram');
    expect(c.status).toBe('lead');
    expect(c.notes).toBe('bio');
  });

  it('falls back to username when no name', () => {
    const c = telegramContactToCrm({ username: 'anon', phone_number: '+7999' });
    expect(c.displayName).toBe('anon');
    expect(c.userId).toBe('tg_anon');
  });

  it('status is always lead', () => {
    expect(telegramStatusToCrm({})).toBe('lead');
  });

  it('maps a list', () => {
    const list = telegramContactsToCrm([{ username: 'a' }, { username: 'b' }]);
    expect(list).toHaveLength(2);
    expect(list[0].userId).toBe('tg_a');
  });

  it('parses an array export', () => {
    const rows = parseTelegramExport(JSON.stringify([{ username: 'x' }]));
    expect(rows).toHaveLength(1);
    expect(rows[0].username).toBe('x');
  });

  it('parses a wrapped {contacts:[...]} export', () => {
    const rows = parseTelegramExport(JSON.stringify({ contacts: [{ username: 'y' }] }));
    expect(rows).toHaveLength(1);
  });

  it('throws on invalid export', () => {
    expect(() => parseTelegramExport('{"foo":1}')).toThrow();
  });
});
