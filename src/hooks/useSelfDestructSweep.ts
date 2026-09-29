import { useEffect } from "react";
import { useAppStore } from "../store";
import { releaseMessageMedia } from "../lib/messageMedia";
import {
  nextSelfDestructDeadlineInLists,
  purgeExpiredLists,
  purgeExpiredSaved,
} from "../lib/selfDestruct";

export interface SelfDestructSweepArgs {
  /** Snapshot of the open chat — the store list and this object are separate. */
  activeChat?: any;
  setActiveChat?: (chat: any) => void;
  setSavedMessages?: (updater: (prev: any[]) => any[]) => void;
}

/**
 * Actually delete self-destruct messages once their deadline passes.
 *
 * The bubble component only *hides* expired content; without this the plaintext
 * (and the voice/file blobs) would live forever in the store, in the persisted
 * `chats_all` snapshot and in IndexedDB. Runs on mount (catches timers that
 * elapsed while the app was closed), on a precise timeout for the nearest
 * deadline, and after a background-tab wake-up.
 */
export function useSelfDestructSweep(args: SelfDestructSweepArgs = {}): void {
  const { activeChat, setActiveChat, setSavedMessages } = args;
  const chats = useAppStore((s) => s.chats);
  const channels = useAppStore((s) => s.channels);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const sweep = (now: number) => {
      const state = useAppStore.getState();
      const chatsResult = purgeExpiredLists(state.chats, now);
      const channelsResult = purgeExpiredLists(state.channels, now);
      const purged = [...chatsResult.purged, ...channelsResult.purged];
      const purgedIds = new Set<string | number>();
      for (const msg of purged) purgedIds.add(msg?.id);

      if (purgedIds.size) {
        if (chatsResult.purged.length) state.setChats(chatsResult.value);
        if (channelsResult.purged.length) state.setChannels(channelsResult.value);
        setSavedMessages?.((prev: any[]) => purgeExpiredSaved(prev, purgedIds));
        // The open chat is an App-level snapshot, not derived from the store —
        // without this the bubble would stay on screen after it was deleted.
        const openHistory: any[] = activeChat?.history ?? [];
        if (openHistory.length && setActiveChat && openHistory.some((m) => purgedIds.has(m?.id))) {
          setActiveChat({ ...activeChat, history: openHistory.filter((m) => !purgedIds.has(m?.id)) });
        }
      }

      // A purged bubble must not leave bytes or object URLs behind.
      if (purged.length) void releaseMessageMedia(purged);
    };

    const schedule = () => {
      if (cancelled) return;
      const state = useAppStore.getState();
      const now = Date.now();
      const chatDeadline = nextSelfDestructDeadlineInLists(state.chats, now);
      const channelDeadline = nextSelfDestructDeadlineInLists(state.channels, now);
      // Overdue deadlines (app was closed) are purged right away; setChats then
      // re-runs this effect with the remaining ones.
      if ((chatDeadline !== null && chatDeadline <= now) || (channelDeadline !== null && channelDeadline <= now)) {
        sweep(now);
        if (cancelled) return;
      }
      const upcoming = [chatDeadline, channelDeadline].filter(
        (d): d is number => d !== null && d > now,
      );
      if (!upcoming.length) return;
      const delay = Math.max(250, Math.min(...upcoming) - Date.now());
      timer = window.setTimeout(() => {
        sweep(Date.now());
        schedule();
      }, delay);
    };

    schedule();

    // Timers are throttled in background tabs — re-check on wake-up.
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // `chats`/`channels` re-arm the timer whenever a new message is stored.
  }, [chats, channels, activeChat, setActiveChat, setSavedMessages]);
}
