import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: 'div', h1: 'h1', p: 'p', span: 'span' },
}));

vi.mock('lucide-react', () => ({ ArrowRight: 'div' }));

import { HeroSection } from './HeroSection';
import { I18nProvider } from '../../lib/i18n';
import enCatalog from '../../locales/en.json';

beforeEach(() => {
  localStorage.setItem('app_language', 'en');
  const cache = (globalThis as any).__i18nCache ?? ((globalThis as any).__i18nCache = new Map());
  cache.set('en', enCatalog);
});

describe('HeroSection', () => {
  it('renders version badge', () => {
    render(
      <I18nProvider>
        <HeroSection onGetStarted={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByText(/1\.0/)).toBeInTheDocument();
  });

  it('renders headline', () => {
    render(
      <I18nProvider>
        <HeroSection onGetStarted={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Without Compromise')).toBeInTheDocument();
  });

  it('renders Open App button', () => {
    render(
      <I18nProvider>
        <HeroSection onGetStarted={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByText('Open App')).toBeInTheDocument();
  });

  it('renders Source Code link', () => {
    render(
      <I18nProvider>
        <HeroSection onGetStarted={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByText('Source Code')).toBeInTheDocument();
  });

  it('calls onGetStarted when button clicked', () => {
    const onGetStarted = vi.fn();
    render(
      <I18nProvider>
        <HeroSection onGetStarted={onGetStarted} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText('Open App'));
    expect(onGetStarted).toHaveBeenCalled();
  });
});
