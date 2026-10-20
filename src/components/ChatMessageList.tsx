import React from "react";
import { VirtualizedMessageList } from "./chat/VirtualizedMessageList";
import { ChatMessage } from "./chat-preview/ChatMessage";
import { UnreadDivider } from "./chat-preview/message/UnreadDivider";
import { useI18n } from "../lib/i18n";
import { insertUnreadDivider, unreadDividerIndex } from "../utils/unreadDivider";

interface ChatMessageListProps {
  msgListRef: React.RefObject<any>;
  flatItems: any[];
  isNearBottom: boolean;
  isDark: boolean;
  chat: any;
  stealthMode: boolean;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  chatSavedMessages: any[];
  searchQuery: string;
  swipeReplyId: string | number | null;
  activeReactionPicker: string | number | null;
  theme: "light" | "dark";
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
  onSetActivePhotoUrl: (url: string) => void;
  onSetPhotoOpen: (open: boolean) => void;
  onSetActiveMediaMsg?: (msg: any) => void;
  onSetActiveReactionPicker: (id: string | number | null) => void;
  onSwipeReplyId: (id: string | number | null) => void;
  onSetVideoOpen: (open: boolean) => void;
  onSetShowComments: (show: boolean) => void;
  onSetActivePostId: (id: number | null) => void;
  onSetBounceMsgId: (id: string | number | null) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
  onAction?: (action: string) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
  onRetry?: (msg: any) => void;
  onJumpToMessage?: (id: string | number) => void;
  /** Thread reply count per message id (0 when the message has no replies). */
  threadCountOf?: (id: string | number | null | undefined) => number;
  /** Opens the reply-thread panel for a message id. */
  onOpenThread?: (id: string | number) => void;
  selectionMode?: boolean;
  selectedIds?: Set<string | number>;
  onToggleSelect?: (id: string | number) => void;
  onSelect?: (msg: any) => void;
  onScrollPosition: (nearBottom: boolean) => void;
}

export function ChatMessageList({
  msgListRef, flatItems, isNearBottom, isDark, chat, stealthMode,
  deliveryReceipts, readReceipts, chatSavedMessages, searchQuery,
  swipeReplyId, activeReactionPicker, theme,
  onReply, onToggleSavedMessage, onSetActivePhotoUrl, onSetPhotoOpen,
  onSetActiveMediaMsg,
  onSetActiveReactionPicker, onSwipeReplyId, onSetVideoOpen, onSetShowComments,
  onSetActivePostId,   onSetBounceMsgId, onReactionMessage, onAction, onForward, onDelete,
  onJumpToMessage, threadCountOf, onOpenThread,
  selectionMode, selectedIds, onToggleSelect, onSelect,
  onScrollPosition,
  onRetry,
}: ChatMessageListProps) {
  const { t } = useI18n();
  // `chat.unread` is cleared in the store when the chat opens, but the preview
  // renders the chat snapshot captured at that moment, so the divider stays
  // where Telegram puts it for the rest of the session.
  const items = React.useMemo(
    () => insertUnreadDivider(flatItems, chat?.unread || 0),
    [flatItems, chat?.unread],
  );
  const dividerIndex = unreadDividerIndex(items);
  const anchoredChatRef = React.useRef<any>(null);

  // Open the conversation at the first unread message instead of the bottom.
  // Runs after the list's own stick-to-bottom frame (parent effect → last rAF),
  // so it wins on the initial paint of a chat with unread history.
  React.useEffect(() => {
    if (dividerIndex < 0 || searchQuery || selectionMode) return;
    if (anchoredChatRef.current === chat?.id) return;
    anchoredChatRef.current = chat?.id;
    const frame = window.requestAnimationFrame(() => {
      msgListRef.current?.scrollToIndex?.(dividerIndex, "center");
    });
    return () => window.cancelAnimationFrame(frame);
  }, [dividerIndex, chat?.id, searchQuery, selectionMode, msgListRef]);

  return (
    <VirtualizedMessageList
      ref={msgListRef}
      items={items}
      estimateSize={72}
      overscan={3}
      isDark={isDark}
      className="p-[var(--message-list-pad,1rem)] sm:p-[var(--message-list-pad-sm,1.5rem)]"
      stickToBottom={isNearBottom}
      onScrollPosition={onScrollPosition}
    >
      {(msg: any) =>
        msg._isUnreadDivider ? (
          <UnreadDivider label={t("chat.unreadMessages", "Unread messages")} />
        ) : (
        <ChatMessage
          msg={msg}
          isMe={msg.sender === "me"}
          isDark={isDark}
          isChannel={chat.isChannel}
          chat={chat}
          stealthMode={stealthMode}
          deliveryReceipts={deliveryReceipts}
          readReceipts={readReceipts}
          chatSavedMessages={chatSavedMessages}
          searchQuery={searchQuery}
          swipeReplyId={swipeReplyId}
          activeReactionPicker={activeReactionPicker}
          theme={theme}
          onReply={(m) => onReply?.(m)}
          onToggleSavedMessage={(c, m) => onToggleSavedMessage?.(c, m)}
          onSetActivePhotoUrl={onSetActivePhotoUrl}
          onSetPhotoOpen={onSetPhotoOpen}
          onSetActiveMediaMsg={onSetActiveMediaMsg}
          onSetActiveReactionPicker={onSetActiveReactionPicker}
          onSwipeReplyId={onSwipeReplyId}
          onSetVideoOpen={onSetVideoOpen}
          onSetShowComments={onSetShowComments}
          onSetActivePostId={onSetActivePostId}
          onSetBounceMsgId={onSetBounceMsgId}
          onReactionMessage={onReactionMessage}
          onAction={onAction}
          onForward={onForward}
          onDelete={onDelete}
          onRetry={onRetry}
          onJumpToMessage={onJumpToMessage}
          threadReplies={threadCountOf ? threadCountOf(msg.id) : 0}
          onOpenThread={onOpenThread}
          selectionMode={selectionMode}
          selected={selectedIds ? selectedIds.has(msg.id) : false}
          onToggleSelect={onToggleSelect}
          onSelect={onSelect}
        />
        )
      }
    </VirtualizedMessageList>
  );
}