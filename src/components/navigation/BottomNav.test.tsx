import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

let currentMembers: any[] = [];
let currentProfile: any = { name: 'Test User', username: 'tester', avatar: '' };
let currentBackend: string | undefined = 'direct';

vi.mock('../../store', () => ({
  useAppStore: (selector: any) => selector?.({
    companyMembers: currentMembers,
    userProfile: currentProfile,
    transportBackend: currentBackend,
  }),
}));

vi.mock('../status/TransportIndicator', () => ({
  TransportIndicator: ({ status, relayed }: { status?: string; relayed?: boolean }) => (
    <div data-testid="transport-indicator">{`${status ?? ''}${relayed ? ':relayed' : ''}`}</div>
  ),
}));

import { BottomNav } from './BottomNav';

const t = (key: string) => key;

describe('BottomNav', () => {
  beforeEach(() => {
    currentMembers = [{ userId: 'current', role: 'admin' }];
    currentProfile = { id: 'current', name: 'Test User', username: 'tester', avatar: '' };
    currentBackend = 'direct';
  });

  it('renders all five primary menu items', () => {
    render(<BottomNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'nav.chats' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nav.contacts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nav.calls' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'settings.company' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'nav.workplace' })).toBeInTheDocument();
  });

  it('marks the active view with aria-current="page"', () => {
    render(<BottomNav activeView="calls" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'nav.calls' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'nav.chats' })).not.toHaveAttribute('aria-current');
  });

  it('navigates to the clicked menu item', () => {
    const onNavigate = vi.fn();
    render(<BottomNav activeView="chats" unreadCount={0} onNavigate={onNavigate} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'nav.contacts' }));
    expect(onNavigate).toHaveBeenCalledWith('contacts');
  });

  it('hides company item when hideCompany is set', () => {
    render(<BottomNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={t} hideCompany />);
    expect(screen.queryByRole('button', { name: 'settings.company' })).not.toBeInTheDocument();
  });

  it('hides admin-only workplace for non-admin users', () => {
    currentMembers = [{ userId: 'u1', role: 'member' }];
    render(<BottomNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.queryByRole('button', { name: 'nav.workplace' })).not.toBeInTheDocument();
  });

  it('shows admin-only workplace for admins', () => {
    render(<BottomNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'nav.workplace' })).toBeInTheDocument();
  });

  it('shows unread badge on chats and company only', () => {
    render(<BottomNav activeView="chats" unreadCount={7} companyUnreadCount={3} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('omits badges on non-badge items', () => {
    render(<BottomNav activeView="chats" unreadCount={9} onNavigate={vi.fn()} t={t} />);
    const contactsButton = screen.getByRole('button', { name: 'nav.contacts' });
    expect(contactsButton).not.toHaveTextContent('9');
  });

  it('navigates to settings from the profile button', () => {
    const onNavigate = vi.fn();
    render(<BottomNav activeView="chats" unreadCount={0} onNavigate={onNavigate} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'Test User' }));
    expect(onNavigate).toHaveBeenCalledWith('settings');
  });

  it('marks settings active on the profile button', () => {
    render(<BottomNav activeView="settings" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: 'Test User' })).toHaveAttribute('aria-current', 'page');
  });

  it('falls back to username or default label for profile button', () => {
    currentProfile = { name: '', username: 'boss', avatar: '' };
    const { rerender } = render(<BottomNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByRole('button', { name: '@boss' })).toBeInTheDocument();
    currentProfile = { name: '', username: '', avatar: '' };
    rerender(<BottomNav activeView="chats" unreadCount={0} onNavigate={vi.fn()} t={(k) => (k === 'settings.defaultUserName' ? 'Anonymous' : k)} />);
    expect(screen.getByRole('button', { name: 'Anonymous' })).toBeInTheDocument();
  });

  it('renders the connection indicator with the passed status', () => {
    render(<BottomNav activeView="chats" connectionStatus="connected" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByTestId('transport-indicator')).toHaveTextContent('connected');
  });

  it('marks the indicator relayed when transport backend is not direct', () => {
    currentBackend = 'domainfront';
    render(<BottomNav activeView="chats" connectionStatus="connected" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByTestId('transport-indicator')).toHaveTextContent(':relayed');
  });

  it('keeps the indicator non-relayed for direct transport', () => {
    render(<BottomNav activeView="chats" connectionStatus="connected" unreadCount={0} onNavigate={vi.fn()} t={t} />);
    expect(screen.getByTestId('transport-indicator')).not.toHaveTextContent('relayed');
  });
});