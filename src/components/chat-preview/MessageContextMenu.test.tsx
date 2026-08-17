import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageContextMenu } from './MessageContextMenu';

describe('MessageContextMenu', () => {
  const baseActions = [
    { key: 'reply', label: 'Reply', onClick: vi.fn() },
    { key: 'copy', label: 'Copy', onClick: vi.fn() },
    { key: 'delete', label: 'Delete', danger: true, onClick: vi.fn() },
  ];

  it('renders nothing when closed', () => {
    const { container } = render(<MessageContextMenu open={false} onClose={vi.fn()} actions={baseActions} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all actions when open', () => {
    render(<MessageContextMenu open={true} onClose={vi.fn()} actions={baseActions} />);
    expect(screen.getByText('Reply')).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('renders a title when provided', () => {
    render(<MessageContextMenu open={true} onClose={vi.fn()} title="Hello" actions={baseActions} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('fires the action and closes when an item is clicked', () => {
    const onClose = vi.fn();
    const onClick = vi.fn();
    render(
      <MessageContextMenu
        open={true}
        onClose={onClose}
        actions={[{ key: 'reply', label: 'Reply', onClick }]}
      />,
    );
    fireEvent.click(screen.getByText('Reply'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on cancel', () => {
    const onClose = vi.fn();
    render(<MessageContextMenu open={true} onClose={onClose} actions={baseActions} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click', () => {
    const onClose = vi.fn();
    const { container } = render(<MessageContextMenu open={true} onClose={onClose} actions={baseActions} />);
    const backdrop = container.querySelector('.fixed.inset-0 > div');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
