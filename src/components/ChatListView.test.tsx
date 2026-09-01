import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ── Mocks: heavy children / store-dependent modules ──────────────────

vi.mock('./GlobalSearch', () => ({
  GlobalSearch: () => <div data-testid="global-search">GlobalSearch</div>,
}));

vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: (opts: any) => {
    const items = Array.from({ length: opts.count }, (_, i) => ({ key: i, index: i, start: i * 76, size: 76 }));
    return {
      getTotalSize: () => items.length * 76,
      getVirtualItems: () => items,
      measureElement: vi.fn(),
    };
  },
}));

vi.mock('./chat-preview', () => ({
  ChatListItem: (props: any) => (
    <button data-testid="chat-list-item" onClick={props.onAvatarClick}>
      {props.chat?.name ?? ''}
    </button>
  ),
  AvatarRow: () => <div data-testid="avatar-row" />,
  BulkActionsBar: () => <div data-testid="bulk-actions-bar" />,
  FolderFilterBar: () => <div data-testid="folder-filter-bar" />,
  ViewTabs: () => <div data-testid="view-tabs" />,
  ChatListSearchHeader: () => <div data-testid="chat-list-search-header" />,
  ChatListBots: () => <div data-testid="chat-list-bots" />,
}));

vi.mock('./chat-preview/ChatContextMenu', () => ({
  ChatContextMenu: () => <div data-testid="chat-context-menu" />,
}));

vi.mock('../hooks/useChatListActions', () => ({
  useChatListActions: () => ({
    selectMode: false,
    selectedIds: new Set<string | number>(),
    handleToggleSelect: vi.fn(),
    handleCancelSelect: vi.fn(),
    handleBulkArchive: vi.fn(),
    handleBulkDelete: vi.fn(),
    handleBulkMarkRead: vi.fn(),
    menu: null,
    openMenu: vi.fn(),
    closeMenu: vi.fn(),
    menuItems: [],
    handleMenuMute: vi.fn(),
    handleMenuDelete: vi.fn(),
  }),
}));

vi.mock('./ui/SearchInput', () => ({ SearchInput: () => <div /> }));
vi.mock('./ui/OnboardingPanel', () => ({ OnboardingPanel: () => <div /> }));
vi.mock('./ui/InviteQRModal', () => ({ InviteQRModal: () => <div /> }));
vi.mock('./ui/DataState', () => ({ DataState: () => <div /> }));

// ── Component under test ───────────────────────────────────────────────

import { ChatListView } from './ChatListView';

const t = (key: string, _fallback?: string) => key;

const baseProps = {
  theme: 'light' as const,
  view: 'chats',
  activeFolder: 'all',
  setActiveFolder: vi.fn(),
  chatSearchQuery: '',
  setChatSearchQuery: vi.fn(),
  filteredChats: [],
  filteredChannels: [],
  bots: [],
  archivedUnreadCount: 0,
  toggleArchive: vi.fn(),
  contacts: [],
  setGlobalSelectedContact: vi.fn(),
  setActiveChat: vi.fn(),
  onOpenChat: vi.fn(),
  activeChatId: null,
  setView: vi.fn(),
  setActiveStory: vi.fn(),
  onComposeStory: vi.fn(),
  setShowCreateChannel: vi.fn(),
  setShowCreateBot: vi.fn(),
  setShowCreateGroup: vi.fn(),
  setShowAdvancedFilterModal: vi.fn(),
  advancedFilters: {},
  t,
  isDark: false,
  onCall: vi.fn(),
  onVideoCall: vi.fn(),
  onOpenBot: vi.fn(),
  showAddContactFromChat: false,
  setShowAddContactFromChat: vi.fn(),
  onAddContactFromChat: vi.fn(),
};

describe('ChatListView keyboard shortcuts', () => {
  it('opens global search on Ctrl+K', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('closes global search on second Ctrl+K', () => {
    render(<ChatListView {...baseProps} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByTestId('global-search')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();
  });

  it('opens global search on Cmd+K (metaKey)', () => {
    render(<ChatListView {...baseProps} />);

    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    expect(screen.getByTestId('global-search')).toBeInTheDocument();
  });

  it('does not open global search on plain K', () => {
    render(<ChatListView {...baseProps} />);

    fireEvent.keyDown(document, { key: 'k' });

    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();
  });
});

describe('ChatListView avatar → contact profile (D1)', () => {
  it('opens the real store contact id, not a synthesized hash id', () => {
    const setGlobalSelectedContact = vi.fn();
    const chat = { id: 'dm-42', name: 'Alice', color: 'from-blue-400 to-cyan-500', online: true, isFavorite: false };
    const contact = { id: 'real-contact-7', name: 'Alice', color: 'from-blue-400 to-cyan-500', lastSeen: 0, online: true, isFavorite: false, localFields: { phone: '+1000' } };

    render(
      <ChatListView
        {...baseProps}
        filteredChats={[chat]}
        contacts={[contact]}
        setGlobalSelectedContact={setGlobalSelectedContact}
      />,
    );

    fireEvent.click(screen.getByTestId('chat-list-item'));

    expect(setGlobalSelectedContact).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'real-contact-7', name: 'Alice' }),
    );
    expect(setGlobalSelectedContact.mock.calls[0][0].id).not.toContain('hash_');
  });

  it('falls back to the chat id when no store contact matches by name', () => {
    const setGlobalSelectedContact = vi.fn();
    const chat = { id: 'dm-42', name: 'Ghost', color: 'from-gray-400 to-gray-500', online: false, isFavorite: false };

    render(
      <ChatListView
        {...baseProps}
        filteredChats={[chat]}
        contacts={[]}
        setGlobalSelectedContact={setGlobalSelectedContact}
      />,
    );

    fireEvent.click(screen.getByTestId('chat-list-item'));

    expect(setGlobalSelectedContact).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'dm-42', name: 'Ghost' }),
    );
  });
});
