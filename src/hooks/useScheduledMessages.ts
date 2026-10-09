import { useEffect } from "react";
import { useAppStore } from "../store";
import { formatClockTime } from "../utils/chatUtils";
import { useOfflineQueue } from "./useOfflineQueue";
import { useMessageWire } from "./useMessageWire";
import type { ScheduledMessage } from "../store/types";

/**
 * Fires due scheduled messages exactly like the live send path: the bubble is
 * stamped with `ts`/`time` (so the list row and grouping render it), appended
 * to the target chat and the open conversation, pushed over the wire with the
 * honest `queued`/`sent` status and mirrored into the offline queue — then
 * dropped from the schedule queue. The wire mount is `flushQueue: false`: the
 * offline replay loop belongs to the single primary mount in
 * `useMessageActions`.
 */
export function useScheduledMessages(setActiveChat: (updater: any) => void) {
  const scheduledQueue = useAppStore(s => s.scheduledQueue);
  const setChats = useAppStore(s => s.setChats);
  const queueOffline = useOfflineQueue();
  const { updateMessageStatus, sendTextOverP2P } = useMessageWire({
    activeChat: null,
    setChats,
    setActiveChat,
    flushQueue: false,
  });

  useEffect(() => {
    if (!scheduledQueue || scheduledQueue.messages.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const due = scheduledQueue.messages.filter((msg: ScheduledMessage) => msg.scheduledAt <= now);
      if (due.length === 0) return;

      const chats = useAppStore.getState().chats as any[];
      const fired: { msg: ScheduledMessage; chat: any; bubble: any }[] = [];
      for (const msg of due) {
        const chat = chats.find((c: any) => c.id === msg.chatId);
        if (!chat) continue;
        const bubble = {
          id: Date.now() + Math.random(),
          text: msg.text,
          sender: "me",
          ts: now,
          time: formatClockTime(now),
          status: navigator.onLine ? "sent" : "queued",
        };
        fired.push({ msg, chat, bubble });
      }
      if (fired.length === 0) return;

      setChats(prevChats => prevChats.map((c: any) => {
        const hits = fired.filter(f => f.chat.id === c.id);
        if (hits.length === 0) return c;
        const last = hits[hits.length - 1].bubble;
        return {
          ...c,
          history: [...(c.history || []), ...hits.map(f => f.bubble)],
          message: last.text,
          time: last.time,
        };
      }));
      setActiveChat(prev => {
        if (!prev) return prev;
        const hits = fired.filter(f => f.chat.id === prev.id);
        if (hits.length === 0) return prev;
        const last = hits[hits.length - 1].bubble;
        return {
          ...prev,
          history: [...(prev.history || []), ...hits.map(f => f.bubble)],
          message: last.text,
          time: last.time,
        };
      });

      for (const { msg, chat, bubble } of fired) {
        queueOffline({ ...bubble, chatId: chat.id, chatName: chat.name },
          () => updateMessageStatus(bubble.id, "failed"));
        void sendTextOverP2P(bubble, chat).catch(() => {});
        scheduledQueue.removeMessage(msg.id);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scheduledQueue, setChats, setActiveChat, queueOffline, updateMessageStatus, sendTextOverP2P]);
}
