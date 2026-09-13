import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatProfileView } from './ChatProfileView';
import { toast } from './ui/Toast';

let mockStore: any = {};

vi.mock('../store', () => ({
  useAppStore: (selector: any) => (typeof selector === 'function' ? selector(mockStore) : mockStore),
}));

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string | { count: number }) => (typeof fallback === 'string' ? fallback : key),
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

vi.mock('../lib/crm/bridge', () => ({
  findCrmContactByChat: () => undefined,
}));

vi.mock('./ui/Toast', () => ({
  toast: vi.fn(),
}));

const mockChat = { id: 7, name: 'Alice', color: 'from-blue-400 to-cyan-500', type: 'user' as const, online: true };

const defaultProps = {
  open: true,
  chat: mockChat,
  isDark: false,
  onClose: vi.fn(),
  onMessage: vi.fn(),
  onCall: vi.fn(),
  onVideoCall: vi.fn(),
};

describe('ChatProfileView block action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = {
      chats: [mockChat],
      contacts: [],
      userProfile: { id: 'me', name: 'Me' },
      crmContacts: [],
      crmDeals: [],
      crmTasks: [],
      pinnedMessageList: [],
      setContactBlocked: vi.fn(),
      setChatMuted: vi.fn(),
      removePinnedMessage: vi.fn(),
      deleteGroup: vi.fn(),
      leaveGroup: vi.fn(),
      leaveChannel: vi.fn(),
      updateGroup: vi.fn(),
    };
  });

it('marks the name-matched store contact as blocked on Block click', () => {
    mockStore.contacts = [{ id: 'hash_alice_123', name: 'Alice', color: 'from-blue-400 to-cyan-500', lastSeen: 0 }];
    render(<ChatProfileView {...defaultProps} />);

    const blockBtn = screen.getByRole('button', { name: /^Block$/ });
    fireEvent.click(blockBtn);

    expect(mockStore.setContactBlocked).toHaveBeenCalledWith('hash_alice_123', true);
    expect(toast).toHaveBeenCalledWith('User blocked', 'success');
  });

  it('renders into the document body portal so a transformed ancestor cannot trap it (z-index fix)', () => {
    render(<ChatProfileView {...defaultProps} />);

    const overlay = Array.from(document.body.children).find(
      (el) => el instanceof HTMLElement && el.className.includes('fixed inset-0')
    ) as HTMLElement | undefined;

    expect(overlay).toBeTruthy();
    expect(overlay.className).toContain('z-[var(--z-modal)]');
  });

  it('unmarks the store contact on Unblock click and skips the blocked toast', () => {
    mockStore.contacts = [{ id: 'hash_alice_123', name: 'Alice', color: 'from-blue-400 to-cyan-500', lastSeen: 0, isBlocked: true }];
    render(<ChatProfileView {...defaultProps} />);

    const unblockBtn = screen.getByRole('button', { name: /^Unblock$/ });
    fireEvent.click(unblockBtn);

    expect(mockStore.setContactBlocked).toHaveBeenCalledWith('hash_alice_123', false);
    expect(toast).not.toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('hides the Block action when no store contact resolves (D3)', () => {
    mockStore.contacts = [];
    render(<ChatProfileView {...defaultProps} />);

    expect(screen.queryByRole('button', { name: /^Block$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Unblock$/ })).not.toBeInTheDocument();
    expect(document.querySelector('[class*="lucide-user-x"]')).toBeNull();
  });

  it('removes the channel chat from the store on Leave click (D5)', () => {
    mockStore.chats = [{ id: 'ch1', isChannel: true }];
    render(<ChatProfileView open={defaultProps.open} chat={{ id: 'ch1', name: 'News', color: 'from-blue-400 to-cyan-500', isChannel: true }} isDark={defaultProps.isDark} onClose={defaultProps.onClose} onMessage={defaultProps.onMessage} onCall={defaultProps.onCall} onVideoCall={defaultProps.onVideoCall} />);

    fireEvent.click(screen.getByRole('button', { name: /Leave/ }));

    expect(mockStore.leaveChannel).toHaveBeenCalledWith('ch1');
    expect(toast).toHaveBeenCalledWith('You left the chat', 'success');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('mutes a numeric-id channel using the raw id (D1 regression)', () => {
    mockStore.chats = [{ id: 4, name: 'Tech Insights', color: 'from-slate-700 to-slate-900', isChannel: true }];
    render(<ChatProfileView open={defaultProps.open} chat={{ id: 4, name: 'Tech Insights', color: 'from-slate-700 to-slate-900', isChannel: true }} isDark={defaultProps.isDark} onClose={defaultProps.onClose} onMessage={defaultProps.onMessage} onCall={defaultProps.onCall} onVideoCall={defaultProps.onVideoCall} />);

    // single quick-toggle row (Mute/Notifications dedup): no permission switches for channels.
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(1);
    fireEvent.click(switches[0]);

    expect(mockStore.setChatMuted).toHaveBeenCalledWith(4, true);
  });

  it('updates group permissions using the raw numeric id (D1 regression)', () => {
    mockStore.userProfile = { id: 'contact_001', name: 'Alice' };
    mockStore.chats = [{
      id: 2,
      name: 'Design Team',
      type: 'group',
      members: [{ id: 'contact_001', name: 'Alice', color: 'from-pink-400 to-rose-400', role: 'owner' }],
      group: { inviteToken: 'ma_2', slowModeSeconds: 0, ownerId: 'contact_001' },
    }];
    render(<ChatProfileView open={defaultProps.open} chat={{ id: 2, name: 'Design Team', color: 'from-amber-400 to-orange-500', type: 'group' }} isDark={defaultProps.isDark} onClose={defaultProps.onClose} onMessage={defaultProps.onMessage} onCall={defaultProps.onCall} onVideoCall={defaultProps.onVideoCall} />);

    // switch order: [0]=Mute row, [1]=Send messages permission (Notifications row removed).
    fireEvent.click(screen.getAllByRole('switch')[1]);

    expect(mockStore.updateGroup).toHaveBeenCalledWith(2, expect.objectContaining({ group: expect.objectContaining({ permissions: expect.objectContaining({ sendMessages: false }) }) }));
  });
});
