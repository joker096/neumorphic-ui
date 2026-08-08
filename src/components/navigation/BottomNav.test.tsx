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
  it('renders all nav items with accessible labels', () => {
    render(<BottomNav {...defaultProps} />);
    expect(screen.getByLabelText('nav.chats')).toBeInTheDocument();
    expect(screen.getByLabelText('nav.contacts')).toBeInTheDocument();
    expect(screen.getByLabelText('settings.company')).toBeInTheDocument();
    expect(screen.getByLabelText('nav.settings')).toBeInTheDocument();
  });

  it('hides company item when hideCompany is true', () => {
    render(<BottomNav {...defaultProps} hideCompany />);
    expect(screen.queryByLabelText('settings.company')).not.toBeInTheDocument();
    expect(screen.getByLabelText('nav.chats')).toBeInTheDocument();
    expect(screen.getByLabelText('nav.contacts')).toBeInTheDocument();
    expect(screen.getByLabelText('nav.settings')).toBeInTheDocument();
  });

  it('highlights the active item', () => {
    render(<BottomNav {...defaultProps} activeView="contacts" isDark={true} />);
    const chatBtn = screen.getByLabelText('nav.chats').closest('button');
    const contactsBtn = screen.getByLabelText('nav.contacts').closest('button');
    expect(chatBtn).toHaveClass('text-gray-500');
    expect(contactsBtn).toHaveClass('text-orange-400');
  });

  it('fires onNavigate when an item is clicked', () => {
    const onNavigate = vi.fn();
    render(<BottomNav {...defaultProps} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByLabelText('nav.settings'));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('shows an icon for each visible nav item', () => {
    const { container } = render(<BottomNav {...defaultProps} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(4);
  });

  it('renders company item by default', () => {
    render(<BottomNav {...defaultProps} />);
    expect(screen.getByLabelText('settings.company')).toBeInTheDocument();
  });

  it('shows badge when unreadCount > 0 for chats', () => {
    render(<BottomNav {...defaultProps} unreadCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});