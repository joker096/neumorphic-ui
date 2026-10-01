import { useEffect } from "react";
import { useAppStore } from "../store";

/**
 * Demote live-location bubbles whose deadline has passed.
 *
 * `GeoMessageCard` already hides the countdown once a share expires, but it only
 * does that in the rendered output: the stored bubble keeps `isLive: true`
 * forever if the sender vanished without a stop frame, and the share panel stays
 * open off `liveShare.isLive`. Without this the store is the only place that
 * still believes the share is running.
 *
 * Deliberately a slow poll rather than a precise timeout at the nearest
 * deadline, unlike the self-destruct sweep. That one deletes plaintext, so it
 * needs to fire on time; this one demotes a flag, and a late sweep costs at most
 * a few seconds of a countdown that the card is already hiding.
 */
const SWEEP_INTERVAL_MS = 30_000;

export function useLiveLocationSweep(): void {
  const chats = useAppStore((s) => s.chats);
  const liveShare = useAppStore((s) => s.liveShare);

  useEffect(() => {
    // On mount, so shares that expired while the app was closed are retired
    // before anything can read the stale flag.
    useAppStore.getState().sweepExpiredLiveLocations();

    const id = window.setInterval(() => {
      useAppStore.getState().sweepExpiredLiveLocations();
    }, SWEEP_INTERVAL_MS);

    // Timers are throttled in background tabs, so a share can pass its deadline
    // with the interval suspended. Re-check on wake-up.
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        useAppStore.getState().sweepExpiredLiveLocations();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // A sweep rewrites the state it subscribes to, so re-arming on `chats` here
    // would restart the interval after every message in the app.
  }, [chats, liveShare]);
}
