import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { TransportIndicator } from './TransportIndicator';

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    lang: 'en',
    setLang: vi.fn(),
  }),
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
  I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}));

describe('TransportIndicator', () => {
  it('renders disconnected by default', () => {
    render(<TransportIndicator />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('renders connected status', () => {
    render(<TransportIndicator status="connected" />);
    expect(screen.getByText('Direct')).toBeInTheDocument();
  });

  it('renders connecting status', () => {
    render(<TransportIndicator status="connecting" />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders blocked status', () => {
    render(<TransportIndicator status="blocked" />);
    expect(screen.getByText('Degraded')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<TransportIndicator status="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});

describe('TransportIndicator tooltip legend', () => {
  it('shows the legend panel on hover and explains the current status', () => {
    render(<TransportIndicator status="connected" />);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('status'));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();

    expect(tooltip).toHaveTextContent('Current: ⚡ Direct');
    expect(tooltip).toHaveTextContent('All statuses');
  });

  it('hides the legend panel when the pointer leaves', () => {
    render(<TransportIndicator status="connecting" />);

    fireEvent.mouseEnter(screen.getByRole('status'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(screen.getByRole('status'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('documents every possible status in the legend', () => {
    render(<TransportIndicator status="disconnected" />);
    fireEvent.mouseEnter(screen.getByRole('status'));
    const tooltip = screen.getByRole('tooltip');

    expect(tooltip).toHaveTextContent('Direct');
    expect(tooltip).toHaveTextContent('Connecting...');
    expect(tooltip).toHaveTextContent('Degraded');
    expect(tooltip).toHaveTextContent('Offline');
    expect(tooltip).toHaveTextContent('Error');
  });

  it('carries a readable aria-label describing the current status', () => {
    render(<TransportIndicator status="blocked" />);
    expect(screen.getByLabelText('Connection: Degraded')).toBeInTheDocument();
  });
});
