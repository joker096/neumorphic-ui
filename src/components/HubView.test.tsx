import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { HubView } from './HubView';

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    updateSettings: vi.fn(),
  })),
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

vi.mock('../lib/crypto/cryptoCore', () => ({
  cryptoCore: {},
}));

describe('HubView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders placeholder text', () => {
    render(<HubView />);
    expect(screen.getByText('hub.placeholder')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<HubView />);
    expect(container.querySelector('.flex-1')).toBeInTheDocument();
  });
});
