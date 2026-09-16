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
    expect(screen.getByLabelText('Connection: Offline')).toBeInTheDocument();
    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('renders connected status', () => {
    render(<TransportIndicator status="connected" />);
    expect(screen.getByLabelText('Connection: Direct')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('renders connecting status', () => {
    render(<TransportIndicator status="connecting" />);
    expect(screen.getByLabelText('Connection: Connecting...')).toBeInTheDocument();
    expect(screen.getByText('⟳')).toBeInTheDocument();
  });

  it('renders blocked status', () => {
    render(<TransportIndicator status="blocked" />);
    expect(screen.getByLabelText('Connection: Degraded')).toBeInTheDocument();
    expect(screen.getByText('⚠')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<TransportIndicator status="error" />);
    expect(screen.getByLabelText('Connection: Error')).toBeInTheDocument();
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows icon only — title label appears only inside the hover tooltip', () => {
    render(<TransportIndicator status="connected" />);
    expect(screen.queryByText('Direct')).not.toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('status'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Direct');
  });
it('renders the relay variant when connected through a relay', () => {
    render(<TransportIndicator status="connected" relayed />);
    expect(screen.getByLabelText('Connection: Relay')).toBeInTheDocument();
    expect(screen.getByText('🔁')).toBeInTheDocument();

    fireEvent.mouseEnter(screen.getByRole('status'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Current: 🔁 Relay');
  });

  it('keeps the direct variant when connected without a relay', () => {
    render(<TransportIndicator status="connected" relayed={false} />);
    expect(screen.getByLabelText('Connection: Direct')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('does not treat connecting as relayed', () => {
    render(<TransportIndicator status="connecting" relayed />);
    expect(screen.getByLabelText('Connection: Connecting...')).toBeInTheDocument();
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

describe('TransportIndicator error detail', () => {
  it('shows the server-provided detail in the tooltip for blocked', () => {
    render(<TransportIndicator status="blocked" detail="Too many connections" />);
    fireEvent.mouseEnter(screen.getByRole('status'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Too many connections');
  });

  it('shows the server-provided detail in the tooltip for error', () => {
    render(<TransportIndicator status="error" detail="Origin not allowed" />);
    fireEvent.mouseEnter(screen.getByRole('status'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Origin not allowed');
  });

  it('does not render a stale detail when connected', () => {
    render(<TransportIndicator status="connected" detail="Too many connections" />);
    fireEvent.mouseEnter(screen.getByRole('status'));
    expect(screen.getByRole('tooltip')).not.toHaveTextContent('Too many connections');
  });

  it('omits the detail section when no detail is provided', () => {
    render(<TransportIndicator status="blocked" />);
    fireEvent.mouseEnter(screen.getByRole('status'));
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip.textContent).not.toMatch(/Closed by server/i);
  });
});
