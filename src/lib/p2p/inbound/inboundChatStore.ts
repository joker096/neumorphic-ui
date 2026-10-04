import { useAppStore } from "../../../store";

export function appendIncomingToDmChat(chat: any, newMessage: any) {
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    if (!chats.some((c: any) => c.id === chat.id)) return chats;
    return chats.map((c: any) =>
      c.id === chat.id ? { ...c, history: insertBySendTime(c.history || [], newMessage) } : c,
    );
  });
}

/**
 * Send time of a bubble, for ordering.
 *
 * `ts` is the canonical send time. `id` is only a fallback because most
 * senders use `Date.now()` for both, but live-location ids are strings
 * (`live_<chat>_<ts>`) and `Number("live_…")` is `NaN`, which collapsed to 0
 * and pushed a freshly started share to the top of the chat.
 */
const sendTimeOf = (m: any): number =>
  Number(m?.ts) || Number(m?.id) || Number(m?.timestamp) || 0;

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
  const { setChats } = useAppStore.getState();
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
        return { ...c, history: insertBySendTime(history, newMessage) };
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