import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePremiumEntitlementRefresh, PREMIUM_REFRESH_MIN_INTERVAL_MS } from './usePremiumEntitlementRefresh';
import { getDevicePublicKey, fetchEntitlement } from '../services/entitlements';
import { useAppStore } from '../store';

vi.mock('../services/entitlements', () => ({
  getDevicePublicKey: vi.fn().mockResolvedValue('test-device-pk'),
  fetchEntitlement: vi.fn().mockResolvedValue({ premium: false, plan: null, expiresAt: null }),
  bufToBase64: (bytes: Uint8Array) => Buffer.from(bytes).toString('base64'),
}));

const setDocumentHidden = (hidden: boolean) =>
  Object.defineProperty(document, 'hidden', { value: hidden, configurable: true });

describe('usePremiumEntitlementRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(getDevicePublicKey).mockClear();
    vi.mocked(fetchEntitlement).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    setDocumentHidden(false);
  });

  it('does not refetch immediately after mount (bootstrap fetch is recent)', () => {
    renderHook(() => usePremiumEntitlementRefresh());
    act(() => window.dispatchEvent(new Event('focus')));
    expect(fetchEntitlement).not.toHaveBeenCalled();
  });

  it('refreshes on window focus after the minimum interval', async () => {
    const t0 = Date.now();
    renderHook(() => usePremiumEntitlementRefresh());
    vi.setSystemTime(new Date(t0 + PREMIUM_REFRESH_MIN_INTERVAL_MS + 1));
    act(() => window.dispatchEvent(new Event('focus')));
    await vi.waitFor(() => expect(fetchEntitlement).toHaveBeenCalledTimes(1));
    expect(fetchEntitlement).toHaveBeenCalledWith('test-device-pk');
  });

  it('refreshes when the document becomes visible after the minimum interval', async () => {
    const t0 = Date.now();
    renderHook(() => usePremiumEntitlementRefresh());
    vi.setSystemTime(new Date(t0 + PREMIUM_REFRESH_MIN_INTERVAL_MS + 1));
    setDocumentHidden(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(fetchEntitlement).not.toHaveBeenCalled();
    setDocumentHidden(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await vi.waitFor(() => expect(fetchEntitlement).toHaveBeenCalledTimes(1));
  });

  it('does not refresh while the document is hidden', () => {
    const t0 = Date.now();
    renderHook(() => usePremiumEntitlementRefresh());
    vi.setSystemTime(new Date(t0 + PREMIUM_REFRESH_MIN_INTERVAL_MS + 1));
    setDocumentHidden(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(fetchEntitlement).not.toHaveBeenCalled();
  });

  it('re-fetches an expired entitlement immediately, ignoring the throttle', async () => {
    const t0 = Date.now();
    useAppStore.setState({
      premiumEntitlement: { premium: true, plan: 'premium', expiresAt: t0 - 1000 },
    });
    renderHook(() => usePremiumEntitlementRefresh());
    act(() => window.dispatchEvent(new Event('focus')));
    await vi.waitFor(() => expect(fetchEntitlement).toHaveBeenCalledTimes(1));
  });

  it('attaches and detaches lifecycle listeners', () => {
    const docAdd = vi.spyOn(document, 'addEventListener');
    const docRemove = vi.spyOn(document, 'removeEventListener');
    const winAdd = vi.spyOn(window, 'addEventListener');
    const winRemove = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => usePremiumEntitlementRefresh());
    expect(docAdd).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(winAdd).toHaveBeenCalledWith('focus', expect.any(Function));
    unmount();
    expect(docRemove).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(winRemove).toHaveBeenCalledWith('focus', expect.any(Function));
    docAdd.mockRestore();
    docRemove.mockRestore();
    winAdd.mockRestore();
    winRemove.mockRestore();
  });
});
