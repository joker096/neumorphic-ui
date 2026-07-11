import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarNav } from './SidebarNav';

const defaultProps = {
  activeView: 'chats',
  unreadCount: 0,
  onNavigate: vi.fn(),
  t: (key: string) => key,
};

describe('SidebarNav', () => {
  it('renders sidebar with nav items', () => {
    render(<SidebarNav {...defaultProps} />);
    expect(screen.getByText('nav.chats')).toBeInTheDocument();
    expect(screen.getByText('nav.calls')).toBeInTheDocument();
    expect(screen.getByText('nav.contacts')).toBeInTheDocument();
    expect(screen.getByText('settings.company')).toBeInTheDocument();
    expect(screen.getByText('nav.settings')).toBeInTheDocument();
  });

  it('highlights the current section', () => {
    render(<SidebarNav {...defaultProps} activeView="contacts" isDark={true} />);
    const contactsBtn = screen.getByText('nav.contacts').closest('button');
    expect(contactsBtn).toHaveClass('bg-orange-500/15');
    expect(contactsBtn).toHaveClass('text-orange-400');
  });

  it('shows icons and labels for nav items', () => {
    const { container } = render(<SidebarNav {...defaultProps} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(5);
  });

  it('fires onNavigate when item clicked', () => {
    const onNavigate = vi.fn();
    render(<SidebarNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('nav.settings'));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('shows unread badge on chats when unreadCount > 0', () => {
    render(<SidebarNav {...defaultProps} unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders company item', () => {
    render(<SidebarNav {...defaultProps} />);
    expect(screen.getByText('settings.company')).toBeInTheDocument();
  });
});
