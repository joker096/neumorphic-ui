import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const storeState = {
  setConnectionStatus: vi.fn(),
  setTransportBackend: vi.fn(),
  setLatency: vi.fn(),
  setBlockedBackends: vi.fn(),
  setRegionBlocked: vi.fn(),
  relayBackend: 'direct' as const,
  autoReconnect: true,
};

const mockUseAppStore = vi.fn((selector?: (state: typeof storeState) => any) => {
  if (typeof selector === 'function') {
    return selector(storeState);
  }
  return storeState;
});

vi.mock('../store', () => ({
  useAppStore: mockUseAppStore,
}));

vi.mock('../config/signalling', () => ({
  SIGNALING_SEED_URLS: ['wss://test/ws'],
}));

const mockConnect = vi.fn().mockResolvedValue(undefined);
const mockDisconnect = vi.fn();
const mockOnStateChange = vi.fn(() => vi.fn());
const mockOnBlockedRegion = vi.fn(() => vi.fn());
const mockGetBackend = vi.fn(() => 'relay');
const mockGetLatency = vi.fn(() => 15);

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

describe('useConnectionSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should start in connecting state and sync to store', async () => {
    const { useConnectionSetup } = await import('./useConnectionSetup');
    const { result } = renderHook(() => useConnectionSetup());

    expect(result.current.connectionStatus).toBe('connecting');
    expect(storeState.setConnectionStatus).toHaveBeenCalledWith('connecting');
  });

  it('should create SignallingManager and connect', async () => {
    const { useConnectionSetup } = await import('./useConnectionSetup');
    renderHook(() => useConnectionSetup());
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should disconnect and clean up on unmount', async () => {
    const unsub1 = vi.fn();
    const unsub2 = vi.fn();
    mockOnStateChange.mockReturnValue(unsub1);
    mockOnBlockedRegion.mockReturnValue(unsub2);

    const { useConnectionSetup } = await import('./useConnectionSetup');
    const { unmount } = renderHook(() => useConnectionSetup());
    unmount();

    expect(mockDisconnect).toHaveBeenCalled();
    expect(unsub1).toHaveBeenCalled();
    expect(unsub2).toHaveBeenCalled();
  });

  it('should handle blocked region events', async () => {
    const { useConnectionSetup } = await import('./useConnectionSetup');
    renderHook(() => useConnectionSetup());

    const blockedCb = (mockOnBlockedRegion.mock.calls as any[][])[0][0];
    act(() => { blockedCb({ region: 'XX' }); });

    expect(storeState.setRegionBlocked).toHaveBeenCalledWith(true);
  });

  it('should read saved backend from store', async () => {
    storeState.relayBackend = 'relay' as any;
    const { useConnectionSetup } = await import('./useConnectionSetup');
    renderHook(() => useConnectionSetup());
    expect(storeState.relayBackend).toBe('relay');
  });
});
