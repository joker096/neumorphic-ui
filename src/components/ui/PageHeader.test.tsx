import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader title="Settings" />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Settings" subtitle="Manage preferences" />);
    expect(screen.getByText('Manage preferences')).toBeInTheDocument();
  });

  it('renders back button when onBack provided', () => {
    render(<PageHeader title="Settings" onBack={() => {}} />);
    const backBtn = screen.getByRole('button');
    expect(backBtn).toBeInTheDocument();
  });

  it('fires onBack when back button is clicked', () => {
    const onBack = vi.fn();
    render(<PageHeader title="Settings" onBack={onBack} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('does not render back button when onBack is not provided', () => {
    render(<PageHeader title="Settings" />);
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBe(0);
  });

  it('renders right action slot', () => {
    render(
      <PageHeader
        title="Settings"
        right={<button data-testid="action-btn">Action</button>}
      />
    );
    expect(screen.getByTestId('action-btn')).toBeInTheDocument();
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders avatar when provided', () => {
    render(
      <PageHeader
        title="Profile"
        avatar={<svg data-testid="avatar-icon" />}
      />
    );
    expect(screen.getByTestId('avatar-icon')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    const { container } = render(
      <PageHeader title="Title" className="extra-class" />
    );
    const outer = container.firstElementChild;
    expect(outer?.className).toContain('extra-class');
  });
});
