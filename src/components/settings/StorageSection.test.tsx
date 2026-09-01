import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  HardDrive: 'div', Download: 'div', Database: 'div', Trash2: 'div', MessageSquare: 'div',
  Shield: 'div', ChevronLeft: 'div', ChevronRight: 'div',
}));
vi.mock('motion/react', () => ({ motion: { div: 'div' } }));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

const h = vi.hoisted(() => ({
  mediaAutoLoad: 'wifi' as string,
  draftsEnabled: true as boolean,
  offlineMode: true as boolean,
  setMediaAutoLoad: vi.fn(),
  setDraftsEnabled: vi.fn(),
  setOfflineMode: vi.fn(),
}));

vi.mock('../../store', () => ({
  useAppStore: (selector?: any) =>
    selector ? selector({
      mediaAutoLoad: h.mediaAutoLoad,
      setMediaAutoLoad: h.setMediaAutoLoad,
      draftsEnabled: h.draftsEnabled,
      setDraftsEnabled: h.setDraftsEnabled,
      offlineMode: h.offlineMode,
      setOfflineMode: h.setOfflineMode,
    }) : {},
}));

import { StorageSection } from './StorageSection';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<StorageSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('StorageSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    h.mediaAutoLoad = 'wifi';
    h.draftsEnabled = true;
    h.offlineMode = true;
  });

  it('renders header, sections and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.dataStorage') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.storageMediaSection', 'Media'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.storageSecuritySection', 'Storage'))).toBeInTheDocument();
  });

  it('shows current auto-load value and cycles to always', () => {
    renderSection();
    const row = screen.getByText(t('settings.mediaAutoLoad', 'Auto-load media'));
    expect(screen.getByText('wifi')).toBeInTheDocument();
    fireEvent.click(row);
    expect(h.setMediaAutoLoad).toHaveBeenCalledWith('always');
  });

  it('cycles auto-load never -> wifi', () => {
    h.mediaAutoLoad = 'never';
    renderSection();
    fireEvent.click(screen.getByText(t('settings.mediaAutoLoad', 'Auto-load media')));
    expect(h.setMediaAutoLoad).toHaveBeenCalledWith('wifi');
  });

  it('cycles auto-load always -> never', () => {
    h.mediaAutoLoad = 'always';
    renderSection();
    fireEvent.click(screen.getByText(t('settings.mediaAutoLoad', 'Auto-load media')));
    expect(h.setMediaAutoLoad).toHaveBeenCalledWith('never');
  });

  it('shows encryption row with On value (non-interactive)', () => {
    renderSection();
    expect(screen.getByText(t('settings.localEncryption', 'Local encryption at rest'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.enabled', 'On'))).toBeInTheDocument();
  });

  it('toggles message drafts', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.draftsSaved', 'Message drafts') });
    fireEvent.click(sw);
    expect(h.setDraftsEnabled).toHaveBeenCalledWith(false);
  });

  it('toggles offline mode', () => {
    renderSection();
    const sw = screen.getByRole('switch', { name: t('settings.feedCacheSize', 'Offline mode (PWA)') });
    fireEvent.click(sw);
    expect(h.setOfflineMode).toHaveBeenCalledWith(false);
  });

  it('clear cache row does not throw without caches API', () => {
    renderSection();
    fireEvent.click(screen.getByText(t('settings.clearCache', 'Clear cache')));
    expect(screen.getByText(t('settings.clearCache', 'Clear cache'))).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});