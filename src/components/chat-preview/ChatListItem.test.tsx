import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatListItem } from './ChatListItem';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('./FormattedText', () => ({
  FormattedText: ({ text }: any) => <span>{text}</span>,
}));

const mockStore: any = { stealthMode: false, typingIndicators: false };
vi.mock('../../store', () => ({
  useAppStore: (selector: any) => (typeof selector === 'function' ? selector(mockStore) : mockStore),
}));

const mockChat = {
  id: 1,
  name: 'Alice Johnson',
  message: 'Hey, how are you?',
  time: '14:30',
  unread: 3,
  online: true,
  color: 'from-purple-400 to-pink-600',
  pinned: false,
};

const defaultProps = {
  chat: mockChat,
  onClick: vi.fn(),
  t: (key: string) => {
    const map: Record<string, string> = {
      'chat.typing': 'typing...',
      'chat.startCall': 'Call',
      'chat.startVideoCall': 'Video',
      'chat.archiveChat': 'Archive',
      'chat.muteChat': 'Mute',
      'chat.shareChat': 'Share',
      'chat.blockChat': 'Block',
    };
    return map[key] || key;
  },
};

describe('ChatListItem', () => {
  it('renders avatar initial, name, and last message', () => {
    render(<ChatListItem {...defaultProps} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
  });

  it('shows unread badge when unread > 0', () => {
    render(<ChatListItem {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('does not show unread badge when unread is 0', () => {
    render(<ChatListItem {...defaultProps} chat={{ ...mockChat, unread: 0 }} />);
    expect(document.querySelector('.bg-emerald-500')).not.toBeInTheDocument();
  });

  it('shows timestamp', () => {
    render(<ChatListItem {...defaultProps} />);
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('shows typing indicator when typingIndicators is true and chat.id is 1', () => {
    mockStore.typingIndicators = true;
    render(<ChatListItem {...defaultProps} />);
    expect(screen.getByText('typing...')).toBeInTheDocument();
    mockStore.typingIndicators = false;
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ChatListItem {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText('Alice Johnson'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies active state class when active is true', () => {
    const { container } = render(<ChatListItem {...defaultProps} active={true} />);
    expect(container.querySelector('.chat-list-item-active')).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<ChatListItem {...defaultProps} />);
    const onlineDot = document.querySelector('.bg-green-400') || document.querySelector('.bg-emerald-500');
    expect(onlineDot).toBeInTheDocument();
  });

  it('does not show online indicator when chat.online is false', () => {
    render(<ChatListItem {...defaultProps} chat={{ ...mockChat, online: false }} />);
    expect(document.querySelector('.bg-emerald-500')).not.toBeInTheDocument();
  });
});
