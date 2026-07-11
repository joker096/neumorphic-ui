import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { UndoDeleteSnackbar } from './UndoDeleteSnackbar';

vi.mock('motion/react', () => ({
  motion: {
    div: 'div',
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('UndoDeleteSnackbar', () => {
  it('renders message when visible', () => {
    render(
      <UndoDeleteSnackbar
        visible
        message="Message deleted"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('Message deleted')).toBeInTheDocument();
  });

  it('does not render when visible is false', () => {
    render(
      <UndoDeleteSnackbar
        visible={false}
        message="Message deleted"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.queryByText('Message deleted')).not.toBeInTheDocument();
  });

  it('renders undo button', () => {
    render(
      <UndoDeleteSnackbar
        visible
        message="Deleted"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('fires onUndo when undo button is clicked', () => {
    const onUndo = vi.fn();
    render(
      <UndoDeleteSnackbar
        visible
        message="Deleted"
        onUndo={onUndo}
        onDismiss={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Undo'));
    expect(onUndo).toHaveBeenCalledOnce();
  });

  it('fires onDismiss when dismiss button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <UndoDeleteSnackbar
        visible
        message="Deleted"
        onUndo={vi.fn()}
        onDismiss={onDismiss}
      />
    );
    const dismissBtn = screen.getByRole('button', { name: '' });
    fireEvent.click(dismissBtn);
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders undo button with RotateCcw icon', () => {
    const { container } = render(
      <UndoDeleteSnackbar
        visible
        message="Deleted"
        onUndo={vi.fn()}
        onDismiss={vi.fn()}
      />
    );
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });
});
