import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GroupManagementPanel } from './GroupManagementPanel';

let mockStore: any = {};

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => (typeof selector === 'function' ? selector(mockStore) : mockStore),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => fallback ?? key, lang: 'en', setLang: vi.fn() }),
}));

const GROUP = { inviteToken: 'ma_g1', slowModeSeconds: 0, ownerId: 'owner-id' };

const chatsFor = (role: 'owner' | 'admin' | 'member') => [
  {
    id: 'g1',
    type: 'group',
    group: { ...GROUP },
    members: [
      { id: 'owner-id', name: 'Owner', color: '', role: 'owner' as const },
      ...(role === 'owner' ? [] : [{ id: 'me', name: 'Me', color: '', role }]),
      { id: 'a', name: 'A', color: '', role: 'member' as const },
    ],
  },
];

const renderPanel = (role: 'owner' | 'admin' | 'member') => {
  mockStore = {
    chats: chatsFor(role),
    contacts: [{ id: 'z', name: 'Zed', color: '' }],
    userProfile: { id: role === 'owner' ? 'owner-id' : 'me' },
    updateGroup: vi.fn(),
  };
  render(
    <GroupManagementPanel
      chatId="g1"
      members={mockStore.chats[0].members}
      group={mockStore.chats[0].group}
      isDark={false}
    />,
  );
};

describe('GroupManagementPanel role gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('owner sees invite, slow mode, member controls and add-member', () => {
    renderPanel('owner');
    expect(screen.getByRole('button', { name: 'Copy invite link' })).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'Slow mode' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'A Mute' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'A Ban' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Add member Zed' })).toBeDefined();
  });

  it('admin sees invite, slow mode, member controls and add-member', () => {
    renderPanel('admin');
    expect(screen.getByRole('button', { name: 'Copy invite link' })).toBeDefined();
    expect(screen.getByRole('combobox', { name: 'Slow mode' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'A Mute' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Add member Zed' })).toBeDefined();
  });

  it('member sees read-only member list without management controls', () => {
    renderPanel('member');
    expect(screen.queryByRole('button', { name: 'Copy invite link' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Slow mode' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'A Mute' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'A Ban' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add member Zed' })).toBeNull();
    expect(screen.getByText('Me')).toBeDefined();
  });

  it('owner row has no self-management controls', () => {
    renderPanel('owner');
    expect(screen.queryByRole('button', { name: 'Owner Mute' })).toBeNull();
    expect(screen.queryByRole('combobox', { name: 'Owner Role' })).toBeNull();
  });
});
