import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomNav } from './BottomNav';

const defaultProps = {
  activeView: 'chats',
  unreadCount: 0,
  onNavigate: vi.fn(),
  t: (key: string) => key,
};

describe('BottomNav', () => {
  it('renders all nav items with labels', () => {
    render(<BottomNav {...defaultProps} />);
    expect(screen.getByText('nav.chats')).toBeInTheDocument();
    expect(screen.getByText('nav.calls')).toBeInTheDocument();
    expect(screen.getByText('nav.contacts')).toBeInTheDocument();
    expect(screen.getByText('settings.company')).toBeInTheDocument();
    expect(screen.getByText('nav.settings')).toBeInTheDocument();
  });

  it('highlights the active item', () => {
    render(<BottomNav {...defaultProps} activeView="calls" isDark={true} />);
    const chatBtn = screen.getByText('nav.chats').closest('button');
    const callsBtn = screen.getByText('nav.calls').closest('button');
    expect(chatBtn).toHaveClass('text-gray-500');
    expect(callsBtn).toHaveClass('text-orange-400');
  });

  it('fires onNavigate when an item is clicked', () => {
    const onNavigate = vi.fn();
    render(<BottomNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('nav.settings'));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('shows an icon for each nav item', () => {
    const { container } = render(<BottomNav {...defaultProps} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(5);
  });

  it('renders company item', () => {
    render(<BottomNav {...defaultProps} />);
    expect(screen.getByText('settings.company')).toBeInTheDocument();
  });

  it('shows badge when unreadCount > 0 for chats', () => {
    render(<BottomNav {...defaultProps} unreadCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
