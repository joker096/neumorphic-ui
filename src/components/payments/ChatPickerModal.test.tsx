import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const chats: any[] = vi.hoisted(() => []);

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector({ chats }),
}));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, opts?: any) => (opts ? `${key}:${opts.id ?? ''}` : key),
  }),
}));
vi.mock('lucide-react', () => ({
  X: () => React.createElement('span', { 'data-testid': 'icon-x' }),
}));

import { ChatPickerModal } from './ChatPickerModal';

describe('ChatPickerModal', () => {
  beforeEach(() => {
    chats.length = 0;
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <ChatPickerModal open={false} onClose={() => {}} onPick={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders default title and close button when open', () => {
    const onClose = vi.fn();
    render(
      <ChatPickerModal open onClose={onClose} onPick={() => {}} />,
    );

    expect(screen.getByText('payments.sendToChat')).toBeInTheDocument();
    const closeBtn = screen.getByRole('button');
    expect(closeBtn).toContainElement(screen.getByTestId('icon-x'));
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders custom title when provided', () => {
    render(
      <ChatPickerModal open onClose={() => {}} onPick={() => {}} title="Custom Title" />,
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('shows empty state when there are no chats', () => {
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} />);

    expect(screen.getByText('chat.noChats')).toBeInTheDocument();
  });

  it('renders chat rows with name and last message', () => {
    chats.push({
      id: 'c1',
      name: 'Alice',
      lastMessage: 'Hey, how are you?',
    });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hey, how are you?')).toBeInTheDocument();
  });

  it('falls back to title, then to interpolated chat name', () => {
    chats.push({ id: 'c2', title: 'Group Chat' });
    chats.push({ id: 'c3' });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} />);

    expect(screen.getByText('Group Chat')).toBeInTheDocument();
    expect(screen.getByText('chat.chatName:c3')).toBeInTheDocument();
  });

  it('shows last message only when present', () => {
    chats.push({ id: 'c4', name: 'No Preview' });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} />);

    expect(screen.queryByText('chat.noChats')).not.toBeInTheDocument();
  });

  it('calls onPick with the selected chat', () => {
    const onPick = vi.fn();
    const chat = { id: 'c5', name: 'Bob' };
    chats.push(chat);
    render(<ChatPickerModal open onClose={() => {}} onPick={onPick} />);

    fireEvent.click(screen.getByText('Bob'));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(chat);
  });

  it('calls onClose when the overlay is clicked', () => {
    const onClose = vi.fn();
    render(<ChatPickerModal open onClose={onClose} onPick={() => {}} />);
    const overlay = document.body.querySelector('.fixed.inset-0') as HTMLElement;

    fireEvent.click(overlay);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the panel is clicked', () => {
    const onClose = vi.fn();
    render(<ChatPickerModal open onClose={onClose} onPick={() => {}} />);
    const panel = screen.getByText('payments.sendToChat').closest('.max-w-sm') as HTMLElement;

    fireEvent.click(panel);

    expect(onClose).not.toHaveBeenCalled();
  });
});
