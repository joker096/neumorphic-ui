import { useAppStore } from "../../../store";
import { playSound } from "../../sounds";
import { sendTimeOf } from "../../../utils/chatUtils";
import type { NotificationKind } from "../../../store/slices/notificationSlice";
import { isNotificationKindEnabled, DEFAULT_NOTIFICATION_SETTINGS } from "../../../store/slices/notificationSlice";

export function appendIncomingToDmChat(chat: any, newMessage: any) {
  const { setChats, activeChatId } = useAppStore.getState();
  const isOpen = activeChatId != null && String(activeChatId) === String(chat.id);
  let appended = false;
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    if (!chats.some((c: any) => c.id === chat.id)) return chats;
    appended = true;
    return chats.map((c: any) =>
      c.id === chat.id
        ? {
            ...c,
            history: insertBySendTime(c.history || [], newMessage),
            // Telegram/WhatsApp semantics: an incoming bubble while the chat is
            // closed bumps the badge; the conversation being read stays at 0.
            ...(isOpen ? null : { unread: (c.unread || 0) + 1 }),
          }
        : c,
    );
  });
  if (!appended || isOpen) return;
  const fresh = useAppStore.getState().chats.find((c: any) => c.id === chat.id);
  notifyIncoming(chat, fresh, newMessage);
}

/**
 * In-app notification + sound for an incoming bubble while the chat is NOT
 * open. The kind mirrors the chat-list classification (mention/group/channel),
 * and the sound runs through the same filter switch (`isNotificationKindEnabled`)
 * instead of a private copy, so a disabled category stays silent as well as
 * absent from the center. `pushNotification` re-checks the switch itself.
 */
function notifyIncoming(chat: any, freshChat: any | undefined, msg: any) {
  const state = useAppStore.getState();
  const target = freshChat ?? chat;
  // Muted chats keep their badge (like Telegram) but stay silent.
  if (target.isMuted || target.muted) return;
  // Fall back to the defaults when the store is only partially wired (tests,
  // pre-hydration) instead of throwing on every incoming frame.
  const settings = state.notificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS;
  const text = typeof msg.text === "string" ? msg.text : "";
  const mentionsMe =
    (Array.isArray(msg.mentions) && msg.mentions.some((m: any) => m?.name === "user")) ||
    /@user\b/i.test(text);
  const kind: NotificationKind = mentionsMe
    ? "mention"
    : target.type === "group" || target.group
      ? "group"
      : target.isChannel || target.type === "channel"
        ? "channel"
        : "message";
  if (!isNotificationKindEnabled(kind, settings)) return;
  state.pushNotification?.({ title: target.name || "", body: text || undefined, kind, chatId: String(chat.id) });
  if (settings.sounds && !msg.silent) playSound("incoming-chat");
}

/**
 * Incoming frames carry the sender's message id (Date.now() at send time), so a
 * late arrival (e.g. an ACK-pipeline retransmit) must land in send-time order
 * instead of blindly appending after already-rendered newer messages.
 */
function insertBySendTime(history: any[], message: any): any[] {
  const ts = sendTimeOf(message);
  const idx = history.findIndex((m) => sendTimeOf(m) > ts);
  if (idx === -1) return [...history, message];
  return [...history.slice(0, idx), message, ...history.slice(idx)];
}

/**
 * Upsert variant used by live-location updates: a stream reuses one
 * `messageId`, so the frame must patch the existing bubble rather than append
 * a duplicate. Returns whether the bubble was created by this call, so the
 * caller can acknowledge only the first frame of a stream instead of every
 * GPS fix.
 */
export function upsertIncomingToDmChat(chat: any, newMessage: any): { created: boolean } {
  const { setChats, activeChatId } = useAppStore.getState();
  const isOpen = activeChatId != null && String(activeChatId) === String(chat.id);
  let created = false;
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    if (!chats.some((c: any) => c.id === chat.id)) return chats;
    return chats.map((c: any) => {
      if (c.id !== chat.id) return c;
      const history = c.history || [];
      const idx = history.findIndex((m: any) => String(m.id) === String(newMessage.id));
      if (idx === -1) {
        created = true;
        return {
          ...c,
          history: insertBySendTime(history, newMessage),
          // Only the first frame of a live-location stream counts as new; every
          // GPS fix after it must not bump the badge again.
          ...(isOpen ? null : { unread: (c.unread || 0) + 1 }),
        };
      }
      // Keep the original send time: a moving bubble must not jump to the top
      // of the chat on every fix.
      const previous = history[idx];
      return {
        ...c,
        history: [
          ...history.slice(0, idx),
          { ...previous, ...newMessage, id: previous.id, ts: previous.ts ?? newMessage.ts },
          ...history.slice(idx + 1),
        ],
      };
    });
  });
  if (created && !isOpen) {
    const fresh = useAppStore.getState().chats.find((c: any) => c.id === chat.id);
    notifyIncoming(chat, fresh, newMessage);
  }
  return { created };
}

export function markOutgoingStatus(ack: { messageId: string; chatId: string } | null, status: "delivered" | "read") {
  if (!ack) return;
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => (prevChats || []).map((chat: any) => {
    if (String(chat.id) !== ack.chatId) return chat;
    return {
      ...chat,
      history: (chat.history || []).map((message: any) =>
        String(message.id) === ack.messageId && message.sender === "me"
          ? { ...message, status }
          : message,
      ),
    };
  }));
}