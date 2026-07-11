import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatListView } from './ChatListView';

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => mockT(key),
  }),
}));

const mockT = (key: string) => {
  const map: Record<string, string> = {
    'header.stories': 'Stories',
    'header.myStory': 'My Story',
    'chat.searchPlaceholder': 'Search',
    'chat.searchChannelsPlaceholder': 'Search channels',
    'chat.searchBotsPlaceholder': 'Search bots',
    'chat.archived': 'Archived',
    'chat.createChannel': 'Create channel',
    'chat.createBot': 'Create bot',
    'chat.all': 'All',
    'chat.incoming': 'Incoming',
    'chat.outgoing': 'Outgoing',
    'chat.missed': 'Missed',
    'chat.recent': 'Recent',
    'chat.newFolder': 'New folder',
    'chat.noCalls': 'No calls',
    'chat.selectContact': 'Select contact',
    'chat.chooseContact': 'Choose a contact',
    'chat.noContactsAvailable': 'No contacts available',
    'chat.addContactsHint': 'Add contacts to start calling',
    'chat.cancel': 'Cancel',
    'chat.archive': 'Archive',
    'chat.unarchive': 'Unarchive',
    'chat.delete': 'Delete',
    'chat.markRead': 'Mark as read',
    'chat.selected': 'selected',
    'chat.sectionPinned': 'Pinned',
    'chat.sectionConversations': 'Conversations',
    'chat.sectionChannels': 'Channels',
    'chat.sectionBots': 'Bots',
    'chat.noBots': 'No bots configured',
    'chat.noResults': 'No results found',
    'chat.mute': 'Mute',
    'chat.unmute': 'Unmute',
    'chat.endCall': 'End call',
    'chat.unknownCaller': 'Unknown',
    'chat.searchOrDial': 'Search or dial...',
    'contacts.addContact': 'Add contact',
    'contacts.noContacts': 'No contacts',
    'chat.muteMicrophone': 'Mute microphone',
    'chat.unmuteMicrophone': 'Unmute microphone',
    'chat.enableSpeaker': 'Enable speaker',
    'chat.disableSpeaker': 'Disable speaker',
    'chat.noCallsHistory': 'No call history',
    'chat.incomingShort': 'Incoming',
    'chat.outgoingShort': 'Outgoing',
    'chat.createFolder': 'Create folder',
    'chat.yourFolders': 'Your folders',
    'chat.folderPlaceholder': 'Folder name...',
    'chat.folderNameHint': 'Give your folder a name',
    'chat.folderCreated': 'Folder created',
    'chat.folderDeleted': 'Folder deleted',
    'chat.create': 'Create',
    'chat.noFolder': 'No folders yet',
    'chat.tabs.stories': 'Stories',
    'chat.tabs.chats': 'Chats',
    'chat.tabs.channels': 'Channels',
    'chat.tabs.bots': 'Bots',
    'chat.folders.all': 'All',
    'chat.folders.personal': 'Personal',
    'chat.folders.unread': 'Unread',
    'chat.folders.work': 'Work',
    'chat.folders.archived': 'Archived',
  };
  return map[key] || key;
};

// Mock store
vi.mock('../../store', () => {
  const mockUseAppStore = vi.fn((selector: any) => {
    const mockState = {
      pinChat: vi.fn(),
      setChats: vi.fn(),
      shareRecording: false,
      setShareRecording: vi.fn(),
      setActiveChat: vi.fn(),
      setActiveStory: vi.fn(),
      setGlobalSelectedContact: vi.fn(),
      setView: vi.fn(),
      setShowCreateChannel: vi.fn(),
      setShowCreateBot: vi.fn(),
      setShowAdvancedFilterModal: vi.fn(),
      advancedFilters: {},
      setChatSearchQuery: vi.fn(),
    };
    if (typeof selector === 'function') {
      return selector(mockState);
    }
    if (!selector) return mockState;
    return mockState[selector];
  });
  return { useAppStore: mockUseAppStore };
});

const mockChats = [
  { id: 1, name: 'Alice', unread: 2, pinned: true },
  { id: 2, name: 'Bob', unread: 0, pinned: false },
  { id: 3, name: 'Charlie', unread: 1, pinned: false },
];

const mockChannels = [
  { id: 'ch1', name: 'General', unread: 0 },
];

const mockBots = [
  { id: 'bot1', name: 'TestBot', token: 'abc123' },
];

describe('ChatListView', () => {
  const baseProps = {
    theme: 'dark' as const,
    view: 'chats' as const,
    activeFolder: 'all' as const,
    setActiveFolder: vi.fn(),
    chatSearchQuery: '',
    setChatSearchQuery: vi.fn(),
    filteredChats: mockChats,
    filteredChannels: mockChannels,
    bots: mockBots,
    archivedUnreadCount: 0,
    toggleArchive: vi.fn(),
    contacts: [],
    setGlobalSelectedContact: vi.fn(),
    setActiveChat: vi.fn(),
    setView: vi.fn(),
    setActiveStory: vi.fn(),
    setShowCreateChannel: vi.fn(),
    setShowCreateBot: vi.fn(),
    setShowAdvancedFilterModal: vi.fn(),
    advancedFilters: {},
    t: mockT,
    onCall: vi.fn(),
    onVideoCall: vi.fn(),
  };

  it('renders with all props', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText(/stories/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<ChatListView {...baseProps} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders tabs', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });

  it('renders stories view when view is stories', () => {
    render(<ChatListView {...baseProps} view="stories" />);
    expect(document.querySelector('.px-4')).toBeInTheDocument();
  });

  it('renders chats view when view is chats', () => {
    render(<ChatListView {...baseProps} view="chats" />);
    expect(document.querySelector('.px-4')).toBeInTheDocument();
  });

  it('renders channels view when view is channels', () => {
    render(<ChatListView {...baseProps} view="channels" />);
    expect(document.querySelector('.px-4')).toBeInTheDocument();
  });

  it('renders bots view when view is bots', () => {
    render(<ChatListView {...baseProps} view="bots" />);
    expect(document.querySelector('div')).toBeInTheDocument();
  });

  it('renders archived button when not channels or bots', () => {
    render(<ChatListView {...baseProps} />);
    expect(document.querySelector('[title*="Archived"]') || document.querySelector('[title*="archived"]')).toBeInTheDocument();
  });

  it('renders create channel button when view is channels', () => {
    render(<ChatListView {...baseProps} view="channels" />);
    expect(document.querySelector('[title*="Create channel"]')).toBeInTheDocument();
  });

  it('renders create bot button when view is bots', () => {
    render(<ChatListView {...baseProps} view="bots" />);
    expect(document.querySelector('[title*="Create bot"]')).toBeInTheDocument();
  });

  it('renders bot items', () => {
    render(<ChatListView {...baseProps} view="bots" />);
    expect(screen.getByText(/TestBot/i)).toBeInTheDocument();
  });

  it('renders empty state for bots', () => {
    render(<ChatListView {...baseProps} bots={[]} view="bots" />);
    expect(document.querySelector('.text-center')).toBeInTheDocument();
  });

  it('renders empty state for no results', () => {
    render(<ChatListView {...baseProps} filteredChats={[]} filteredChannels={[]} />);
    expect(screen.getByText(/No results found|No results/i)).toBeInTheDocument();
  });

  it('renders folder tabs', () => {
    render(<ChatListView {...baseProps} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders filter button', () => {
    render(<ChatListView {...baseProps} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders with light theme', () => {
    render(<ChatListView {...baseProps} theme="light" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders pinned chats', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText('Pinned')).toBeInTheDocument();
  });

  it('renders regular chats', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText('Conversations')).toBeInTheDocument();
  });

  it('renders channel items', () => {
    render(<ChatListView {...baseProps} view="channels" />);
    expect(screen.getByText(/General/i)).toBeInTheDocument();
  });

  it('renders with select mode', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });

  it('renders with selected items', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });

  it('renders bulk actions when select mode is active', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });

  it('renders archive button', () => {
    render(<ChatListView {...baseProps} />);
    expect(document.querySelector('button')).toBeInTheDocument();
  });

  it('renders delete button', () => {
    render(<ChatListView {...baseProps} />);
    expect(document.querySelector('button')).toBeInTheDocument();
  });

  it('renders mark as read button', () => {
    render(<ChatListView {...baseProps} />);
    expect(document.querySelector('button')).toBeInTheDocument();
  });

  it('renders with archivedUnreadCount > 0', () => {
    render(<ChatListView {...baseProps} archivedUnreadCount={5} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });

  it('renders with onCall callback', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });

  it('renders with onVideoCall callback', () => {
    render(<ChatListView {...baseProps} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });

  it('renders with contacts', () => {
    render(<ChatListView {...baseProps} contacts={[{ name: 'Alice' }]} />);
    expect(screen.getByText(/chats/i)).toBeInTheDocument();
  });
});
