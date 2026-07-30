import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SavedMessagesPanel } from './SavedMessagesPanel';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

const mockSavedMessages = [
  { key: '1', messageId: 101, sourceLabel: 'Alice', preview: 'Hey, how are you?', time: '14:30' },
  { key: '2', messageId: 202, sourceLabel: 'Bob', preview: 'Sounds good!', time: '15:00' },
];

const baseProps = {
  show: true,
  chatSavedMessages: mockSavedMessages,
  chatName: 'Test Chat',
  onClose: vi.fn(),
  onToggleSavedMessage: vi.fn(),
  t: (key: string, options?: any) => {
    const map: Record<string, any> = {
      'chat.savedMessages': 'Saved Messages',
      'chat.savedItems': options ? `${options.n} items from ${options.chatName}` : '',
      'chat.unsave': 'Unsave',
      'chat.noSavedMessages': 'No saved messages yet',
    };
    return map[key] || key;
  },
  isDark: true,
};

describe('SavedMessagesPanel', () => {
  it('renders nothing when show is false', () => {
    const { container } = render(<SavedMessagesPanel {...baseProps} show={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders list of saved messages when show is true', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
    expect(screen.getByText('Sounds good!')).toBeInTheDocument();
  });

  it('shows sender/original source info', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows timestamps for saved messages', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('shows unsave/remove buttons', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    const unsaveButtons = screen.getAllByText('Unsave');
    expect(unsaveButtons).toHaveLength(2);
  });

  it('calls onToggleSavedMessage when unsave button is clicked', () => {
    const onToggleSavedMessage = vi.fn();
    render(
      <SavedMessagesPanel {...baseProps} onToggleSavedMessage={onToggleSavedMessage} />,
    );
    const unsaveButtons = screen.getAllByText('Unsave');
    fireEvent.click(unsaveButtons[1]);
    expect(onToggleSavedMessage).toHaveBeenCalledWith({ id: 'Test Chat' }, { id: 101 });
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<SavedMessagesPanel {...baseProps} onClose={onClose} />);
    const backdrop = document.querySelector('.bg-black\\/40');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows empty state when no saved messages', () => {
    render(
      <SavedMessagesPanel {...baseProps} chatSavedMessages={[]} />,
    );
    expect(screen.getByText('No saved messages yet')).toBeInTheDocument();
  });
});
