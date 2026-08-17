import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MessageSelectionBar } from './MessageSelectionBar';

describe('MessageSelectionBar', () => {
  const base = {
    isDark: false,
    count: 3,
    onCancel: vi.fn(),
    onSelectAll: vi.fn(),
    onForward: vi.fn(),
    onDelete: vi.fn(),
  };

  it('renders the selected count', () => {
    render(<MessageSelectionBar {...base} />);
    expect(screen.getByText('3 chat.selected')).toBeInTheDocument();
  });

  it('fires the action handlers', () => {
    render(<MessageSelectionBar {...base} />);
    fireEvent.click(screen.getByLabelText('chat.cancel'));
    fireEvent.click(screen.getByText('chat.selectAll'));
    fireEvent.click(screen.getByText('chat.forward'));
    fireEvent.click(screen.getByText('chat.delete'));
    expect(base.onCancel).toHaveBeenCalled();
    expect(base.onSelectAll).toHaveBeenCalled();
    expect(base.onForward).toHaveBeenCalled();
    expect(base.onDelete).toHaveBeenCalled();
  });

  it('disables forward and delete when count is zero', () => {
    render(<MessageSelectionBar {...base} count={0} />);
    expect(screen.getByText('chat.forward')).toBeDisabled();
    expect(screen.getByText('chat.delete')).toBeDisabled();
  });
});
