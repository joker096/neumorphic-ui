import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatListItem } from './ChatListItem';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
  useReducedMotion: () => false,
}));

vi.mock('./FormattedText', () => ({
  FormattedText: ({ text }: any) => <span>{text}</span>,
}));

const mockStore: any = { stealthMode: false, typingIndicators: false, contactAvatars: {} };
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
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('shows timestamp', () => {
    render(<ChatListItem {...defaultProps} />);
    expect(screen.getByText('14:30')).toBeInTheDocument();
  });

  it('shows typing indicator when typingIndicators is true and chat.isTyping is true', () => {
    mockStore.typingIndicators = true;
    render(<ChatListItem {...defaultProps} chat={{ ...mockChat, isTyping: true }} />);
    expect(screen.getByText('typing...')).toBeInTheDocument();
    mockStore.typingIndicators = false;
  });

  it('fires onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ChatListItem {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText('Alice Johnson'));
    expect(onClick).toHaveBeenCalled();
  });

  it('shows attachment indicator when the last history message has an attachment', () => {
    render(<ChatListItem {...defaultProps} chat={{ ...mockChat, history: [{ id: 1, sender: 'me', text: 'photo', type: 'image', status: 'sent' }] }} />);
    expect(document.querySelector('.lucide-paperclip')).toBeInTheDocument();
  });

  it('shows a failed indicator on my last message when it failed', () => {
    render(<ChatListItem {...defaultProps} chat={{ ...mockChat, history: [{ id: 1, sender: 'me', text: 'oops', status: 'failed' }] }} />);
    expect(document.querySelector('svg.text-red-500')).toBeInTheDocument();
  });

  it('does not show a failed indicator on a delivered message', () => {
    render(<ChatListItem {...defaultProps} chat={{ ...mockChat, history: [{ id: 1, sender: 'me', text: 'ok', status: 'delivered' }] }} />);
    expect(document.querySelector('svg.text-red-500')).not.toBeInTheDocument();
  });

  it('applies active state class when active is true', () => {
    const { container } = render(<ChatListItem {...defaultProps} active={true} />);
    expect(container.querySelector('.chat-list-item-active')).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<ChatListItem {...defaultProps} />);
    const avatar = document.querySelector('[class*=" avatar"]');
    expect(avatar?.className).toContain('rounded-full');
    expect(avatar?.querySelector('.avatar-status')).toBeInTheDocument();
  });

  it('does not show online indicator when chat.online is false', () => {
    render(<ChatListItem {...defaultProps} chat={{ ...mockChat, online: false }} />);
    const avatar = document.querySelector('[class*=" avatar"]');
    expect(avatar?.querySelector('.avatar-status')).not.toBeInTheDocument();
  });

  it('calls onArchive when archive action is triggered', () => {
    const onArchive = vi.fn();
    render(<ChatListItem {...defaultProps} onArchive={onArchive} archiveLabel="chat.archive" />);
    fireEvent.click(screen.getAllByLabelText('chat.archive')[0]);
    expect(onArchive).toHaveBeenCalledWith(1);
  });

  it('calls onMute when mute action is triggered', () => {
    const onMute = vi.fn();
    render(<ChatListItem {...defaultProps} onMute={onMute} />);
    fireEvent.click(screen.getAllByLabelText('chat.mute')[0]);
    expect(onMute).toHaveBeenCalledWith(1);
  });

  it('opens delete confirmation when delete action is triggered', () => {
    const onDelete = vi.fn();
    render(<ChatListItem {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getAllByLabelText('chat.delete')[0]);
    expect(screen.getByText('chat.deleteChat')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('chat.delete'));
    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
