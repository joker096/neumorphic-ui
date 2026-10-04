import { useEffect, useRef } from "react";

/**
 * Composer draft lifecycle: reset the pending reply when the active chat
 * changes, persist the draft per chat (§55, gated by `settings.draftsEnabled`)
 * and wipe retained drafts when the setting is switched off.
 */
export const useChatDraftSync = ({
  activeChat,
  messageText,
  setMessageText,
  setReplyTarget,
  setShowStickerPicker,
  setMorseMode,
  draftTextByChat,
  setDraftTextByChat,
  draftsEnabled,
}: {
  activeChat: any;
  messageText: string;
  setMessageText: (text: string) => void;
  setReplyTarget: (target: any) => void;
  setShowStickerPicker: (show: boolean) => void;
  setMorseMode: (on: boolean) => void;
  draftTextByChat: Record<string, string>;
  setDraftTextByChat: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
  draftsEnabled: boolean;
}) => {
  // Clear any pending reply when switching to a different contact/chat
  const activeChatIdRef = useRef(activeChat?.id ?? null);
  useEffect(() => {
    const id = activeChat?.id ?? null;
    if (activeChatIdRef.current !== id) {
      activeChatIdRef.current = id;
      setReplyTarget(null);
      setMessageText(id ? (draftTextByChat[String(id)] ?? "") : "");
      setShowStickerPicker(false);
      setMorseMode(false);
    }
  }, [activeChat?.id, setReplyTarget, draftTextByChat, setMessageText, setShowStickerPicker, setMorseMode]);

  // Persist draft text per chat §55 — gated by settings.draftsEnabled
  useEffect(() => {
    if (!activeChat) return;
    if (!draftsEnabled) return;
    const chatId = String(activeChat.id);
    setDraftTextByChat((prev) => {
      if (messageText) {
        if (prev[chatId] === messageText) return prev;
        return { ...prev, [chatId]: messageText };
      }
      if (prev[chatId]) {
        const next = { ...prev };
        delete next[chatId];
        return next;
      }
      return prev;
    });
  }, [messageText, activeChat?.id, draftsEnabled]);

  // Switching drafts off wipes everything already kept on disk — the setting
  // promises nothing is retained, so stale drafts must not survive the toggle.
  useEffect(() => {
    if (draftsEnabled) return;
    setDraftTextByChat((prev) => (Object.keys(prev).length ? {} : prev));
  }, [draftsEnabled]);
};
