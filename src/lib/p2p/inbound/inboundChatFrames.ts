import { encodeChatDeliveryAck, nextFrameSeq, type ChatDeleteFrame, type ChatEditFrame, type ChatPinFrame, type ChatPollVoteFrame, type ChatReactionFrame, type ChatTextFrame } from "../chatFrame";
import { p2pNetwork } from "../network";
import { applyVote } from "../../polls";
import { resolveInboundSelfDestruct } from "../../selfDestruct";
import { releaseMessageMedia } from "../../messageMedia";
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
    replyTo: frame.replyTo
      ? {
          id: String(frame.replyTo.id),
          // replyTo.sender is authored from the peer's point of view, where "me"
          // is the peer; invert it so the quote reads correctly for us.
          sender: frame.replyTo.sender === "me" ? chat.name : "me",
          text: frame.replyTo.text,
          type: frame.replyTo.type,
          duration: frame.replyTo.duration,
        }
      : undefined,
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

/**
 * Inbound pin/unpin delta. The sender references the message by its wire string
 * id; the local copy may use a numeric id (own messages are keyed by
 * `Date.now()`), so the target is resolved via `String(m.id)` and the *local* id
 * is stored — that keeps `previewOf`'s strict lookup and the dedupe in
 * `addPinnedMessage` working. Unknown chats/messages are ignored.
 */
export const handleChatPin = (frame: ChatPinFrame | null, senderId: string) => {
  if (!frame) return;
  const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-pin");
  if (!chat) return;
  const { chats, addPinnedMessage, removePinnedMessage } = useAppStore.getState();
  const localChat = (chats || []).find((c: any) => String(c.id) === String(chat.id));
  const target = (localChat?.history || []).find((m: any) => String(m.id) === frame.messageId);
  if (!target) return;
  if (frame.op === "pin") {
    addPinnedMessage({ id: target.id, chatId: chat.id, pinBy: frame.senderName });
  } else {
    removePinnedMessage(target.id, chat.id);
  }
};

/**
 * Inbound "delete for everyone".
 *
 * Only bubbles authored by the peer are removable: a frame must never erase
 * what the local user wrote, so `sender === "me"` is dropped even when the id
 * matches. Media (voice blob / file transfer / object URL) is released through
 * the same helper the local delete path uses, otherwise the retraction would
 * clean the bubble but leave the bytes behind. Unknown chats and messages are
 * ignored, which makes a duplicated or late frame harmless.
 */
export const handleChatDelete = (frame: ChatDeleteFrame | null, senderId: string) => {
  if (!frame) return;
  const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-delete");
  if (!chat) return;
  const state = useAppStore.getState();
  const localChat = (state.chats || []).find((c: any) => String(c.id) === String(chat.id));
  const target = (localChat?.history || []).find((m: any) => String(m.id) === frame.messageId);
  if (!target || target.sender === "me") return;
  void releaseMessageMedia([target]);
  state.removePinnedMessage?.(target.id, chat.id);
  state.setChats((prev: any[]) => prev.map((c: any) => (String(c.id) === String(chat.id)
    ? { ...c, history: (c.history || []).filter((m: any) => String(m.id) !== String(target.id)) }
    : c)));
};

/**
 * Inbound poll vote.
 *
 * Only the poll payload is touched: the question/options belong to the sender's
 * copy of the message, so a vote can never rewrite them. The voter identity is
 * the frame's display name (the local user is never a remote voter), and votes
 * on a closed poll are dropped — the sender's `closed` flag is authoritative.
 */
export const handleChatPollVote = (frame: ChatPollVoteFrame | null, senderId: string) => {
  if (!frame) return;
  const chat = authorizeInboundChatFrame(frame.chatId, frame.chatName, senderId, "chat-poll-vote");
  if (!chat) return;
  const state = useAppStore.getState();
  const localChat = (state.chats || []).find((c: any) => String(c.id) === String(chat.id));
  const target = (localChat?.history || []).find((m: any) => String(m.id) === frame.messageId);
  if (!target?.poll || target.poll.closed) return;
  const poll = applyVote(target.poll, frame.optionId, frame.senderName, frame.op);
  state.setChats((prev: any[]) => prev.map((c: any) => (String(c.id) === String(chat.id)
    ? {
      ...c,
      history: (c.history || []).map((m: any) => (String(m.id) === String(target.id) ? { ...m, poll } : m)),
    }
    : c)));
};