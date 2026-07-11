import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<EmptyState title="Empty" subtitle="Add something to get started" />);
    expect(screen.getByText('Add something to get started')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByText('Add something')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const TestIcon = ({ className }: { className?: string; size?: number }) => (
      <svg data-testid="test-icon" className={className} />
    );
    render(<EmptyState title="Empty" icon={TestIcon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders action button and fires onClick', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        action={<button onClick={onClick}>Add Item</button>}
      />
    );
    const btn = screen.getByText('Add Item');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not render action wrapper when no action provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const actionDivs = container.querySelectorAll('.mt-4');
    expect(actionDivs.length).toBe(0);
  });
});
