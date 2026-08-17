import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PinnedMessagesBar } from './PinnedMessagesBar';

describe('PinnedMessagesBar', () => {
  const messages = [
    { id: 1, text: 'First pinned' },
    { id: 2, text: 'Second pinned' },
  ];

  it('renders nothing when there are no pinned messages', () => {
    const { container } = render(
      <PinnedMessagesBar chatId="c1" messages={messages} pinnedMessages={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the latest pinned preview and opens the list', () => {
    render(
      <PinnedMessagesBar
        chatId="c1"
        messages={messages}
        pinnedMessages={[
          { id: 1, chatId: 'c1', pinBy: 'me' },
          { id: 2, chatId: 'c1', pinBy: 'me' },
        ]}
      />,
    );
    expect(screen.getByText('Second pinned')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('chat.pinnedMessages'));
    expect(screen.getByText('First pinned')).toBeInTheDocument();
  });

  it('fires onUnpin from the list', () => {
    const onUnpin = vi.fn();
    render(
      <PinnedMessagesBar
        chatId="c1"
        messages={messages}
        pinnedMessages={[{ id: 1, chatId: 'c1', pinBy: 'me' }]}
        onUnpin={onUnpin}
      />,
    );
    fireEvent.click(screen.getByLabelText('chat.pinnedMessages'));
    const unpinButtons = screen.getAllByLabelText('chat.unpin');
    expect(unpinButtons.length).toBeGreaterThan(0);
    fireEvent.click(unpinButtons[0]);
    expect(onUnpin).toHaveBeenCalledWith(1);
  });
});
