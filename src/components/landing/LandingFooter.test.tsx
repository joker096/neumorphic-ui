import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('lucide-react', () => ({ Zap: 'div' }));

import { LandingFooter } from './LandingFooter';
import { I18nProvider } from '../../lib/i18n';
import enCatalog from '../../locales/en.json';

beforeEach(() => {
  localStorage.setItem('app_language', 'en');
  const cache = (globalThis as any).__i18nCache ?? ((globalThis as any).__i18nCache = new Map());
  cache.set('en', enCatalog);
});

describe('LandingFooter', () => {
  it('renders brand name', () => {
    render(
      <I18nProvider>
        <LandingFooter />
      </I18nProvider>,
    );
    expect(screen.getByText('Mess&Anger')).toBeInTheDocument();
  });

  it('renders copyright text', () => {
    render(
      <I18nProvider>
        <LandingFooter />
      </I18nProvider>,
    );
    expect(screen.getByText(/2026/)).toBeInTheDocument();
    expect(screen.getByText(/Open source/)).toBeInTheDocument();
  });
});
