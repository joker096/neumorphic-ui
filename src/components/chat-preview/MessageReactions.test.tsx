import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageReactions } from './MessageReactions';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    lang: 'en',
    t: (key: string, fallback?: unknown) =>
      fallback && typeof fallback === 'object'
        ? `tip:${(fallback as { count?: unknown }).count}:${(fallback as { emoji?: unknown }).emoji}`
        : key,
  }),
}));

const baseProps: any = {
  msg: { id: 1, reactions: {} },
  onReactionMessage: vi.fn(),
};

describe('MessageReactions', () => {
  it('renders nothing when the message has no reactions', () => {
    const { container } = render(<MessageReactions {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
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

  it('calls handleReaction when reaction emoji is clicked', () => {
    const onReactionMessage = vi.fn();
    render(
      <MessageReactions
        {...baseProps}
        onReactionMessage={onReactionMessage}
        msg={{ id: 1, reactions: { '👍': 1 } }}
      />,
    );
    fireEvent.click(screen.getByText('👍'));
    expect(onReactionMessage).toHaveBeenCalledWith(1, '👍');
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
    expect(tooltipEl).toHaveAttribute('data-tooltip', 'tip:1:👍');
  });

  it('shows the localized reaction hint on hover', () => {
    render(
      <MessageReactions
        {...baseProps}
        msg={{ id: 1, reactions: { '👍': 2 } }}
      />,
    );
    fireEvent.mouseEnter(screen.getByText('👍'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('tip:2:👍');
    fireEvent.mouseLeave(screen.getByText('👍'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('toggles a reaction on an own message', () => {
    const onReactionMessage = vi.fn();
    render(
      <MessageReactions
        {...baseProps}
        onReactionMessage={onReactionMessage}
        msg={{ id: 1, reactions: { '👍': 1 } }}
      />,
    );
    fireEvent.click(screen.getByText('👍'));
    expect(onReactionMessage).toHaveBeenCalledWith(1, '👍');
  });

  it('highlights the local user reactions and marks them pressed', () => {
    render(
      <MessageReactions
        {...baseProps}
        msg={{ id: 1, reactions: { '👍': 2, '🔥': 1 }, myReactions: { '👍': true } }}
      />,
    );
    const mine = screen.getByText('👍').closest('[role="button"]')!;
    const other = screen.getByText('🔥').closest('[role="button"]')!;
    expect(mine).toHaveAttribute('aria-pressed', 'true');
    expect(mine.className).toContain('border-[var(--accent)]');
    expect(other).toHaveAttribute('aria-pressed', 'false');
  });

});
