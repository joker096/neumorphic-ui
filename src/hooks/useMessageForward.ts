import { useCallback, useState } from "react";
import { useAppStore } from "../store";
import { useI18n } from "../lib/i18n";
import { toast } from "../components/ui/Toast";
import { buildForwardedMessage, isWireForwardable } from "../utils/messageForward";
import { encodeChatText, nextFrameSeq } from "../lib/p2p/chatFrame";
import { p2pNetwork } from "../lib/p2p/network";

/**
 * Forwarding of one or many messages into one or several user-picked chats.
 *
 * Copies are written to `chat.history` (the field the message list reads) and
 * each one is put on the wire individually: a P2P frame carries one chat id,
 * so forwarding to N chats is a loop, not a broadcast.
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

  const deliver = useCallback(
    (targets: any[]) => {
      const messages = pending;
      const valid = targets.filter(Boolean);
      if (!messages?.length || valid.length === 0) return;

      const status = navigator.onLine ? "sent" : "queued";
      const sender = useAppStore.getState().userProfile;
      const perTarget = new Map<string, any[]>();

      let offset = 0;
      for (const target of valid) {
        const copies = messages.map((msg, index) =>
          buildForwardedMessage(msg, {
            now: Date.now() + offset + index,
            status,
            sourceChatName: sourceChat?.name,
          }),
        );
        offset += messages.length;
        perTarget.set(String(target.id), copies);
      }

      setChats((prev: any[]) =>
        prev.map((c: any) => {
          const copies = perTarget.get(String(c.id));
          return copies ? { ...c, history: [...(c.history || []), ...copies] } : c;
        }),
      );

      for (const target of valid) {
        for (const copy of perTarget.get(String(target.id)) ?? []) {
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
      }

      setPending(null);
      toast(
        valid.length > 1
          ? t("chat.forwardedTo", { count: valid.length })
          : t("chat.forwarded", "Forwarded"),
      );
    },
    [pending, setChats, sourceChat?.name, t],
  );

  const forwardTo = useCallback((target: any) => deliver([target]), [deliver]);
  const forwardToMany = useCallback((targets: any[]) => deliver(targets), [deliver]);

  return {
    forwardOpen: pending !== null,
    forwardCount: pending?.length ?? 0,
    openForward,
    closeForward,
    forwardTo,
    forwardToMany,
  };
}
