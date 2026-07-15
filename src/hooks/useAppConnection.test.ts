import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn();
const mockOnStateChange = vi.fn(() => vi.fn());
const mockOnBlockedRegion = vi.fn(() => vi.fn());
const mockGetBackend = vi.fn(() => 'direct');
const mockGetLatency = vi.fn(() => 42);

vi.mock('../store', () => ({
  useAppStore: {
    getState: () => ({
      setConnectionStatus: vi.fn(),
      setTransportBackend: vi.fn(),
      setLatency: vi.fn(),
      setRegionBlocked: vi.fn(),
    }),
    setState: vi.fn(),
    subscribe: vi.fn(),
  },
}));

vi.mock('../config/signalling', () => ({
  SIGNALING_SEED_URLS: ['wss://test/ws'],
}));

class MockSignallingManager {
  constructor(urls: string[], backend?: string) {}
  connect = mockConnect;
  disconnect = mockDisconnect;
  onStateChange = mockOnStateChange;
  onBlockedRegion = mockOnBlockedRegion;
  getBackend = mockGetBackend;
  getLatency = mockGetLatency;
}

vi.mock('../lib/signaling/manager', () => ({
  SignallingManager: MockSignallingManager,
}));

describe('useAppConnection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set connecting status on mount', async () => {
    const { useAppConnection } = await import('./useAppConnection');
    const { result } = renderHook(() => useAppConnection());
    expect(result.current.connectionStatus).toBe('connecting');
  });

  it('should create a SignallingManager on mount', async () => {
    const { useAppConnection } = await import('./useAppConnection');
    renderHook(() => useAppConnection());
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should disconnect on unmount', async () => {
    const { useAppConnection } = await import('./useAppConnection');
    const { unmount } = renderHook(() => useAppConnection());
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should subscribe to state changes', async () => {
    const { useAppConnection } = await import('./useAppConnection');
    renderHook(() => useAppConnection());
    expect(mockOnStateChange).toHaveBeenCalled();
    expect(mockOnBlockedRegion).toHaveBeenCalled();
  });
});
