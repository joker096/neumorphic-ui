import { useCallback } from "react";

/**
 * Collection of independent, mostly one-liner callbacks the composition root
 * (App) passes down to the shell/workspace. Grouped into a hook so the root
 * stays a thin wiring layer (component-audit < 300 lines) instead of a flat
 * list of `useCallback` handlers.
 */
interface UseAppCallbacksArgs {
  baseHandleNavigate: (target: string) => void;
  setNavOrigin: (origin: unknown) => void;
  setContacts: (updater: any) => void;
  uiSetShowAddContactFromChat: (show: boolean) => void;
  openChat: (chat: any) => void;
  chats: any[];
  channels: any[];
}

export function useAppCallbacks({
  baseHandleNavigate,
  setNavOrigin,
  setContacts,
  uiSetShowAddContactFromChat,
  openChat,
  chats,
  channels,
}: UseAppCallbacksArgs) {
  const handleNavigate = useCallback(
    (target: string) => {
      setNavOrigin(null);
      baseHandleNavigate(target);
    },
    [baseHandleNavigate, setNavOrigin],
  );

  const handleAddContactFromChat = useCallback(
    (name: string, id: string, color?: string, localFields?: any[]) => {
      const newContact = { name, id, color: color || "from-teal-400 to-emerald-500", lastSeen: Date.now(), localFields };
      setContacts((prev: any[]) => [newContact, ...prev]);
      uiSetShowAddContactFromChat(false);
    },
    [setContacts, uiSetShowAddContactFromChat],
  );

  const onOpenSavedMessage = useCallback(
    (chatId: string | number, messageId: string | number) => {
      const chat = [...(chats ?? []), ...(channels ?? [])].find((c: any) => String(c?.id) === String(chatId));
      if (!chat) return;
      openChat({ ...chat, __jumpToMessageId: messageId });
    },
    [chats, channels, openChat],
  );

  return { handleNavigate, handleAddContactFromChat, onOpenSavedMessage };
}
