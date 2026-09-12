import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('renders nothing when isOpen is false', () => {
    render(
      <ConfirmModal isOpen={false} title="Test" confirmLabel="Confirm" cancelLabel="Cancel" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });

  it('renders title and buttons when open', () => {
    render(
      <ConfirmModal isOpen={true} title="Delete?" confirmLabel="Delete" cancelLabel="Keep" onConfirm={vi.fn()} onCancel={vi.fn()} variant="danger" />
    );
    expect(screen.getByText('Delete?')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('renders message with theme-safe text', () => {
    render(
      <ConfirmModal isOpen={true} title="Delete?" message="Are you sure?" confirmLabel="Delete" cancelLabel="Cancel" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Are you sure?')).toHaveClass('text-[var(--text-secondary)]');
  });
});
