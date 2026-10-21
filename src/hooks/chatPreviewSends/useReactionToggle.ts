/**
 * Reaction toggle for a single message: a second tap on the same emoji removes
 * it, and the delta travels as a `chat-reaction` frame.
 */

import { useState } from 'react';
import { useAppStore } from '../../store';
import { encodeChatReaction, nextFrameSeq } from '../../lib/p2p/chatFrame';
import { p2pNetwork } from '../../lib/p2p/network';

interface UseReactionToggleArgs {
  chat: any;
  onUpdateChat?: (chat: any) => void;
  setChatsStore: (updater: any[] | ((prev: any[]) => any[])) => void;
}

export function useReactionToggle({ chat, onUpdateChat, setChatsStore }: UseReactionToggleArgs) {
  const [activeReactionPicker, setActiveReactionPicker] = useState<number | string | null>(null);

  /**
   * Toggle the local user's reaction: a second tap on the same emoji removes it.
   * The sender's own reactions are tracked under `myReactions` (never asserted
   * over the wire) so the highlight survives re-renders, and the count delta
   * travels as a `chat-reaction` frame. Own messages are reactable too, matching
   * the double-tap gesture which fires regardless of direction.
   */
  const handleReactionMessage = (msgId: string | number, emoji: string) => {
    let op: "add" | "remove" = "add";
    const updatedChat = {
      ...chat,
      history: (chat.history || []).map((m: any) => {
        if (m.id !== msgId) return m;
        const reactions = { ...(m.reactions || {}) };
        const mine = { ...(m.myReactions || {}) };
        if (mine[emoji]) {
          op = "remove";
          delete mine[emoji];
          const next = (reactions[emoji] || 0) - 1;
          if (next > 0) reactions[emoji] = next;
          else delete reactions[emoji];
        } else {
          op = "add";
          mine[emoji] = true;
          reactions[emoji] = (reactions[emoji] || 0) + 1;
        }
        return { ...m, reactions, myReactions: mine };
      })
    };
    if (onUpdateChat) onUpdateChat(updatedChat);
    setChatsStore(prev => prev.map(c => c.id === chat.id ? updatedChat : c));
    setActiveReactionPicker(null);

    const sender = useAppStore.getState().userProfile;
    void p2pNetwork.sendAddressed(
      p2pNetwork.peerForChat(chat.id) ?? p2pNetwork.peerForChatName(chat.name),
      encodeChatReaction({
        type: "chat-reaction",
        seq: nextFrameSeq(),
        messageId: String(msgId),
        chatId: String(chat.id),
        chatName: String(chat.name || ""),
        senderName: sender?.name || sender?.username || "User",
        emoji,
        op,
        timestamp: Date.now(),
      }),
    ).catch(() => {});
  };

  return { activeReactionPicker, setActiveReactionPicker, handleReactionMessage };
}
