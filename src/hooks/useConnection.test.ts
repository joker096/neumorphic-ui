import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn();
const mockOnStateChange = vi.fn(() => vi.fn());
const mockOnBlockedRegion = vi.fn(() => vi.fn());

class MockSignallingManager {
  constructor(urls: string[]) {}
  connect = mockConnect;
  disconnect = mockDisconnect;
  onStateChange = mockOnStateChange;
  onBlockedRegion = mockOnBlockedRegion;
}

vi.mock('../lib/signaling/manager', () => ({
  SignallingManager: MockSignallingManager,
}));

describe('useConnection', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should start in connecting state', async () => {
    const { useConnection } = await import('./useConnection');
    const { result } = renderHook(() => useConnection());
    expect(result.current.connectionStatus).toBe('connecting');
  });

  it('should not be region blocked initially', async () => {
    const { useConnection } = await import('./useConnection');
    const { result } = renderHook(() => useConnection());
    expect(result.current.regionBlocked).toBe(false);
  });

  it('should connect to signalling server on mount', async () => {
    const { useConnection } = await import('./useConnection');
    renderHook(() => useConnection());
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should disconnect on unmount', async () => {
    const { useConnection } = await import('./useConnection');
    const { unmount } = renderHook(() => useConnection());
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('should subscribe to state changes', async () => {
    const { useConnection } = await import('./useConnection');
    renderHook(() => useConnection());
    expect(mockOnStateChange).toHaveBeenCalled();
    expect(mockOnBlockedRegion).toHaveBeenCalled();
  });

  it('should clean up subscriptions on unmount', async () => {
    const unsub1 = vi.fn();
    const unsub2 = vi.fn();
    mockOnStateChange.mockReturnValue(unsub1);
    mockOnBlockedRegion.mockReturnValue(unsub2);

    const { useConnection } = await import('./useConnection');
    const { unmount } = renderHook(() => useConnection());
    unmount();

    expect(unsub1).toHaveBeenCalled();
    expect(unsub2).toHaveBeenCalled();
  });
});
