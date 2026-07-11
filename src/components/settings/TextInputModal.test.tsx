import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  AnimatePresence: ({ children }: any) => children,
}));

import { TextInputModal } from './TextInputModal';

describe('TextInputModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <TextInputModal isOpen={false} title="Test" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and input when open', () => {
    render(
      <TextInputModal isOpen={true} title="Enter Password" placeholder="Password" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Enter Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('renders confirm and cancel buttons', () => {
    render(
      <TextInputModal isOpen={true} title="Test" confirmLabel="Save" cancelLabel="Cancel" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onConfirm with value on submit', () => {
    const onConfirm = vi.fn();
    render(
      <TextInputModal isOpen={true} title="Test" onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'myvalue' } });
    fireEvent.click(screen.getByText('Save'));
    expect(onConfirm).toHaveBeenCalledWith('myvalue');
  });

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn();
    render(
      <TextInputModal isOpen={true} title="Test" onConfirm={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });
});
