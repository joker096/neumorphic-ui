import { describe, it, expect } from 'vitest';
import { buildMessageLink, parseMessageLink, clearMessageLink } from './messageLink';

describe('messageLink', () => {
  it('builds an absolute link from ids', () => {
    expect(buildMessageLink('c1', 42, 'https://mess.example')).toBe(
      'https://mess.example/#nexus://chat/c1/42',
    );
  });

  it('round-trips a chat id that is not url-safe', () => {
    const link = buildMessageLink('team chat/2', 7, 'https://x');
    const hash = link.slice(link.indexOf('#'));
    expect(parseMessageLink(hash)).toEqual({ chatId: 'team chat/2', messageId: 7 });
  });

  it('parses the hash form with numeric ids', () => {
    expect(parseMessageLink('#nexus://chat/12/34')).toEqual({ chatId: 12, messageId: 34 });
  });

  it('parses the query form', () => {
    expect(parseMessageLink(undefined, '?msg=c9:5')).toEqual({ chatId: 'c9', messageId: 5 });
    expect(parseMessageLink('', 'msg=1%3A2')).toEqual({ chatId: 1, messageId: 2 });
  });

  it('returns null for foreign and malformed links', () => {
    expect(parseMessageLink('#nexus://story/1/2')).toBeNull();
    expect(parseMessageLink('#nexus://chat/only-one-part')).toBeNull();
    expect(parseMessageLink(undefined, '?invite=abc')).toBeNull();
    expect(parseMessageLink()).toBeNull();
  });

  it('strips a handled link from the URL', () => {
    window.history.replaceState({}, '', '/?msg=c1:42#nexus://chat/c1/42');
    clearMessageLink();
    expect(window.location.search).toBe('');
    expect(window.location.hash).toBe('');
  });
});
