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
    expect(screen.getByLabelText('nav.chats')).toBeInTheDocument();
    expect(screen.getByLabelText('nav.contacts')).toBeInTheDocument();
    expect(screen.getByLabelText('settings.company')).toBeInTheDocument();
    expect(screen.getByLabelText('nav.calls')).toBeInTheDocument();
  });

  it('highlights the current section', () => {
    render(<SidebarNav {...defaultProps} activeView="contacts" isDark={true} />);
    const contactsBtn = screen.getByLabelText('nav.contacts').closest('button');
    expect(contactsBtn).toHaveClass('text-[#6f7fff]');
    expect(contactsBtn?.className).toContain('from-[#6f7fff]/20');
  });

  it('shows icons for nav items', () => {
    const { container } = render(<SidebarNav {...defaultProps} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(4);
  });

  it('fires onNavigate when item clicked', () => {
    const onNavigate = vi.fn();
    render(<SidebarNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByLabelText('nav.calls'));
    expect(onNavigate).toHaveBeenCalledWith('calls');
  });

  it('shows unread badge on chats when unreadCount > 0', () => {
    render(<SidebarNav {...defaultProps} unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders company item', () => {
    render(<SidebarNav {...defaultProps} />);
    expect(screen.getByLabelText('settings.company')).toBeInTheDocument();
  });
});