import { encodeChatDeliveryAck, nextFrameSeq, type ChatEditFrame, type ChatReactionFrame, type ChatTextFrame } from "../chatFrame";
import { p2pNetwork } from "../network";
import { resolveInboundSelfDestruct } from "../../selfDestruct";
import { formatClockTime } from "../../../utils/chatUtils";
import { useAppStore } from "../../../store";
import { authorizeInboundChatFrame } from "./inboundGate";
import { appendIncomingToDmChat } from "./inboundChatStore";

/** Inbound plain-text bubble: `sender` is the local contact name, never the asserted one. */
export const handleChatText = (frame: ChatTextFrame | null, senderId: string) => {
  if (!frame) return;
  const messageId = frame.messageId || String(frame.timestamp);
  const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-text");
  if (!chat) return;
  appendIncomingToDmChat(chat, {
    id: messageId,
    sender: chat.name,
    text: frame.text,
    type: "text",
    ts: frame.timestamp,
    time: formatClockTime(frame.timestamp),
    status: "delivered",
    silent: frame.silent,
    selfDestructAt: resolveInboundSelfDestruct(frame.ttlMs),
  });
  void p2pNetwork.sendAddressed(senderId, encodeChatDeliveryAck({
    type: "chat-ack",
    seq: nextFrameSeq(),
    messageId,
    chatId: frame.chatId,
    timestamp: Date.now(),
  })).catch(() => {});
};

/** Inbound edit: patches the addressed bubble in place and flags it edited. */
export const handleChatEdit = (frame: ChatEditFrame | null, senderId: string) => {
  if (!frame) return;
  const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-edit");
  if (!chat) return;
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    if (!chats.some((c: any) => c.id === chat.id)) return chats;
    return chats.map((c: any) =>
      c.id === chat.id
        ? {
            ...c,
            history: (c.history || []).map((m: any) =>
              String(m.id) === frame.messageId ? { ...m, text: frame.text, edited: true } : m,
            ),
          }
        : c,
    );
  });
};

/**
 * Inbound reaction toggle: bumps or removes a single count on the addressed
 * bubble. The remote side never owns `myReactions` — only counts change — so the
 * local "mine" highlight cannot be spoofed by a peer.
 */
export const handleChatReaction = (frame: ChatReactionFrame | null, senderId: string) => {
  if (!frame) return;
  const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-reaction");
  if (!chat) return;
  const { setChats } = useAppStore.getState();
  setChats((prevChats: any[]) => {
    const chats = prevChats || [];
    if (!chats.some((c: any) => c.id === chat.id)) return chats;
    return chats.map((c: any) =>
      c.id === chat.id
        ? {
            ...c,
            history: (c.history || []).map((m: any) => {
              if (String(m.id) !== frame.messageId) return m;
              const reactions = { ...(m.reactions || {}) };
              if (frame.op === "add") {
                reactions[frame.emoji] = (reactions[frame.emoji] || 0) + 1;
              } else {
                const next = (reactions[frame.emoji] || 0) - 1;
                if (next > 0) reactions[frame.emoji] = next;
                else delete reactions[frame.emoji];
              }
              return { ...m, reactions };
            }),
          }
        : c,
    );
  });
};