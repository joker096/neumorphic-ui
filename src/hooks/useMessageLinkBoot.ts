import { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { clearMessageLink, parseMessageLink } from '../lib/chat/messageLink';

/**
 * Opens the chat a `#nexus://chat/…` / `?msg=` deep link points at and asks the
 * conversation view to scroll to that message.
 *
 * One-shot: the link is stripped from the URL before the open so a reload does
 * not replay it. A link naming a chat this client does not have (another
 * device's local id) is consumed silently — there is nothing to show and a
 * toast would only report a failure the user cannot act on.
 */
export const useMessageLinkBoot = ({ openChat }: { openChat: (chat: any) => void }) => {
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;
    if (typeof window === 'undefined') return;
    const link = parseMessageLink(window.location.hash, window.location.search);
    if (!link) return;
    clearMessageLink();
    const state = useAppStore.getState();
    const chat = [...(state.chats ?? []), ...(state.channels ?? [])].find(
      (c: any) => String(c.id) === String(link.chatId),
    );
    if (!chat) return;
    openChat({ ...chat, __jumpToMessageId: link.messageId });
  }, [openChat]);
};
