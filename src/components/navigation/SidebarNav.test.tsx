import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SidebarNav } from './SidebarNav';

const t = (key: string) => key;

describe('SidebarNav', () => {
  it('renders all five primary menu items', () => {
    render(<SidebarNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'nav.chats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nav.contacts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nav.calls' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings.company' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nav.workplace' })).toBeInTheDocument();
  });

  it('marks the active view with aria-current="page"', () => {
    render(<SidebarNav activeView="contacts" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'nav.contacts' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'nav.chats' })).not.toHaveAttribute('aria-current');
  });

  it('navigates to the clicked menu item', () => {
    const onNavigate = vi.fn();
    render(<SidebarNav activeView="chats" unreadCount={0} onNavigate={onNavigate} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'nav.workplace' }));
    expect(onNavigate).toHaveBeenCalledWith('workplace');
  });

  it('hides company item when hideCompany is set', () => {
    render(<SidebarNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={t} hideCompany />);
    expect(screen.queryByRole('button', { name: 'settings.company' })).not.toBeInTheDocument();
  });

  it('shows unread badge on chats and company only', () => {
    render(<SidebarNav activeView="chats" unreadCount={7} companyUnreadCount={3} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('omits badges on non-badge items', () => {
    render(<SidebarNav activeView="chats" unreadCount={9} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'nav.contacts' })).not.toHaveTextContent('9');
  });
});