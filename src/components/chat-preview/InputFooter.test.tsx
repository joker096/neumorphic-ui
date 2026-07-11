import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { InputFooter } from './InputFooter';

describe('InputFooter', () => {
  const defaultProps = {
    isChannel: false,
    isMuted: false,
    placeholder: 'Type a message...',
    t: (key: string) => {
      const map: Record<string, string> = {
        'chat.filters.unmuteChannel': 'Unmute Channel',
        'chat.filters.muteChannel': 'Mute Channel',
      };
      return map[key] || key;
    },
    onMuteToggle: vi.fn(),
  };

  it('renders Plus attachment button for non-channel chats', () => {
    const { container } = render(<InputFooter {...defaultProps} />);
    const plusIcon = container.querySelector('.lucide-plus');
    expect(plusIcon).toBeInTheDocument();
  });

  it('renders Mic button for non-channel chats', () => {
    const { container } = render(<InputFooter {...defaultProps} />);
    const micIcon = container.querySelector('.lucide-mic');
    expect(micIcon).toBeInTheDocument();
  });

  it('renders text input for non-channel chats', () => {
    render(<InputFooter {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type a message...');
    expect(input).toBeInTheDocument();
  });

  it('renders mute/unmute button for channel chats', () => {
    render(<InputFooter {...defaultProps} isChannel={true} isMuted={false} />);
    expect(screen.getByText('Mute Channel')).toBeInTheDocument();
  });

  it('renders unmute button for muted channel chats', () => {
    render(<InputFooter {...defaultProps} isChannel={true} isMuted={true} />);
    expect(screen.getByText('Unmute Channel')).toBeInTheDocument();
  });

  it('calls onMuteToggle when channel button is clicked', () => {
    const onMuteToggle = vi.fn();
    render(
      <InputFooter {...defaultProps} isChannel={true} onMuteToggle={onMuteToggle} />,
    );
    fireEvent.click(screen.getByText('Mute Channel'));
    expect(onMuteToggle).toHaveBeenCalled();
  });

  it('uses custom placeholder text', () => {
    render(<InputFooter {...defaultProps} placeholder="Custom placeholder..." />);
    expect(screen.getByPlaceholderText('Custom placeholder...')).toBeInTheDocument();
  });

  it('does not render Plus/Mic buttons for channel chats', () => {
    const { container } = render(
      <InputFooter {...defaultProps} isChannel={true} />,
    );
    expect(container.querySelector('.lucide-plus')).not.toBeInTheDocument();
    expect(container.querySelector('.lucide-mic')).not.toBeInTheDocument();
  });
});
