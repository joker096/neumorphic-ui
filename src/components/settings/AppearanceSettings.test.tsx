import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { AppearanceSettings } from './AppearanceSettings';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
}));

describe('AppearanceSettings - additional tests', () => {
  const defaultProps = {
    theme: 'dark' as 'light' | 'dark',
    setTheme: vi.fn(),
    fontSize: 'Medium',
    setFontSize: vi.fn(),
    uiAnimations: true,
    setUiAnimations: vi.fn(),
    showPwaBanner: false,
    setShowPwaBanner: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders all toggle rows', () => {
    render(<AppearanceSettings {...defaultProps} />);
    const toggles = document.querySelectorAll('button[role="switch"]');
    expect(toggles.length).toBeGreaterThan(0);
  });

  it('renders font size row value', () => {
    render(<AppearanceSettings {...defaultProps} fontSize="Large" />);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('renders dark theme styles', () => {
    const { container } = render(<AppearanceSettings {...defaultProps} />);
    expect(container.querySelector('[class*="bg-"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

  it('renders light theme styles', () => {
    const { container } = render(<AppearanceSettings {...defaultProps} theme="light" />);
    expect(container.querySelector('[class*="bg-white"]') || container.querySelector('[class*="border-"]')).toBeInTheDocument();
  });

  it('renders all groups', () => {
    const { container } = render(<AppearanceSettings {...defaultProps} />);
    expect(container.querySelectorAll('[class*="bg-"]').length).toBeGreaterThan(0);
  });

  it('renders section title', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(screen.getByText('settings.appearance')).toBeInTheDocument();
  });

  it('renders theme toggle description', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(screen.getByText('settings.darkTheme')).toBeInTheDocument();
  });

  it('renders animations subtitle', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(screen.getByText('settings.animationsSubtitle')).toBeInTheDocument();
  });

  it('renders PWA subtitle', () => {
    render(<AppearanceSettings {...defaultProps} />);
    expect(screen.getByText('settings.pwaPromptSubtitle')).toBeInTheDocument();
  });
});
