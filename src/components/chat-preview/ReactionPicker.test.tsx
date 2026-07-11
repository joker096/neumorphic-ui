import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReactionPicker } from './ReactionPicker';

vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

const emojis = ['👍', '❤️', '😂', '🔥', '😢', '🎉'];

describe('ReactionPicker', () => {
  it('renders null when visible is false', () => {
    const { container } = render(
      <ReactionPicker visible={false} isMe={false} messageId={1} emojis={emojis} onSelect={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders grid of emoji reactions when visible is true', () => {
    render(
      <ReactionPicker visible={true} isMe={false} messageId={1} emojis={emojis} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('😂')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('😢')).toBeInTheDocument();
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('fires onSelect with emoji when clicked', () => {
    const onSelect = vi.fn();
    render(
      <ReactionPicker visible={true} isMe={false} messageId={1} emojis={emojis} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText('👍'));
    expect(onSelect).toHaveBeenCalledWith('👍');
  });

  it('fires onSelect with correct emoji for each button', () => {
    const onSelect = vi.fn();
    render(
      <ReactionPicker visible={true} isMe={false} messageId={1} emojis={['🔥', '🎉']} onSelect={onSelect} />,
    );
    fireEvent.click(screen.getByText('🔥'));
    expect(onSelect).toHaveBeenCalledWith('🔥');
    fireEvent.click(screen.getByText('🎉'));
    expect(onSelect).toHaveBeenCalledWith('🎉');
  });

  it('renders all emojis passed via props', () => {
    const customEmojis = ['😍', '🤩'];
    render(
      <ReactionPicker visible={true} isMe={false} messageId={1} emojis={customEmojis} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('😍')).toBeInTheDocument();
    expect(screen.getByText('🤩')).toBeInTheDocument();
  });
});
