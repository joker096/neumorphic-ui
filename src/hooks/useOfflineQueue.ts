import { useCallback } from "react";
import { useAppStore } from "../store";
import { queueMessage } from "../lib/messageQueue";

/**
 * settings.offlineMode gate for the offline send queue.
 *
 * When offline queueing is switched off we must not keep message copies on
 * disk for later delivery: the send fails like an ordinary transport error
 * (`onFail` marks the bubble as failed, which already offers a retry) instead
 * of silently persisting data the user asked us not to retain.
 *
 * The store is read at call time via `getState()` so the newest value wins
 * without adding the setting to every callback's dependency list.
 */
export function useOfflineQueue() {
  return useCallback((message: any, onFail: () => void) => {
    if (!useAppStore.getState().offlineMode) {
      onFail();
      return;
    }
    void queueMessage(message).catch(() => onFail());
  }, []);
}
