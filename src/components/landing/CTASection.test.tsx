import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, h2: 'h2', p: 'p', span: 'span' },
}));

vi.mock('lucide-react', () => ({ ArrowRight: 'div' }));

import { CTASection } from './CTASection';
import { I18nProvider } from '../../lib/i18n';
import enCatalog from '../../locales/en.json';

beforeEach(() => {
  localStorage.setItem('app_language', 'en');
  const cache = (globalThis as any).__i18nCache ?? ((globalThis as any).__i18nCache = new Map());
  cache.set('en', enCatalog);
});

describe('CTASection', () => {
  it('renders heading and description', () => {
    render(
      <I18nProvider>
        <CTASection onGetStarted={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByText(/Ready to take control/)).toBeInTheDocument();
    expect(screen.getByText(/No signup required/)).toBeInTheDocument();
  });

  it('renders Get Started button', () => {
    render(
      <I18nProvider>
        <CTASection onGetStarted={vi.fn()} />
      </I18nProvider>,
    );
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('calls onGetStarted when button clicked', () => {
    const onGetStarted = vi.fn();
    render(
      <I18nProvider>
        <CTASection onGetStarted={onGetStarted} />
      </I18nProvider>,
    );
    fireEvent.click(screen.getByText('Get Started'));
    expect(onGetStarted).toHaveBeenCalled();
  });
});
