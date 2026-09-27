import { useCallback, useState } from "react";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import { toast } from "../components/ui/Toast";
import { buildForwardedMessage, isWireForwardable } from "../utils/messageForward";
import { encodeChatText, nextFrameSeq } from "../lib/p2p/chatFrame";
import { p2pNetwork } from "../lib/p2p/network";

/**
 * Forwarding of one or many messages into a user-picked chat.
 *
 * The previous behaviour picked a chat on the user's behalf (Saved Messages
 * first, otherwise the first other chat) and wrote the copy into the legacy
 * `chat.messages` array, which no view renders — forwarded messages were
 * invisible. This hook keeps the choice with the user and writes to
 * `chat.history`, the field the message list actually reads.
 */
export function useMessageForward(sourceChat?: any) {
  const { t } = useI18n();
  const setChats = useAppStore((s) => s.setChats);
  const [pending, setPending] = useState<any[] | null>(null);

  const openForward = useCallback((payload: any) => {
    const list = (Array.isArray(payload) ? payload : [payload]).filter(Boolean);
    if (list.length === 0) return;
    setPending(list);
  }, []);

  const closeForward = useCallback(() => setPending(null), []);

  const forwardTo = useCallback(
    (target: any) => {
      const messages = pending;
      if (!target || !messages?.length) return;

      const now = Date.now();
      const status = navigator.onLine ? "sent" : "queued";
      const copies = messages.map((msg, index) =>
        buildForwardedMessage(msg, { now: now + index, status, sourceChatName: sourceChat?.name }),
      );

      setChats((prev: any[]) =>
        prev.map((c: any) =>
          c.id === target.id ? { ...c, history: [...(c.history || []), ...copies] } : c,
        ),
      );

      const sender = useAppStore.getState().userProfile;
      for (const copy of copies) {
        if (!isWireForwardable(copy)) continue;
        void p2pNetwork
          .sendAddressed(
            p2pNetwork.peerForChat(target.id) ?? p2pNetwork.peerForChatName(target.name),
            encodeChatText({
              type: "chat-text",
              seq: nextFrameSeq(),
              messageId: String(copy.id),
              chatId: String(target.id),
              chatName: String(target.name || ""),
              senderName: sender?.name || sender?.username || "User",
              text: String(copy.text || ""),
              silent: false,
              timestamp: copy.id,
            }),
          )
          .catch(() => {});
      }

      setPending(null);
      toast(t("chat.forwarded", "Forwarded"));
    },
    [pending, setChats, sourceChat?.name, t],
  );

  return {
    forwardOpen: pending !== null,
    forwardCount: pending?.length ?? 0,
    openForward,
    closeForward,
    forwardTo,
  };
}
