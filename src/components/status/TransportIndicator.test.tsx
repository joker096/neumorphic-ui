import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { TransportIndicator } from './TransportIndicator';

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
