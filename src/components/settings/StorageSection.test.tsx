import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({
  Trash2: 'div', Shield: 'div', ChevronLeft: 'div', ChevronRight: 'div',
  CloudOff: 'div', FileText: 'div', X: 'div',
}));
vi.mock('motion/react', () => ({
  motion: { div: 'div' },
  useReducedMotion: () => false,
  AnimatePresence: (props: { children?: React.ReactNode }) => props.children ?? null,
}));
vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key) }),
}));

import { StorageSection } from './StorageSection';

const t = (key: string, fallback?: string) => (typeof fallback === 'string' ? fallback : key);

const renderSection = (props: { isDark?: boolean; onBack?: () => void } = {}) =>
  render(<StorageSection isDark={props.isDark} onBack={props.onBack ?? vi.fn()} />);

describe('StorageSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header, sections and back button', () => {
    renderSection();
    expect(screen.getByRole('button', { name: t('common.back') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: t('settings.dataStorage') })).toBeInTheDocument();
    expect(screen.getByText(t('settings.storageSecuritySection', 'Storage'))).toBeInTheDocument();
  });

  it('shows encryption row with On value (non-interactive)', () => {
    renderSection();
    expect(screen.getByText(t('settings.localEncryption', 'Local encryption at rest'))).toBeInTheDocument();
    expect(screen.getByText(t('settings.enabled', 'On'))).toBeInTheDocument();
  });

  it('clear cache row does not throw without caches API', () => {
    renderSection();
    fireEvent.click(screen.getByRole('button', { name: /Clear cache/ }));
    expect(screen.getByRole('button', { name: t('common.confirm', 'Confirm') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear cache/ })).toBeInTheDocument();
  });

  it('calls onBack when back button clicked', () => {
    const onBack = vi.fn();
    renderSection({ onBack });
    fireEvent.click(screen.getByRole('button', { name: t('common.back') }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});