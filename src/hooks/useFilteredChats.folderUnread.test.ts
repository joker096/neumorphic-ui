import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredChats } from './useFilteredChats';
import { CHAT_FOLDER_KEYS } from '../constants/chatConstants';

const NO_FILTERS = { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false };

const run = (chats: any[], opts: { archived?: any[]; channels?: any[]; contacts?: any[]; spam?: boolean } = {}) =>
  renderHook(() =>
    useFilteredChats(
      chats,
      '',
      'all',
      opts.archived ?? [],
      NO_FILTERS,
      opts.channels ?? [],
      opts.contacts ?? [],
      opts.spam ?? false,
    ),
  ).result.current.folderUnread;

describe('useFilteredChats — folderUnread', () => {
  it('sums unread per folder and keeps archived chats out of the other tabs', () => {
    const chats = [
      { id: 1, name: 'Alice', type: 'dm', history: [], unread: 3 },
      { id: 2, name: 'Team', type: 'group', history: [], unread: 2 },
      { id: 3, name: 'Old', type: 'dm', history: [], unread: 5 },
    ];
    const counts = run(chats, { archived: [3] });

    expect(counts.all).toBe(5);
    expect(counts.personal).toBe(3);
    expect(counts.groups).toBe(2);
    expect(counts.work).toBe(2);
    expect(counts.unread).toBe(5);
    expect(counts.archived).toBe(5);
  });

  it('ignores read chats and returns zeros for an empty folder', () => {
    const counts = run([{ id: 1, name: 'Alice', type: 'dm', history: [], unread: 0 }]);
    CHAT_FOLDER_KEYS.forEach((folder) => expect(counts[folder]).toBe(0));
  });

  it('hides spam chats from every counter when the spam filter is on', () => {
    const chats = [
      { id: 1, name: 'Alice', type: 'dm', history: [{ sender: 'me', text: 'hi' }], unread: 4 },
      { id: 2, name: 'Stranger', type: 'dm', history: [{ sender: 'them', text: 'buy' }], unread: 7 },
    ];
    const counts = run(chats, { contacts: [{ id: 1, name: 'Alice' }], spam: true });

    expect(counts.all).toBe(4);
    expect(counts.personal).toBe(4);
  });

  it('counts channels into the generic tabs and only archived ones into archived', () => {
    const channels = [
      { id: 'c1', name: 'News', history: [], unread: 2 },
      { id: 'c2', name: 'Old news', history: [], unread: 3 },
    ];
    const counts = run([], { channels, archived: ['c2'] });

    expect(counts.all).toBe(2);
    expect(counts.archived).toBe(3);
  });
});
