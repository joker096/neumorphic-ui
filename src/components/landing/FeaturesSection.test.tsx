import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

vi.mock('motion/react', () => ({
  motion: { div: ({ children, ...rest }: any) => <div {...rest}>{children}</div>, h3: 'h3', p: 'p' },
}));

import { FeaturesSection } from './FeaturesSection';
import { I18nProvider } from '../../lib/i18n';
import enCatalog from '../../locales/en.json';

beforeEach(() => {
  localStorage.setItem('app_language', 'en');
  const cache = (globalThis as any).__i18nCache ?? ((globalThis as any).__i18nCache = new Map());
  cache.set('en', enCatalog);
});

const mockFeatures = [
  { title: 'E2EE', desc: 'End-to-end encrypted', icon: () => null },
  { title: 'Mesh', desc: 'Mesh networking', icon: () => null },
];

describe('FeaturesSection', () => {
  it('renders feature cards', () => {
    render(
      <I18nProvider>
        <FeaturesSection features={mockFeatures} />
      </I18nProvider>,
    );
    expect(screen.getByText('E2EE')).toBeInTheDocument();
    expect(screen.getByText('Mesh')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    render(
      <I18nProvider>
        <FeaturesSection features={mockFeatures} />
      </I18nProvider>,
    );
    expect(screen.getByText('End-to-end encrypted')).toBeInTheDocument();
    expect(screen.getByText('Mesh networking')).toBeInTheDocument();
  });

  it('renders empty when no features', () => {
    const { container } = render(
      <I18nProvider>
        <FeaturesSection features={[]} />
      </I18nProvider>,
    );
    const grid = container.firstChild;
    expect(grid?.childNodes.length).toBe(0);
  });
});
