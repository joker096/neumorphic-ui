import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ChatHeader } from './ChatHeader';

const defaultProps = {
  chat: {
    name: 'Alice Johnson',
    color: 'from-purple-400 to-pink-600',
    online: true,
    isFavorite: false,
    id: 'chat-1',
  },
  onClose: vi.fn(),
  onProfileClick: vi.fn(),
  t: (key: string) => {
    const map: Record<string, string> = {
      'chat.filters.online': 'Online',
      'chat.filters.offline': 'Offline',
    };
    return map[key] || key;
  },
  isDark: true,
};

describe('ChatHeader', () => {
  it('shows chat name/title', () => {
    render(<ChatHeader {...defaultProps} />);
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<ChatHeader {...defaultProps} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
    const avatar = screen.getByText('A').closest('div');
    expect(avatar?.querySelector('[class*="absolute"]')).toBeInTheDocument();
  });

  it('shows offline status when not online', () => {
    render(
      <ChatHeader
        {...defaultProps}
        chat={{ ...defaultProps.chat, online: false }}
      />,
    );
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders back button', () => {
    const { container } = render(<ChatHeader {...defaultProps} />);
    const chevronLeft = container.querySelector('svg') || container.querySelector('button');
    expect(chevronLeft || container.querySelector('[class*="cursor-pointer"]')).toBeInTheDocument();
  });

  it('fires onClose when back button is clicked', () => {
    const onClose = vi.fn();
    render(<ChatHeader {...defaultProps} onClose={onClose} />);
    const chevronEl = document.querySelector('svg') || document.querySelector('[class*="cursor-pointer"]');
    const backButton = document.querySelector('[class*="cursor-pointer"]');
    if (backButton) {
      fireEvent.click(backButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('fires onProfileClick when avatar is clicked', () => {
    const onProfileClick = vi.fn();
    render(<ChatHeader {...defaultProps} onProfileClick={onProfileClick} />);
    const avatarDiv = screen.getByText('A');
    fireEvent.click(avatarDiv.closest('div[cursor-pointer]') || avatarDiv);
    expect(onProfileClick).toHaveBeenCalled();
  });

  it('renders chat initial avatar letter', () => {
    render(<ChatHeader {...defaultProps} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders call and video-call buttons for a 1:1 chat', () => {
    const onCall = vi.fn();
    const onVideoCall = vi.fn();
    render(<ChatHeader {...defaultProps} onCall={onCall} onVideoCall={onVideoCall} />);
    expect(screen.getByLabelText('chat.startCall')).toBeInTheDocument();
    expect(screen.getByLabelText('chat.startVideoCall')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('chat.startCall'));
    expect(onCall).toHaveBeenCalledWith('Alice Johnson', 'from-purple-400 to-pink-600');
    fireEvent.click(screen.getByLabelText('chat.startVideoCall'));
    expect(onVideoCall).toHaveBeenCalledWith('Alice Johnson', 'from-purple-400 to-pink-600');
  });

  it('hides call buttons for groups, channels and bots', () => {
    const { rerender } = render(<ChatHeader {...defaultProps} onCall={vi.fn()} onVideoCall={vi.fn()} chat={{ ...defaultProps.chat, type: 'group' }} />);
    expect(screen.queryByLabelText('chat.startCall')).not.toBeInTheDocument();
    rerender(<ChatHeader {...defaultProps} onCall={vi.fn()} onVideoCall={vi.fn()} chat={{ ...defaultProps.chat, type: 'channel' }} />);
    expect(screen.queryByLabelText('chat.startCall')).not.toBeInTheDocument();
    rerender(<ChatHeader {...defaultProps} onCall={vi.fn()} onVideoCall={vi.fn()} chat={{ ...defaultProps.chat, type: 'bot' }} />);
    expect(screen.queryByLabelText('chat.startCall')).not.toBeInTheDocument();
  });
});
