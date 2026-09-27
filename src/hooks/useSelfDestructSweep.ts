import { useEffect } from "react";
import { useAppStore } from "../store";
import { deleteVoiceBlob } from "../lib/voiceStore";
import { deleteTransfer } from "../lib/fileTransfer/fileStore";
import {
  mergeExpiredMedia,
  nextSelfDestructDeadlineInLists,
  purgeExpiredLists,
  purgeExpiredSaved,
  type ExpiredMedia,
} from "../lib/selfDestruct";

export interface SelfDestructSweepArgs {
  /** Snapshot of the open chat — the store list and this object are separate. */
  activeChat?: any;
  setActiveChat?: (chat: any) => void;
  setSavedMessages?: (updater: (prev: any[]) => any[]) => void;
}

/** Best-effort media erasure: a purged bubble must not leave bytes behind. */
async function eraseMedia(media: ExpiredMedia): Promise<void> {
  await Promise.all([
    ...media.voiceIds.map(async (id) => {
      try {
        await deleteVoiceBlob(id);
      } catch {
        /* keep sweeping */
      }
    }),
    ...media.transferIds.map(async (id) => {
      try {
        await deleteTransfer(id);
      } catch {
        /* keep sweeping */
      }
    }),
  ]);
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
      const purgedIds = new Set<string | number>();
      for (const msg of [...chatsResult.purged, ...channelsResult.purged]) purgedIds.add(msg?.id);

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

      const media: ExpiredMedia = { voiceIds: [], transferIds: [] };
      mergeExpiredMedia(media, chatsResult.media);
      mergeExpiredMedia(media, channelsResult.media);
      if (media.voiceIds.length || media.transferIds.length) void eraseMedia(media);
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
