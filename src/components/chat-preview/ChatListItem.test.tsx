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

  it('marks closed swipe-action buckets inert (not aria-hidden) so swipe buttons cannot trap focus', () => {
    const { container } = render(
      <ChatListItem {...defaultProps} onMute={vi.fn()} onArchive={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(container.querySelectorAll('[inert]').length).toBe(2);
    container.querySelectorAll('[inert]').forEach((el) => {
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  it('long press requests the menu with the row rect so it anchors to the row', async () => {
    vi.useFakeTimers();
    try {
      const onMenuRequest = vi.fn();
      const { container } = render(<ChatListItem {...defaultProps} onMenuRequest={onMenuRequest} />);
      const listitem = container.querySelector('[role="listitem"]') as HTMLElement;
      const row = Array.from(listitem.children).at(-1) as HTMLElement;
      row.getBoundingClientRect = () =>
        ({ left: 12, top: 240, right: 372, bottom: 304, width: 360, height: 64 }) as DOMRect;

      fireEvent.pointerDown(row, { bubbles: true });
      vi.advanceTimersByTime(600);

      expect(onMenuRequest).toHaveBeenCalledTimes(1);
      expect(onMenuRequest.mock.calls[0][1]).toBeNull();
      expect(onMenuRequest.mock.calls[0][2]).toEqual({
        left: 12,
        top: 240,
        right: 372,
        bottom: 304,
        width: 360,
        height: 64,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not request a menu on long press in select mode', () => {
    vi.useFakeTimers();
    try {
      const onMenuRequest = vi.fn();
      const { container } = render(<ChatListItem {...defaultProps} onMenuRequest={onMenuRequest} selectMode />);
      const listitem = container.querySelector('[role="listitem"]') as HTMLElement;
      const row = Array.from(listitem.children).at(-1) as HTMLElement;
      fireEvent.pointerDown(row, { bubbles: true });
      vi.advanceTimersByTime(600);
      expect(onMenuRequest).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
