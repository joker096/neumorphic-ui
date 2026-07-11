import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageActions } from './MessageActions';

describe('MessageActions', () => {
  const defaultProps = {
    isMe: false,
    isSaved: false,
    t: (key: string) => {
      const map: Record<string, string> = {
        'chat.reply': 'Reply',
        'chat.save': 'Save',
        'chat.saved': 'Saved',
      };
      return map[key] || key;
    },
  };

  it('renders reply button when onReply is provided', () => {
    render(<MessageActions {...defaultProps} onReply={vi.fn()} />);
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('renders save button when onToggleSaved is provided', () => {
    render(<MessageActions {...defaultProps} onToggleSaved={vi.fn()} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('shows "Saved" text when isSaved is true', () => {
    render(<MessageActions {...defaultProps} isSaved={true} onToggleSaved={vi.fn()} />);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('shows "Save" text when isSaved is false', () => {
    render(<MessageActions {...defaultProps} isSaved={false} onToggleSaved={vi.fn()} />);
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  it('fires onReply when reply button is clicked', () => {
    const onReply = vi.fn();
    render(<MessageActions {...defaultProps} onReply={onReply} />);
    fireEvent.click(screen.getByText('Reply'));
    expect(onReply).toHaveBeenCalled();
  });

  it('fires onToggleSaved when save button is clicked', () => {
    const onToggleSaved = vi.fn();
    render(<MessageActions {...defaultProps} onToggleSaved={onToggleSaved} />);
    fireEvent.click(screen.getByText('Save'));
    expect(onToggleSaved).toHaveBeenCalled();
  });

  it('returns null when isMe is true and no callbacks are provided', () => {
    const { container } = render(
      <MessageActions {...defaultProps} isMe={true} onReply={undefined} onToggleSaved={undefined} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows reply button for own messages when onReply is provided', () => {
    render(<MessageActions {...defaultProps} isMe={true} onReply={vi.fn()} />);
    expect(screen.getByText('Reply')).toBeInTheDocument();
  });

  it('shows Bookmark icon when save button is rendered', () => {
    const { container } = render(
      <MessageActions {...defaultProps} onToggleSaved={vi.fn()} />,
    );
    const bookmarkIcon = container.querySelector('.lucide-bookmark');
    expect(bookmarkIcon).toBeInTheDocument();
  });
});
