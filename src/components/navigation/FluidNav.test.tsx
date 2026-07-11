import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FluidNav } from './FluidNav';

const items = [
  { id: 'chats', label: 'nav.chats' },
  { id: 'calls', label: 'nav.calls' },
  { id: 'settings', label: 'nav.settings' },
];

const defaultProps = {
  items,
  activeView: 'chats',
  onNavigate: vi.fn(),
  t: (key: string) => key,
};

describe('FluidNav', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders desktop nav items in the pill', () => {
    render(<FluidNav {...defaultProps} />);
    expect(screen.getByText('nav.chats')).toBeInTheDocument();
    expect(screen.getByText('nav.calls')).toBeInTheDocument();
    expect(screen.getByText('nav.settings')).toBeInTheDocument();
  });

  it('shows hamburger button', () => {
    render(<FluidNav {...defaultProps} />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('opens overlay when hamburger is clicked', () => {
    render(<FluidNav {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    expect(screen.getByText('Press Esc to close')).toBeInTheDocument();
  });

  it('closes overlay when Esc is pressed', () => {
    render(<FluidNav {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('navigates and calls onNavigate when item clicked', () => {
    const onNavigate = vi.fn();
    render(<FluidNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    fireEvent.click(screen.getAllByText('nav.settings')[1]);
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('locks body scroll when open and restores on close', () => {
    render(<FluidNav {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(document.body.style.overflow).toBe('hidden');
    fireEvent.click(screen.getByLabelText('Close menu'));
    expect(document.body.style.overflow).toBe('');
  });
});
