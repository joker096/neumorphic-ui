import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', h2: 'h2', p: 'p' },
  AnimatePresence: ({ children }: any) => children,
}));

import { I18nProvider } from '../../lib/i18n';
import enCatalog from '../../locales/en.json';

beforeEach(() => {
  localStorage.setItem('app_language', 'en');
  const cache = (globalThis as any).__i18nCache ?? ((globalThis as any).__i18nCache = new Map());
  cache.set('en', enCatalog);
});

import { LandingPage } from './LandingPage';

const renderLanding = (props: { onGetStarted: () => void }) =>
  render(
    <I18nProvider>
      <LandingPage {...props} />
    </I18nProvider>,
  );

describe('LandingPage', () => {
  it('renders HeroSection CTA button', () => {
    renderLanding({ onGetStarted: vi.fn() });
    expect(screen.getByText('Open App')).toBeInTheDocument();
  });

  it('renders Features section title', () => {
    renderLanding({ onGetStarted: vi.fn() });
    expect(screen.getByText(/private communication/)).toBeInTheDocument();
  });

  it('renders Security section', () => {
    renderLanding({ onGetStarted: vi.fn() });
    expect(screen.getByText('Security')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    renderLanding({ onGetStarted: vi.fn() });
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onGetStarted when Open App clicked', () => {
    const onGetStarted = vi.fn();
    renderLanding({ onGetStarted });
    fireEvent.click(screen.getByText('Open App'));
    expect(onGetStarted).toHaveBeenCalled();
  });
});
