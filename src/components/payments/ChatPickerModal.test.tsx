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
  Check: () => React.createElement('span', { 'data-testid': 'icon-check' }),
  Bookmark: () => React.createElement('span', { 'data-testid': 'icon-bookmark' }),
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

  it('hides the excluded chat (forward source) and keeps the rest', () => {
    chats.push({ id: 7, name: 'Source' }, { id: 8, name: 'Target' });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} excludeChatId={7} />);

    expect(screen.queryByText('Source')).not.toBeInTheDocument();
    expect(screen.getByText('Target')).toBeInTheDocument();
  });

  it('matches the excluded id by string so numeric and string ids both work', () => {
    chats.push({ id: '9', name: 'Numeric source' });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} excludeChatId={9} />);

    expect(screen.queryByText('Numeric source')).not.toBeInTheDocument();
  });

  it('shows the empty state when only the source chat exists', () => {
    chats.push({ id: 10, name: 'Only chat' });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} excludeChatId={10} />);

    expect(screen.getByText('chat.noChats')).toBeInTheDocument();
    expect(screen.queryByText('Only chat')).not.toBeInTheDocument();
  });

  it('toggles rows instead of forwarding on tap in multi-select mode', () => {
    chats.push({ id: 'a', name: 'Alice' });
    const onPick = vi.fn();
    render(<ChatPickerModal open onClose={() => {}} onPick={onPick} multiSelect onPickMany={() => {}} />);

    fireEvent.click(screen.getByText('Alice'));

    expect(onPick).not.toHaveBeenCalled();
    expect(screen.getByText('Alice').closest('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('confirms the whole selection in one call', () => {
    chats.push({ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' });
    const onPickMany = vi.fn();
    render(
      <ChatPickerModal open onClose={() => {}} onPick={() => {}} multiSelect onPickMany={onPickMany} />,
    );

    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByText('Bob'));
    fireEvent.click(screen.getByText(/chat\.forwardCount/));

    expect(onPickMany).toHaveBeenCalledTimes(1);
    expect(onPickMany.mock.calls[0][0].map((c: any) => c.id)).toEqual(['a', 'b']);
  });

  it('offers Saved Messages as a forward target and includes it in the selection', () => {
    chats.push({ id: 'a', name: 'Alice' });
    const onPickMany = vi.fn();
    render(
      <ChatPickerModal
        open
        onClose={() => {}}
        onPick={() => {}}
        multiSelect
        onPickMany={onPickMany}
        savedLabel="Saved Messages"
      />,
    );

    expect(screen.getByText('Saved Messages')).toBeInTheDocument();
    expect(screen.getByTestId('icon-bookmark')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Saved Messages'));
    fireEvent.click(screen.getByText('Alice'));
    fireEvent.click(screen.getByText(/chat\.forwardCount/));

    expect(onPickMany).toHaveBeenCalledTimes(1);
    expect(onPickMany.mock.calls[0][0].map((c: any) => c.id)).toEqual(['__saved_forward__', 'a']);
  });

  it('keeps the confirm button disabled while nothing is selected', () => {
    chats.push({ id: 'a', name: 'Alice' });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} multiSelect onPickMany={() => {}} />);

    expect(screen.getByText(/chat\.forwardCount/)).toBeDisabled();
    fireEvent.click(screen.getByText('Alice'));
    expect(screen.getByText(/chat\.forwardCount/)).not.toBeDisabled();
  });

  it('drops the previous selection when the picker closes', () => {
    chats.push({ id: 'a', name: 'Alice' });
    const { rerender } = render(
      <ChatPickerModal open onClose={() => {}} onPick={() => {}} multiSelect onPickMany={() => {}} />,
    );

    fireEvent.click(screen.getByText('Alice'));
    rerender(<ChatPickerModal open={false} onClose={() => {}} onPick={() => {}} multiSelect onPickMany={() => {}} />);
    rerender(<ChatPickerModal open onClose={() => {}} onPick={() => {}} multiSelect onPickMany={() => {}} />);

    expect(screen.getByText(/chat\.forwardCount/)).toBeDisabled();
    expect(screen.getByText('Alice').closest('button')).toHaveAttribute('aria-pressed', 'false');
  });

  it('stays single-pick (no confirm button) outside multi-select mode', () => {
    chats.push({ id: 'a', name: 'Alice' });
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} />);

    expect(screen.queryByText(/chat\.forwardCount/)).not.toBeInTheDocument();
  });

  it('renders a caption textarea only when caption props are present and wires changes', () => {
    const onCaptionChange = vi.fn();
    render(
      <ChatPickerModal
        open
        onClose={() => {}}
        onPick={() => {}}
        caption=""
        onCaptionChange={onCaptionChange}
      />,
    );

    expect(screen.getByPlaceholderText('chat.captionPlaceholder')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('chat.captionPlaceholder'), {
      target: { value: 'note' },
    });
    expect(onCaptionChange).toHaveBeenCalledWith('note');
  });

  it('omits the caption textarea in the payments single-pick mode', () => {
    render(<ChatPickerModal open onClose={() => {}} onPick={() => {}} />);
    expect(screen.queryByPlaceholderText('chat.captionPlaceholder')).not.toBeInTheDocument();
  });
});
