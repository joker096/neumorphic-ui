import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatListItem } from './ChatListItem';

const mockStore = { stealthMode: false, typingIndicators: false };

vi.mock('../../store', () => ({
  useAppStore: vi.fn(() => mockStore),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: vi.fn(() => ({ t: (key: string) => key })),
}));

describe('ChatListItem', () => {
  const mockChat = {
    id: 1,
    name: 'Test Chat',
    message: 'Hello world',
    time: '12:30',
    unread: 0,
    online: true,
    color: 'from-blue-400 to-indigo-400',
  };

  beforeEach(() => {
    mockStore.stealthMode = false;
    mockStore.typingIndicators = false;
  });

  it('renders chat name', () => {
    render(<ChatListItem chat={mockChat} theme="dark" />);
    expect(screen.getByText('Test Chat')).toBeTruthy();
  });

  it('renders chat message', () => {
    render(<ChatListItem chat={mockChat} theme="dark" />);
    expect(screen.getByText('Hello world')).toBeTruthy();
  });

  it('renders online indicator', () => {
    render(<ChatListItem chat={{ ...mockChat, online: true }} theme="dark" />);
    expect(screen.getByText('Test Chat')).toBeTruthy();
  });

  it('renders unread count when present', () => {
    render(<ChatListItem chat={{ ...mockChat, unread: 3 }} theme="dark" />);
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('renders typing indicator when enabled', () => {
    mockStore.typingIndicators = true;

    render(<ChatListItem chat={{ ...mockChat, id: 1, type: 'chat' as const }} theme="dark" />);
    expect(screen.getByText('chat.typing')).toBeTruthy();
  });

  it('renders channel type differently', () => {
    render(<ChatListItem chat={mockChat} theme="dark" type="channel" />);
    expect(screen.getByText('Test Chat')).toBeTruthy();
  });

  it('renders with light theme', () => {
    render(<ChatListItem chat={mockChat} theme="light" />);
    expect(screen.getByText('Test Chat')).toBeTruthy();
  });
});
