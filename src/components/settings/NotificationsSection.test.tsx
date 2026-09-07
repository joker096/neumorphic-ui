import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const storeState = vi.hoisted(() => ({
  chats: [{ id: 1, name: 'Duplicate Chat' }, { id: 10, name: 'Chat A' }],
}));

vi.mock('lucide-react', () => ({
  Bell: 'div', BellOff: 'div', MessageCircle: 'div', Users: 'div', Megaphone: 'div', AtSign: 'div',
  Volume2: 'div', Eye: 'div', Moon: 'div', Timer: 'div', Music: 'div', ChevronLeft: 'div', ChevronRight: 'div',
  X: 'div', Plus: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));
vi.mock('../../store', () => ({
  useAppStore: (selector?: (s: any) => unknown) => (selector ? selector(storeState) : storeState),
}));
vi.mock('../ui/Toast', () => ({ toast: vi.fn() }));

import { NotificationsSection } from './NotificationsSection';
import { toast } from '../ui/Toast';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<NotificationsSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('NotificationsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.chats = [{ id: 1, name: 'Duplicate Chat' }, { id: 10, name: 'Chat A' }];
  });

  it('renders header, sections and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.notifications', 'Notifications') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.notifyScope', 'Notify me about'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.notifyBehavior', 'Behavior'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.badgeBehavior', 'Badge counter'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.quietHours', 'Quiet hours'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.exceptions', 'Exceptions'))).toBeInTheDocument();
  });

  it('renders seven switches with correct initial states', () => {
    renderSection();
    expect(screen.getByRole('switch', { name: t('settings.privateChats', 'Private chats') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: t('settings.groups', 'Groups') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: t('settings.channels', 'Channels') })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('switch', { name: t('settings.mentions', 'Mentions & replies') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: t('settings.inAppSound', 'In-app sound') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: t('settings.messagePreview', 'Message preview') })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: t('settings.customTone', 'Custom notification tone') })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getAllByRole('switch')).toHaveLength(8); // + quiet hours
  });

  it('toggles private chats switch', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.privateChats', 'Private chats') });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles groups channel switch without toggling row twice', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.groups', 'Groups') });
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('loose toggle (Groups) has 44px tap target (§2.2)', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.groups', 'Groups') });
    expect(sw.className).toContain('min-h-11');
  });

  it('selects badge mode', () => {
    renderSection();
    const allBtn = screen.getByText('All unread').closest('button')!;
    expect(allBtn.querySelector('[class*="border-[var(--accent)]"]')).not.toBeNull(); // default selected
    const hiddenBtn = screen.getByText('Hidden').closest('button')!;
    expect(hiddenBtn.querySelector('[class*="border-[var(--accent)]"]')).toBeNull();
    fireEvent.click(hiddenBtn);
    expect(hiddenBtn.querySelector('[class*="border-[var(--accent)]"]')).not.toBeNull();
    expect(hiddenBtn.querySelector('[class*="bg-[var(--accent)]"]')).not.toBeNull();
    expect(allBtn.querySelector('[class*="border-[var(--accent)]"]')).toBeNull(); // moved
  });

  it('shows all four badge modes', () => {
    renderSection();
    expect(screen.getByText('All unread')).toBeInTheDocument();
    expect(screen.getByText('Mentions only')).toBeInTheDocument();
    expect(screen.getByText('Unmuted chats')).toBeInTheDocument();
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });

  it('quiet hours hidden by default, appears when enabled', () => {
    renderSection();
    expect(screen.queryByLabelText(t('settings.quietFrom', 'Quiet from'))).not.toBeInTheDocument();
    const sw = screen.getByRole('switch', { name: t('settings.quietHoursTitle', 'Enable quiet hours') });
    fireEvent.click(sw);
    expect(screen.getByLabelText(t('settings.quietFrom', 'Quiet from'))).toHaveValue('22:00');
    expect(screen.getByLabelText(t('settings.quietTo', 'Quiet to'))).toHaveValue('08:00');
    expect(toast).toHaveBeenCalledWith(t('settings.saved', 'Saved'), 'success');
  });

  it('updates quiet hours times', () => {
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: t('settings.quietHoursTitle', 'Enable quiet hours') }));
    fireEvent.change(screen.getByLabelText(t('settings.quietFrom', 'Quiet from')), { target: { value: '23:30' } });
    expect(screen.getByLabelText(t('settings.quietFrom', 'Quiet from'))).toHaveValue('23:30');
  });

  it('renders default exceptions with muted state labels', () => {
    renderSection();
    expect(screen.getByText('Work Group')).toBeInTheDocument();
    expect(screen.getByText('Mom')).toBeInTheDocument();
    expect(screen.getByLabelText(t('settings.allowed', 'Allowed'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('settings.muted', 'Muted'))).toBeInTheDocument();
  });

  it('toggles exception state and toasts saved', () => {
    renderSection();
    const workBtn = screen.getByLabelText(t('settings.allowed', 'Allowed'));
    fireEvent.click(workBtn);
    expect(screen.getAllByLabelText(t('settings.muted', 'Muted'))).toHaveLength(2); // Work Group + Mom
    expect(screen.queryAllByLabelText(t('settings.allowed', 'Allowed'))).toHaveLength(0);
    expect(toast).toHaveBeenCalledWith(t('settings.saved', 'Saved'), 'success');
  });

  it('adds exception chat via chat picker', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.addException', 'Add exception')));
    expect(screen.getByRole('heading', { name: t('settings.pickExceptionChat', 'Add exception') })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Chat A'));
    expect(screen.queryByRole('heading', { name: t('settings.pickExceptionChat', 'Add exception') })).not.toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith(t('settings.added', 'Added'), 'success');
  });

  it('toasts info when selected chat is already an exception', () => {
    renderSection();
    fireEvent.click(screen.getByLabelText(t('settings.addException', 'Add exception')));
    fireEvent.click(screen.getByText('Duplicate Chat'));
    expect(screen.queryByRole('heading', { name: t('settings.pickExceptionChat', 'Add exception') })).not.toBeInTheDocument();
    expect(toast).toHaveBeenCalledWith(t('settings.addedException', 'Already in exceptions'), 'info');
    expect(toast).not.toHaveBeenCalledWith(t('settings.added', 'Added'), 'success');
  });

  it('hides tone picker until custom tone is enabled', () => {
    renderSection();
    expect(screen.queryByLabelText(t('settings.soundIncomingChat', 'New message'))).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: t('settings.customTone', 'Custom notification tone') }));
    expect(screen.getByLabelText(t('settings.soundIncomingChat', 'New message'))).toBeInTheDocument();
    expect(screen.getByLabelText(t('settings.soundBirthday', 'Birthday'))).toBeInTheDocument();
    expect(screen.getAllByLabelText(t('settings.previewSound', 'Play sound'))).toHaveLength(6);
  });

  it('selects a tone and toasts saved', () => {
    renderSection();
    fireEvent.click(screen.getByRole('switch', { name: t('settings.customTone', 'Custom notification tone') }));
    const defaultTone = screen.getByLabelText(t('settings.soundIncomingChat', 'New message'));
    const birthdayTone = screen.getByLabelText(t('settings.soundBirthday', 'Birthday'));
    expect(defaultTone.querySelector('[class*="bg-[var(--accent)]"]')).not.toBeNull();
    fireEvent.click(birthdayTone);
    expect(birthdayTone.querySelector('[class*="bg-[var(--accent)]"]')).not.toBeNull();
    expect(defaultTone.querySelector('[class*="bg-[var(--accent)]"]')).toBeNull();
    expect(toast).toHaveBeenCalledWith(t('settings.saved', 'Saved'), 'success');
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});