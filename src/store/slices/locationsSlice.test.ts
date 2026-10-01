import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLocationSlice } from './locationsSlice';
import { blurCoordinate, clampLiveDurationMs, LIVE_LOCATION_MAX_MS, LIVE_LOCATION_MIN_MS } from '../../constants/liveLocation';

/** Minimal geolocation double: lets a test drive positions and watch lifecycle. */
const installGeolocation = () => {
  const clearWatch = vi.fn();
  const watchPosition = vi.fn();
  const getCurrentPosition = vi.fn();
  (globalThis as any).navigator.geolocation = { clearWatch, watchPosition, getCurrentPosition };
  return { clearWatch, watchPosition, getCurrentPosition };
};

const makeSlice = (overrides: Record<string, any> = {}) => {
  let state: any = { userProfile: { id: 'u1', name: 'Ann' }, liveShare: null, ...overrides };
  const set = (patch: any) => {
    state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  };
  const slice = createLocationSlice(set, () => state) as any;
  return { slice, get: () => state };
};

const coord = (lat: number, lng: number) => ({ coords: { latitude: lat, longitude: lng, accuracy: 5 } });

describe('clampLiveDurationMs', () => {
  it('clamps to the window and rejects non-finite input', () => {
    expect(clampLiveDurationMs(10)).toBe(LIVE_LOCATION_MIN_MS);
    expect(clampLiveDurationMs(99 * 60 * 60 * 1000)).toBe(LIVE_LOCATION_MAX_MS);
    expect(clampLiveDurationMs(60_000)).toBe(LIVE_LOCATION_MIN_MS);
    expect(clampLiveDurationMs(NaN)).toBe(3_600_000);
    expect(clampLiveDurationMs(Infinity)).toBe(LIVE_LOCATION_MAX_MS);
  });
});

describe('blurCoordinate', () => {
  it('snaps to ~100m and stays finite at the pole', () => {
    const near = blurCoordinate(52.5200, 13.4050);
    expect(Math.abs(near.latitude - 52.5200)).toBeLessThan(0.001);
    expect(Math.abs(near.longitude - 13.4050)).toBeLessThan(0.001);
    const pole = blurCoordinate(90, 0);
    expect(Number.isFinite(pole.longitude)).toBe(true);
  });
});

describe('locationsSlice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports the real user identity, not a hardcoded placeholder', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    const { slice, get } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', onUpdate: vi.fn() });
    expect(get().liveShare.userId).toBe('u1');
    expect(get().liveShare.senderName).toBe('Ann');
  });

  it('surfaces a geolocation error instead of silently doing nothing', () => {
    const geo = installGeolocation();
    const onError = vi.fn();
    geo.getCurrentPosition.mockImplementation((_ok: any, err: any) => err({ code: 1 }));
    const { slice, get } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', onUpdate: vi.fn(), onError });
    expect(onError).toHaveBeenCalled();
    expect(get().liveShare).toBeNull();
  });

  // The original bug: stopLiveLocation flipped `isLive` but never released the
  // watch, so the GPS kept streaming until the timeout fired.
  it('releases the GPS when sharing is stopped', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    geo.watchPosition.mockReturnValue(77);
    const { slice, get } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', onUpdate: vi.fn() });
    expect(get().liveShare.isLive).toBe(true);

    slice.stopLiveLocation();

    expect(geo.clearWatch).toHaveBeenCalledWith(77);
    expect(get().liveShare.isLive).toBe(false);
  });

  it('never emits a position past the expiry window', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    let push: any;
    geo.watchPosition.mockImplementation((cb: any) => {
      push = cb;
      return 77;
    });
    const onUpdate = vi.fn();
    const onEnd = vi.fn();
    const { slice, get } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', durationMs: 60_000, onUpdate, onEnd });

    // A position that arrives after the window must not extend the share.
    vi.advanceTimersByTime(60_001);
    push(coord(11, 21));

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(get().liveShare.isLive).toBe(false);
  });

  it('ends the share when the window elapses and releases the watch', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    geo.watchPosition.mockReturnValue(77);
    const onEnd = vi.fn();
    const { slice, get } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', durationMs: 60_000, onUpdate: vi.fn(), onEnd });

    vi.advanceTimersByTime(60_000);

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(geo.clearWatch).toHaveBeenCalledWith(77);
    expect(get().liveShare.isLive).toBe(false);
  });

  it('replaces a running share instead of orphaning its watch', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    geo.watchPosition.mockReturnValue(77);
    const { slice, get } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', onUpdate: vi.fn() });
    slice.startLiveLocation({ chatId: 'c2', onUpdate: vi.fn() });

    expect(geo.clearWatch).toHaveBeenCalledWith(77);
    expect(get().liveShare.chatId).toBe('c2');
  });

  it('is safe to stop when nothing is being shared', () => {
    installGeolocation();
    const { slice } = makeSlice();
    expect(() => slice.stopLiveLocation()).not.toThrow();
  });

  // A manual stop used to tear down the GPS without ever calling onEnd, so the
  // peer's bubble stayed "live" until its own deadline instead of becoming a pin.
  it('emits onEnd with the last watched position on a manual stop', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    let push: any;
    geo.watchPosition.mockImplementation((cb: any) => { push = cb; return 77; });
    const onEnd = vi.fn();
    const { slice } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', durationMs: 60_000, onUpdate: vi.fn(), onEnd });

    push(coord(30, 40));
    slice.stopLiveLocation();

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0]).toMatchObject({ latitude: 30, longitude: 40, isLive: false });
  });

  it('pins the last position when the window elapses on its own', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    let push: any;
    geo.watchPosition.mockImplementation((cb: any) => { push = cb; return 77; });
    const onEnd = vi.fn();
    const { slice } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', durationMs: 60_000, onUpdate: vi.fn(), onEnd });

    push(coord(30, 40));
    vi.advanceTimersByTime(60_000);

    expect(onEnd.mock.calls[0][0]).toMatchObject({ latitude: 30, longitude: 40, isLive: false });
  });

  it('emits onEnd once even if the expiry timer fires after a manual stop', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    geo.watchPosition.mockReturnValue(77);
    const onEnd = vi.fn();
    const { slice } = makeSlice();
    slice.startLiveLocation({ chatId: 'c1', durationMs: 60_000, onUpdate: vi.fn(), onEnd });

    slice.stopLiveLocation();
    vi.advanceTimersByTime(60_000);

    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

describe('sweepExpiredLiveLocations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // `startLiveLocation` registers its teardown handle *before* the async
    // position fix, so tests that start a share and never end it leave that
    // handle behind — including the post-reload case below, which is defined by
    // it being absent. Start and stop a throwaway share to reset it.
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(1, 2)));
    geo.watchPosition.mockReturnValue(77);
    const { slice } = makeSlice();
    slice.startLiveLocation({ chatId: 'reset', onUpdate: vi.fn() });
    slice.stopLiveLocation();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('demotes an expired live bubble to a static pin, keeping the deadline', () => {
    const bubble = { id: 'm1', type: 'location', lat: 10, lng: 20, isLive: true, expiresAt: Date.now() - 1 };
    const setChats = vi.fn();
    const { slice } = makeSlice({ chats: [{ id: 'c1', history: [bubble] }], setChats });

    slice.sweepExpiredLiveLocations();

    expect(setChats).toHaveBeenCalledTimes(1);
    // The deadline is deliberately kept: the receive path writes the same shape
    // for a share that died on the wire, and one event must not store two.
    expect(setChats.mock.calls[0][0][0].history[0]).toEqual({ ...bubble, isLive: false });
  });

  it('rewrites nothing while every share still has time', () => {
    const setChats = vi.fn();
    const { slice } = makeSlice({
      chats: [{
        id: 'c1',
        history: [{ id: 'm1', type: 'location', lat: 1, lng: 2, isLive: true, expiresAt: Date.now() + 60_000 }],
      }],
      setChats,
    });

    slice.sweepExpiredLiveLocations();

    expect(setChats).not.toHaveBeenCalled();
  });

  it('never touches static pins or non-location messages', () => {
    const setChats = vi.fn();
    const { slice } = makeSlice({
      chats: [{ id: 'c1', history: [
        { id: 'g1', type: 'location', lat: 1, lng: 2 },
        { id: 't1', type: 'text', text: 'hi' },
      ] }],
      setChats,
    });

    slice.sweepExpiredLiveLocations();

    expect(setChats).not.toHaveBeenCalled();
  });

  it('retires a live flag that carries no usable deadline', () => {
    const setChats = vi.fn();
    const { slice } = makeSlice({
      chats: [{ id: 'c1', history: [{ id: 'm1', type: 'location', lat: 1, lng: 2, isLive: true }] }],
      setChats,
    });

    slice.sweepExpiredLiveLocations();

    // Otherwise the sweep would re-write this bubble on every store change,
    // forever, because nothing about it ever reaches a deadline.
    expect(setChats.mock.calls[0][0][0].history[0].isLive).toBe(false);
  });

  it('drops a stale share after a reload so the share panel closes', () => {
    const { slice, get } = makeSlice({ liveShare: { id: 's1', isLive: true, expiresAt: Date.now() - 1 } });

    slice.sweepExpiredLiveLocations();

    expect(get().liveShare).toBeNull();
  });

  it('leaves a running share alone', () => {
    const share = { id: 's1', isLive: true, expiresAt: Date.now() + 60_000 };
    const { slice, get } = makeSlice({ liveShare: share });

    slice.sweepExpiredLiveLocations();

    expect(get().liveShare).toBe(share);
  });

  it('finishes through the real path when this tab still owns the watch', () => {
    const geo = installGeolocation();
    geo.getCurrentPosition.mockImplementation((ok: any) => ok(coord(10, 20)));
    geo.watchPosition.mockReturnValue(77);
    const onEnd = vi.fn();
    const { slice } = makeSlice({ chats: [], setChats: vi.fn() });
    slice.startLiveLocation({ chatId: 'c1', durationMs: 60_000, onUpdate: vi.fn(), onEnd });

    // Move the clock past the deadline *without* letting the timeout run — the
    // shape of a throttled background tab. Clearing the flag directly here would
    // orphan the watch and never send the peer its final static frame.
    vi.setSystemTime(Date.now() + 60_001);
    slice.sweepExpiredLiveLocations();

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0]).toMatchObject({ isLive: false });
    expect(geo.clearWatch).toHaveBeenCalledWith(77);
  });

  it('uses the stored share when the watch has produced no position yet', () => {
    const geo = installGeolocation();
    // Position never resolves, so `latestShare` is still null when the deadline
    // passes and only the stored share can be finished.
    geo.getCurrentPosition.mockImplementation(() => {});
    geo.watchPosition.mockReturnValue(77);
    const onEnd = vi.fn();
    const { slice } = makeSlice({
      liveShare: { id: 's1', chatId: 'c1', isLive: true, expiresAt: 1, latitude: 5, longitude: 6 },
      chats: [],
      setChats: vi.fn(),
    });
    slice.startLiveLocation({ chatId: 'c1', durationMs: 60_000, onUpdate: vi.fn(), onEnd });
    // Re-point the stored share at the past: `startLiveLocation` bailed before
    // overwriting it, so this is the one the sweep will judge.
    slice.sweepExpiredLiveLocations();

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(onEnd.mock.calls[0][0]).toMatchObject({ isLive: false, latitude: 5, longitude: 6 });
  });
});
