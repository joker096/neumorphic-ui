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
  { key: '1', chatId: 'c1', messageId: 101, sourceLabel: 'Alice', preview: 'Hey, how are you?', time: '14:30' },
  { key: '2', chatId: 'c2', messageId: 202, sourceLabel: 'Bob', preview: 'Sounds good!', time: '15:00' },
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
      'chat.savedNoResults': 'No matches',
      'search.chatsOrMessages': 'Search',
      'chat.openOriginal': 'Open in chat',
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

  it('filters saved messages by search query', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Bob' } });
    expect(screen.queryByText('Hey, how are you?')).not.toBeInTheDocument();
    expect(screen.getByText('Sounds good!')).toBeInTheDocument();
  });

  it('shows a no-results hint when nothing matches', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(screen.getByText('No matches')).toBeInTheDocument();
    expect(screen.queryByText('Hey, how are you?')).not.toBeInTheDocument();
  });

  it('clearing the query restores the full list', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'Alice' } });
    expect(screen.queryByText('Sounds good!')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.getByText('Sounds good!')).toBeInTheDocument();
    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
  });

  it('calls onOpenSavedMessage when Open is clicked', () => {
    const onOpenSavedMessage = vi.fn();
    render(<SavedMessagesPanel {...baseProps} onOpenSavedMessage={onOpenSavedMessage} />);
    const openButtons = screen.getAllByLabelText('Open in chat');
    expect(openButtons).toHaveLength(2);
    fireEvent.click(openButtons[0]);
    expect(onOpenSavedMessage).toHaveBeenCalledWith('c2', 202);
  });

  it('hides the Open button when no handler is provided', () => {
    render(<SavedMessagesPanel {...baseProps} />);
    expect(screen.queryByLabelText('Open in chat')).not.toBeInTheDocument();
  });
});
