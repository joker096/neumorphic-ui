import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionSettings } from './ConnectionSettings';

// Mock the store
vi.mock('../../store', () => ({
  useAppStore: () => ({
    connectionStatus: 'disconnected',
    transportBackend: 'direct',
    latencyMs: 0,
    blockedBackends: [],
    regionBlocked: false,
  }),
}));

describe('ConnectionSettings', () => {
  it('should render transport mode selector', () => {
    render(<ConnectionSettings />);
    expect(screen.getByText('Transport Mode')).toBeDefined();
  });
});
