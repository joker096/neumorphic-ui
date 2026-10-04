import { useState, useEffect, useRef } from "react";
import { encodeChatReadReceipt, nextFrameSeq } from "../lib/p2p/chatFrame";
import { p2pNetwork } from "../lib/p2p/network";

interface UseChatPreviewEffectsArgs {
  chat: any;
  readReceipts: boolean;
  isNearBottom: boolean;
  onUpdateChat?: (chat: any) => void;
  setChatsStore: (updater: any[] | ((prev: any[]) => any[])) => void;
  setUnreadSinceScroll: (updater: (prev: number) => number) => void;
  setActiveMediaMsg: (msg: any) => void;
}

/**
 * Side effects of the chat preview: tab visibility, the unread-since-scroll
 * counter, the media-lightbox reset on chat switch, outgoing read receipts and
 * the locally simulated `delivered → read` transition.
 */
export function useChatPreviewEffects({ chat, readReceipts, isNearBottom, onUpdateChat, setChatsStore, setUnreadSinceScroll, setActiveMediaMsg }: UseChatPreviewEffectsArgs) {
  const [tabVisible, setTabVisible] = useState(() => document.visibilityState === "visible");
  useEffect(() => {
    const onVisibilityChange = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const prevHistoryLen = useRef(chat.history?.length || 0);

  useEffect(() => {
    const curLen = chat.history?.length || 0;
    if (!isNearBottom && curLen > prevHistoryLen.current) {
      setUnreadSinceScroll(prev => prev + (curLen - prevHistoryLen.current));
    }
    prevHistoryLen.current = curLen;
  }, [chat.history?.length, isNearBottom]);

  useEffect(() => {
    setActiveMediaMsg(null);
  }, [chat.id]);

  const lastReadReceiptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!readReceipts || !isNearBottom || !tabVisible || chat.isChannel) return;
    const lastIncoming = [...(chat.history || [])].reverse().find((message: any) => message.sender !== "me");
    if (!lastIncoming) return;
    const messageId = String(lastIncoming.id);
    if (lastReadReceiptRef.current === messageId) return;
    lastReadReceiptRef.current = messageId;
    void p2pNetwork.sendAddressed(p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name), encodeChatReadReceipt({
      type: "chat-read",
      seq: nextFrameSeq(),
      messageId,
      chatId: String(chat.id),
      timestamp: Date.now(),
    })).catch(() => {});
  }, [chat.id, chat.history, chat.isChannel, isNearBottom, readReceipts, tabVisible]);

  useEffect(() => {
    if (!chat || !chat.history) return;
    // Real P2P chats: 'read' must come from the peer's wire chat-read frame
    // (useP2PMessages), never from a local timer. Simulation only.
    const isWirePeer = p2pNetwork.peerForChat(String(chat.id)) !== undefined
      || /^[0-9a-f]{64}$/.test(String(chat.id));
    if (isWirePeer) return;
    const hasDelivered = chat.history.some((m: any) => m.sender === "me" && m.status === "delivered");
    if (!hasDelivered) return;
    const timer = setTimeout(() => {
      const updatedHistory = chat.history.map((m: any) => {
        if (m.sender === "me" && m.status === "delivered") return { ...m, status: "read" };
        return m;
      });
      const updatedChat = { ...chat, history: updatedHistory };
      if (onUpdateChat) onUpdateChat(updatedChat);
      setChatsStore(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    }, 1500);
    return () => clearTimeout(timer);
  }, [chat, onUpdateChat, setChatsStore]);

  return { tabVisible };
}