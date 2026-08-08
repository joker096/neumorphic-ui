import React from "react";
import { VirtualizedMessageList } from "./chat/VirtualizedMessageList";
import { ChatMessage } from "./chat-preview/ChatMessage";

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
  onSetActiveReactionPicker: (id: string | number | null) => void;
  onSwipeReplyId: (id: string | number | null) => void;
  onSetVideoOpen: (open: boolean) => void;
  onSetShowComments: (show: boolean) => void;
  onSetActivePostId: (id: number | null) => void;
  onSetBounceMsgId: (id: string | number | null) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
  onAction?: (action: string) => void;
  onScrollPosition: (nearBottom: boolean) => void;
}

export function ChatMessageList({
  msgListRef, flatItems, isNearBottom, isDark, chat, stealthMode,
  deliveryReceipts, readReceipts, chatSavedMessages, searchQuery,
  swipeReplyId, activeReactionPicker, theme,
  onReply, onToggleSavedMessage, onSetActivePhotoUrl, onSetPhotoOpen,
  onSetActiveReactionPicker, onSwipeReplyId, onSetVideoOpen, onSetShowComments,
  onSetActivePostId, onSetBounceMsgId, onReactionMessage, onAction,
  onScrollPosition,
}: ChatMessageListProps) {
  return (
    <VirtualizedMessageList
      ref={msgListRef}
      items={flatItems}
      estimateSize={72}
      overscan={3}
      isDark={isDark}
      className="p-4 sm:p-6"
      stickToBottom={isNearBottom}
      onScrollPosition={onScrollPosition}
    >
      {(msg: any) => (
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
          onSetActiveReactionPicker={onSetActiveReactionPicker}
          onSwipeReplyId={onSwipeReplyId}
          onSetVideoOpen={onSetVideoOpen}
          onSetShowComments={onSetShowComments}
          onSetActivePostId={onSetActivePostId}
          onSetBounceMsgId={onSetBounceMsgId}
          onReactionMessage={onReactionMessage}
          onAction={onAction}
        />
      )}
    </VirtualizedMessageList>
  );
}