import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Edit: 'div', Share2: 'div', Phone: 'div', Mail: 'div', MessageSquare: 'div',
  Send: 'div', Shield: 'div', AtSign: 'div', Link: 'div',
}));

import { ProfileHeaderCard } from './ProfileHeaderCard';

const t = (key: string, fallback?: string | Record<string, string>) => {
  if (typeof fallback === 'string') return fallback;
  if (fallback) return '{name} profile picture'.replace(/\{name\}/g, fallback.name ?? '');
  return key;
};

const profile = {
  name: 'Alice Freeman',
  username: 'alice',
  bio: 'Engineer',
  status: 'Online',
  avatarColor: 'from-blue-400 to-indigo-500',
  fields: [
    { id: '1', type: 'phone', value: '+7 999 123-45-67', label: '', visibleTo: 'everyone' },
    { id: '2', type: 'email', value: 'alice@example.com', label: 'Work', visibleTo: 'contactsOnly' },
  ],
};

const renderCard = (overrides: Record<string, any> = {}) =>
  render(
    <ProfileHeaderCard
      isDark={false}
      userProfile={profile as any}
      t={t}
      onEdit={vi.fn()}
      onShare={vi.fn()}
      {...overrides}
    />,
  );

describe('ProfileHeaderCard', () => {
  it('renders name, username, bio and status', () => {
    renderCard();
    expect(screen.getByRole('heading', { name: 'Alice Freeman' })).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('falls back to @username in heading when name missing', () => {
    renderCard({ userProfile: { ...profile, name: '' } });
    expect(screen.getByRole('heading', { name: '@alice' })).toBeInTheDocument();
    expect(screen.queryByText('@alice')).toBeInTheDocument();
    expect(screen.queryAllByText('@alice')).toHaveLength(1);
  });

  it('falls back to default user name when both missing', () => {
    renderCard({ userProfile: { name: '', username: '' } });
    expect(screen.getByRole('heading', { name: 'User' })).toBeInTheDocument();
  });

  it('shows initial letter avatar when no avatar image', () => {
    const { container } = renderCard();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('shows avatar image in banner and circle when present', () => {
    const { container } = renderCard({
      userProfile: { ...profile, avatar: 'data:image/png;base64,aa' },
    });
    expect(container.querySelectorAll('img')).toHaveLength(2);
    expect(container.querySelector('img')).toHaveAttribute('alt', 'Alice Freeman profile picture');
  });

  it('renders fields with type labels and values', () => {
    const { container } = renderCard();
    const rows = container.querySelectorAll('.bg-\\[var\\(--bg-secondary\\)\\]');
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.getByText('+7 999 123-45-67')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
    expect(rows.length).toBeGreaterThan(0);
  });

  it('shows Contacts only badge for restricted fields', () => {
    renderCard();
    expect(screen.getByText('Contacts only')).toBeInTheDocument();
  });

  it('uses field label override for custom types', () => {
    renderCard({
      userProfile: { ...profile, fields: [{ id: '3', type: 'custom', value: 'X', label: 'Site', visibleTo: 'everyone' }] },
    });
    expect(screen.getByText('Site')).toBeInTheDocument();
    expect(screen.queryByText('Custom')).not.toBeInTheDocument();
  });

  it('localizes the Signal V2V type via settings.fieldTypeSignalV2V', () => {
    const keys: string[] = [];
    const spyT = (key: string, fallback?: string) => {
      keys.push(key);
      return typeof fallback === 'string' ? fallback : key;
    };
    renderCard({
      t: spyT,
      userProfile: { ...profile, fields: [{ id: '5', type: 'signalv2v', value: 'sig', label: '', visibleTo: 'everyone' }] },
    });
    expect(keys).toContain('settings.fieldTypeSignalV2V');
    expect(screen.getByText('Signal V2V')).toBeInTheDocument();
  });

  it('omits value span for empty field values', () => {
    renderCard({
      userProfile: { ...profile, fields: [{ id: '4', type: 'link', value: '', label: '', visibleTo: 'everyone' }] },
    });
    expect(screen.getByText('Link')).toBeInTheDocument();
  });

  it('edit button fires onEdit', () => {
    const onEdit = vi.fn();
    renderCard({ onEdit });
    fireEvent.click(screen.getByLabelText('Edit Profile'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('share button fires onShare', () => {
    const onShare = vi.fn();
    renderCard({ onShare });
    fireEvent.click(screen.getByLabelText('Share Identity'));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('uses dark styling class when isDark', () => {
    const { container } = renderCard({ isDark: true });
    expect(container.querySelector('.rounded-xl')!.className).toContain('bg-[var(--bg-tertiary)]');
  });
});