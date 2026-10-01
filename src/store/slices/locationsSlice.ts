import {
  LIVE_LOCATION_DEFAULT_MS,
  LIVE_LOCATION_WATCH_OPTIONS,
  clampLiveDurationMs,
} from '../../constants/liveLocation';
import type { LocationShare } from '../types';

/**
 * A single in-flight live-location share.
 *
 * The watcher handles live OUTSIDE the store (a `watchId` is meaningless in
 * persisted state, and keeping it here is what lets `stopLiveLocation` actually
 * release the GPS). The store only ever holds the data needed to render and to
 * expire the share.
 */
export interface LocationSlice {
  /** The share currently being streamed, if any. One at a time by design. */
  liveShare: LocationShare | null;
  startLiveLocation: (opts: {
    chatId: string | number;
    durationMs?: number;
    approximate?: boolean;
    /** Called for every accepted position, with the wire-ready payload. */
    onUpdate: (share: LocationShare) => void;
    /** Called once when sharing ends for any reason (stop, expiry, failure). */
    onEnd?: (share: LocationShare) => void;
    onError?: (err: GeolocationPositionError | Error) => void;
  }) => void;
  stopLiveLocation: () => void;
  sweepExpiredLiveLocations: () => void;
}

/**
 * Watch/timeout handles. Module-private on purpose: these must never be
 * persisted, cloned, or read by the UI, and keeping them out of the store state
 * is what makes that structurally impossible.
 */
let activeWatchId: number | null = null;
let activeTimeoutId: ReturnType<typeof setTimeout> | null = null;
/** Newest accepted position, so an auto-stop pins where the user actually is. */
let latestShare: LocationShare | null = null;
/**
 * Ends the active stream. Held module-privately so `stopLiveLocation` can
 * finish a stream it did not start — otherwise a manual stop tore down the
 * hardware without ever emitting the final static frame, and the peer's bubble
 * stayed "live" until its own deadline.
 */
let activeFinish: ((share: LocationShare) => void) | null = null;

const releaseHardware = () => {
  if (activeWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeWatchId);
  }
  activeWatchId = null;
  if (activeTimeoutId !== null) {
    clearTimeout(activeTimeoutId);
  }
  activeTimeoutId = null;
  latestShare = null;
  activeFinish = null;
};

/**
 * Is a live share past its deadline?
 *
 * A live flag with no usable deadline counts as expired — the same rule the
 * bubble card applies — so the sweep can retire it instead of leaving a share
 * that claims to be live but can never end.
 */
const isExpired = (expiresAt: unknown, now: number): boolean => {
  const deadline = Number(expiresAt);
  return !Number.isFinite(deadline) || deadline <= now;
};

export const createLocationSlice = (set: any, get: any): LocationSlice => ({
  liveShare: null,

  startLiveLocation: ({ chatId, durationMs, approximate = true, onUpdate, onEnd, onError }) => {
    // One stream at a time: a second start would orphan the first watch, which
    // is precisely the leak this slice was rewritten to eliminate. The old
    // share's state is overwritten below, so only the hardware needs releasing.
    if (get().liveShare) {
      releaseHardware();
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.(new Error('Geolocation is unavailable'));
      return;
    }

    const ttlMs = clampLiveDurationMs(durationMs ?? LIVE_LOCATION_DEFAULT_MS);
    const userId = String(get().userProfile?.id ?? 'me');
    const senderName = String(get().userProfile?.name ?? 'me');
    let ended = false;

    const finish = (share: LocationShare) => {
      if (ended) return;
      ended = true;
      activeFinish = null;
      releaseHardware();
      set({ liveShare: share.isLive ? null : share });
      onEnd?.(share);
    };
    // Registered before the async position fix, so a stop that arrives while
    // geolocation is still resolving still tears the stream down.
    activeFinish = finish;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const startedAt = Date.now();
        const expiresAt = startedAt + ttlMs;
        const share: LocationShare = {
          id: `live_${chatId}_${startedAt}`,
          chatId,
          userId,
          senderName,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: startedAt,
          expiresAt,
          isLive: true,
          approximate,
        };
        latestShare = share;
        set({ liveShare: share });
        onUpdate(share);

        activeWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            // Expiry is enforced here as well as by the timer: if the tab was
            // throttled and the timer fired late, a position that arrives after
            // the window must not extend the share.
            if (Date.now() >= expiresAt) {
              finish({ ...(latestShare ?? share), isLive: false });
              return;
            }
            const next: LocationShare = {
              ...share,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: Date.now(),
            };
            latestShare = next;
            set({ liveShare: next });
            onUpdate(next);
          },
          (err) => onError?.(err),
          LIVE_LOCATION_WATCH_OPTIONS,
        );

        activeTimeoutId = setTimeout(
          () => finish({ ...(latestShare ?? share), isLive: false }),
          ttlMs,
        );
      },
      (err) => onError?.(err),
      LIVE_LOCATION_WATCH_OPTIONS,
    );
  },

  stopLiveLocation: () => {
    // Prefer the newest watch position over the stored share: a stop that lands
    // between fixes must still pin the last known place, not the first.
    const current = latestShare ?? get().liveShare ?? null;
    if (!activeFinish || !current) {
      releaseHardware();
      return;
    }
    activeFinish({ ...current, isLive: false, timestamp: Date.now() });
  },

  /**
   * Retire live-location state that outlived its deadline.
   *
   * A share can be missed in two ways, and both leave a bubble claiming to be
   * live forever: the tab that owned the stream was closed or throttled before
   * its timeout fired, and a peer that vanished never sent a stop frame. The
   * bubble card hides the countdown on its own, but the stored state would still
   * say "live" — and the share panel stays open off `liveShare.isLive` — so the
   * flag has to be cleared for real.
   *
   * Demotion is deliberately identical to what the receive path already writes
   * for a dead share (`useP2PMessages`): `isLive: false` with `expiresAt` kept.
   * Keeping the deadline preserves when the share was meant to end, and the same
   * event must not store two different shapes depending on whether the receiver
   * happened to be running when it died.
   */
  sweepExpiredLiveLocations: () => {
    const now = Date.now();
    const liveShare = get().liveShare;

    if (liveShare?.isLive === true && isExpired(liveShare.expiresAt, now)) {
      // A stale share means the stream's own timeout never got to run. If this
      // tab still owns the watch, finish through the real path so the GPS is
      // released and the peer receives its final static frame; after a reload
      // there is no handle left and the stale state is simply dropped.
      if (activeFinish) activeFinish({ ...liveShare, isLive: false, timestamp: now });
      else set({ liveShare: null });
    }

    // Re-read after the teardown above: finishing a stream writes a final static
    // bubble, and sweeping a snapshot taken before it would demote that bubble a
    // second time.
    const chats = get().chats;
    if (!Array.isArray(chats) || !chats.length) return;

    let chatsChanged = false;
    const next = chats.map((chat: any) => {
      const history = chat?.history;
      if (!Array.isArray(history)) return chat;
      // `some` first: this runs on a timer, and mapping every history in the
      // store to discover that nothing expired would allocate on every tick.
      const expiredLive = (msg: any) =>
        msg?.type === 'location' && msg?.isLive === true && isExpired(msg.expiresAt, now);
      if (!history.some(expiredLive)) return chat;
      chatsChanged = true;
      return { ...chat, history: history.map((msg: any) => (expiredLive(msg) ? { ...msg, isLive: false } : msg)) };
    });

    if (chatsChanged) get().setChats(next);
  },
});
