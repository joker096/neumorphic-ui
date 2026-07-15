import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockGetErrorStats = vi.hoisted(() => vi.fn());
const mockClearErrorLog = vi.hoisted(() => vi.fn());

vi.mock('../lib/errorHandling', () => ({
  getErrorStats: (...args: any[]) => mockGetErrorStats(...args),
  clearErrorLog: (...args: any[]) => mockClearErrorLog(...args),
}));

describe('useHealthCheck', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetErrorStats.mockReset();
    mockClearErrorLog.mockReset();
    mockGetErrorStats.mockReturnValue({ critical: 0, major: 0, minor: 0, total: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return healthy when no errors', async () => {
    const { useHealthCheck } = await import('./useHealthCheck');
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe('healthy');
    expect(result.current.stats).toEqual({ critical: 0, major: 0, minor: 0, total: 0 });
  });

  it('should return degraded when there are critical errors under threshold', async () => {
    mockGetErrorStats.mockReturnValue({ critical: 2, major: 0, minor: 0, total: 2 });
    const { useHealthCheck } = await import('./useHealthCheck');
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe('degraded');
  });

  it('should return degraded when there are major errors under threshold', async () => {
    mockGetErrorStats.mockReturnValue({ critical: 0, major: 3, minor: 0, total: 3 });
    const { useHealthCheck } = await import('./useHealthCheck');
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe('degraded');
  });

  it('should return unhealthy when critical errors exceed threshold', async () => {
    mockGetErrorStats.mockReturnValue({ critical: 4, major: 0, minor: 0, total: 4 });
    const { useHealthCheck } = await import('./useHealthCheck');
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe('unhealthy');
  });

  it('should poll for updates every 15 seconds', async () => {
    mockGetErrorStats.mockClear();
    const { useHealthCheck } = await import('./useHealthCheck');
    renderHook(() => useHealthCheck());
    const callsAfterMount = mockGetErrorStats.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(0);

    act(() => { vi.advanceTimersByTime(15000); });
    const callsAfterInterval = mockGetErrorStats.mock.calls.length;
    expect(callsAfterInterval).toBeGreaterThan(callsAfterMount);
  });

  it('should clear errors and reset to healthy', async () => {
    mockGetErrorStats
      .mockReturnValueOnce({ critical: 4, major: 0, minor: 0, total: 4 })
      .mockReturnValueOnce({ critical: 0, major: 0, minor: 0, total: 0 })
      .mockReturnValueOnce({ critical: 0, major: 0, minor: 0, total: 0 });

    const { useHealthCheck } = await import('./useHealthCheck');
    const { result } = renderHook(() => useHealthCheck());
    expect(result.current.status).toBe('unhealthy');

    act(() => { result.current.clearErrors(); });
    expect(mockClearErrorLog).toHaveBeenCalled();
    expect(result.current.status).toBe('healthy');
  });
});
