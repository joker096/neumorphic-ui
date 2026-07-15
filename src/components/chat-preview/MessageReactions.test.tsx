import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageReactions } from './MessageReactions';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-tooltip={content}>{children}</div>
  ),
}));

const baseProps: any = {
  msg: { id: 1, reactions: {} },
  isMe: false,
  activeReactionPicker: null,
  setActiveReactionPicker: vi.fn(),
  handleReaction: vi.fn(),
};

describe('MessageReactions', () => {
  it('renders add reaction button when no reactions exist', () => {
    render(<MessageReactions {...baseProps} />);
    const plusButton = document.querySelector('.lucide-plus');
    expect(plusButton).toBeInTheDocument();
  });

  it('renders reaction emojis with counts when reactions exist', () => {
    render(
      <MessageReactions
        {...baseProps}
        msg={{ id: 1, reactions: { '👍': 3, '❤️': 1 } }}
      />,
    );
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows reaction picker when activeReactionPicker matches msg.id and reactions exist', () => {
    render(
      <MessageReactions
        {...baseProps}
        activeReactionPicker={1}
        msg={{ id: 1, reactions: { '👍': 1 } }}
      />,
    );
    const emojiButtons = document.querySelectorAll('[role="button"]');
    expect(emojiButtons.length).toBeGreaterThanOrEqual(6);
  });

  it('calls handleReaction when reaction emoji is clicked', () => {
    const handleReaction = vi.fn();
    render(
      <MessageReactions
        {...baseProps}
        handleReaction={handleReaction}
        msg={{ id: 1, reactions: { '👍': 1 } }}
      />,
    );
    fireEvent.click(screen.getByText('👍'));
    expect(handleReaction).toHaveBeenCalledWith(1, '👍');
  });

  it('toggles reaction picker when add button is clicked', () => {
    const setActiveReactionPicker = vi.fn();
    const { container } = render(
      <MessageReactions
        {...baseProps}
        setActiveReactionPicker={setActiveReactionPicker}
      />,
    );
    const plusBtn = container.querySelector('.lucide-plus')?.closest('div[cursor-pointer]') ||
      container.querySelector('[class*="cursor-pointer"]');
    fireEvent.click(plusBtn!);
    expect(setActiveReactionPicker).toHaveBeenCalledWith(1);
  });

  it('renders tooltip for each reaction', () => {
    render(
      <MessageReactions
        {...baseProps}
        msg={{ id: 1, reactions: { '👍': 1 } }}
      />,
    );
    const tooltipEl = document.querySelector('[data-tooltip]');
    expect(tooltipEl).toBeInTheDocument();
  });
});
