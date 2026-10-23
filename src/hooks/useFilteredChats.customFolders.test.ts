import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredChats } from './useFilteredChats';
import type { ChatFolder } from '../lib/chat/customFolders';

const NO_FILTERS = { hasMedia: false, hasAudio: false, hasReplies: false, fromBots: false, priority: false };

const run = (
  chats: any[],
  opts: {
    folder?: string;
    archived?: any[];
    channels?: any[];
    contacts?: any[];
    spam?: boolean;
    crm?: any[];
    customFolders?: ChatFolder[];
  } = {},
) =>
  renderHook(() =>
    useFilteredChats(
      chats,
      '',
      opts.folder ?? 'all',
      opts.archived ?? [],
      NO_FILTERS,
      opts.channels ?? [],
      opts.contacts ?? [],
      opts.spam ?? false,
      'recent',
      opts.crm ?? [],
      opts.customFolders ?? [],
    ),
  ).result.current;

describe('useFilteredChats — custom folders', () => {
  const workFolder: ChatFolder = { id: 'cf-work', name: 'Work', chatIds: [1, 'c1'] };

  it('filters chats by exact folder membership (ids compared as strings)', () => {
    const chats = [
      { id: 1, name: 'Alice', type: 'dm', history: [] },
      { id: 2, name: 'Team', type: 'group', history: [] },
    ];
    const r = run(chats, { folder: 'cf-work', customFolders: [workFolder] });
    expect(r.filteredChats.map((c: any) => c.id)).toEqual([1]);
  });

  it('includes channels whose id is a member', () => {
    const channels = [
      { id: 'c1', name: 'News', history: [] },
      { id: 'c2', name: 'Other', history: [] },
    ];
    const r = run([], { folder: 'cf-work', customFolders: [workFolder], channels });
    expect(r.filteredChannels.map((c: any) => c.id)).toEqual(['c1']);
  });

  it('sums unread only for member chats and channels', () => {
    const chats = [
      { id: 1, name: 'Alice', type: 'dm', history: [], unread: 3 },
      { id: 2, name: 'Team', type: 'group', history: [], unread: 2 },
    ];
    const channels = [{ id: 'c1', name: 'News', history: [], unread: 4 }];
    const r = run(chats, { folder: 'cf-work', customFolders: [workFolder], channels });
    expect(r.folderUnread['cf-work']).toBe(7);
    expect(r.folderUnread.all).toBe(9);
  });

  it('hides spam chats from the custom folder counter', () => {
    const chats = [
      { id: 1, name: 'Alice', type: 'dm', history: [{ sender: 'me', text: 'hi' }], unread: 4 },
      { id: 2, name: 'Stranger', type: 'dm', history: [{ sender: 'them', text: 'buy' }], unread: 7 },
    ];
    const customFolders: ChatFolder[] = [{ id: 'cf-w', name: 'Work', chatIds: [1, 2] }];
    const r = run(chats, { folder: 'cf-w', customFolders, contacts: [{ id: 1, name: 'Alice' }], spam: true });
    expect(r.folderUnread['cf-w']).toBe(4);
    expect(r.filteredChats.map((c: any) => c.id)).toEqual([1]);
  });
});
