import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  FolderFilterBar: (props: any) => <div data-testid="folder-filter-bar" data-segments={(props.segments ?? []).join(',')} />,
  ViewTabs: () => <div data-testid="view-tabs" />,
  ChatListSearchHeader: () => <div data-testid="chat-list-search-header" />,
  ChatListBots: () => <div data-testid="chat-list-bots" />,
}));

vi.mock('./chat-preview/ChatContextMenu', () => ({
  ChatContextMenu: () => <div data-testid="chat-context-menu" />,
}));

vi.mock('./ui/ConfirmDialog', () => ({
  ConfirmDialog: (props: any) =>
    props.isOpen ? (
      <div role="dialog">
        <span data-testid="confirm-title">{props.title}</span>
        <button type="button" data-testid="confirm-cancel" onClick={props.onCancel}>{props.cancelLabel}</button>
        <button type="button" data-testid="confirm-confirm" onClick={props.onConfirm}>{props.confirmLabel}</button>
      </div>
    ) : null,
}));

const hookWith = vi.hoisted(() => (overrides: Record<string, any> = {}) => ({
  selectMode: false,
  selectedIds: new Set<string | number>(),
  handleToggleSelect: vi.fn(),
  handleCancelSelect: vi.fn(),
  handleBulkArchive: vi.fn(),
  handleBulkDelete: vi.fn(),
  handleBulkMarkRead: vi.fn(),
  handleBulkMute: vi.fn(),
  menu: null,
  openMenu: vi.fn(),
  closeMenu: vi.fn(),
  menuItems: [],
  handleMenuMute: vi.fn(),
  handleChatOpen: vi.fn(),
  handleMenuDelete: vi.fn(),
  deleteConfirm: null,
  requestMenuDelete: vi.fn(),
  requestBulkDelete: vi.fn(),
  cancelDelete: vi.fn(),
  confirmDelete: vi.fn(),
  ...overrides,
}));

vi.mock('../hooks/useChatListActions', () => ({
  useChatListActions: vi.fn(() => hookWith()),
}));

vi.mock('./ui/SearchInput', () => ({ SearchInput: () => <div /> }));
vi.mock('./ui/OnboardingPanel', () => ({ OnboardingPanel: () => <div /> }));
vi.mock('./ui/InviteQRModal', () => ({ InviteQRModal: () => <div /> }));
vi.mock('./ui/DataState', () => ({ DataState: () => <div /> }));

// ── Component under test ───────────────────────────────────────────────

import { ChatListView } from './ChatListView';
import { useChatListActions } from '../hooks/useChatListActions';
import { useAppStore } from '../store';
import { useUiStore } from '../store/uiStore';

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
  it('opens global search on Ctrl+K', async () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

    expect(await screen.findByTestId('global-search')).toBeInTheDocument();
  });

  it('closes global search on second Ctrl+K', async () => {
    render(<ChatListView {...baseProps} />);

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(await screen.findByTestId('global-search')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.queryByTestId('global-search')).not.toBeInTheDocument();
  });

  it('opens global search on Cmd+K (metaKey)', async () => {
    render(<ChatListView {...baseProps} />);

    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    expect(await screen.findByTestId('global-search')).toBeInTheDocument();
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

describe('ChatListView delete confirmation (lifted ConfirmDialog)', () => {
  it('renders no confirm dialog when no delete is pending', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirms a single chat delete through the lifted dialog', () => {
    const confirmDelete = vi.fn();
    vi.mocked(useChatListActions).mockImplementation(
      () => hookWith({ deleteConfirm: { kind: 'single', chat: { id: 'dm-1', name: 'Alice' } }, confirmDelete }),
    );

    render(<ChatListView {...baseProps} />);

    expect(screen.getByTestId('confirm-title')).toHaveTextContent('chat.deleteChat');
    fireEvent.click(screen.getByTestId('confirm-confirm'));
    expect(confirmDelete).toHaveBeenCalledTimes(1);
  });

  it('confirms a bulk delete with the count title', () => {
    const confirmDelete = vi.fn();
    vi.mocked(useChatListActions).mockImplementation(
      () => hookWith({ selectedIds: new Set(['a', 'b', 'c']), deleteConfirm: { kind: 'bulk' }, confirmDelete }),
    );

    render(<ChatListView {...baseProps} />);

    expect(screen.getByTestId('confirm-title')).toHaveTextContent('chat.bulkDeleteConfirm');
    fireEvent.click(screen.getByTestId('confirm-confirm'));
    expect(confirmDelete).toHaveBeenCalledTimes(1);
  });
});

describe('ChatListView CRM next-steps banner', () => {
  const overdueTask = { id: 't1', title: 'Call lead', done: false, priority: 'high', dueAt: Date.now() - 60_000, createdAt: 0 };

  const withStore = (premium: boolean, tasks: any[]) => {
    useAppStore.setState({
      premiumEntitlement: { premium, plan: premium ? 'premium' : null, expiresAt: null } as any,
      crmTasks: tasks as any,
    });
    useUiStore.setState({ crmTabRequest: null });
  };

  beforeEach(() => {
    vi.mocked(useChatListActions).mockImplementation(() => hookWith());
  });

  afterEach(() => {
    useAppStore.setState({ premiumEntitlement: undefined as any, crmTasks: [] as any });
    useUiStore.setState({ crmTabRequest: null });
  });

  it('routes to the CRM tasks tab when the reminder is clicked', () => {
    const setView = vi.fn();
    withStore(true, [overdueTask]);

    render(<ChatListView {...baseProps} setView={setView} />);
    fireEvent.click(screen.getByText('crm.nextSteps'));

    expect(setView).toHaveBeenCalledWith('company');
    expect(useUiStore.getState().crmTabRequest).toBe('tasks');
  });

  it('renders no reminder without actionable tasks', () => {
    withStore(true, []);
    render(<ChatListView {...baseProps} />);
    expect(screen.queryByText('crm.nextSteps')).not.toBeInTheDocument();
  });

  it('hides the reminder on the free tier', () => {
    withStore(false, [overdueTask]);
    render(<ChatListView {...baseProps} />);
    expect(screen.queryByText('crm.nextSteps')).not.toBeInTheDocument();
  });
});

describe('ChatListView CRM sales-segment folders', () => {
  afterEach(() => {
    useAppStore.setState({ crmContacts: [] as any });
  });

  it('passes sales segments to the folder bar only when the CRM has contacts', () => {
    useAppStore.setState({ crmContacts: [] as any });
    const { unmount } = render(<ChatListView {...baseProps} />);
    expect(screen.getByTestId('folder-filter-bar').getAttribute('data-segments')).toBe('');
    unmount();

    useAppStore.setState({ crmContacts: [{ userId: '1', displayName: 'A', status: 'lead' }] as any });
    render(<ChatListView {...baseProps} />);
    expect(screen.getByTestId('folder-filter-bar').getAttribute('data-segments')).toBe('leads,clients');
  });
});
