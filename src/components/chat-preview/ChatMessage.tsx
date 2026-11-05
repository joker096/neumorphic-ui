import React, { useState } from "react";
import { motion, type PanInfo } from "motion/react";
import { FormattedText } from "./FormattedText";
import { ChatMessageMenu } from "./message/ChatMessageMenu";
import { useI18n } from "../../lib/i18n";
import { useServices } from "../../services";
import { AttachmentMedia } from "./AttachmentMedia";
import { MessageTimestamp } from "./MessageTimestamp";
import { ChannelCommentsRow } from "./ChannelCommentsRow";
import { BubbleActions } from "./BubbleActions";
import { ReplyQuote } from "./ReplyQuote";
import { PaymentChatBubble } from "../payments/PaymentChatBubble";
import { MessageTextBlock } from "./message/MessageTextBlock";
import { useMessageBubble } from "./message/useMessageBubble";
import { executeEditMessage } from "../../hooks/useMessageActions";
import { MessageGutterAvatar } from "./message/MessageGutterAvatar";
import { MessageDateSeparator, ExpiredMessage, MorseToggle, ForwardedLabel, ThreadRepliesChip } from "./message/MessageTextStates";
import { AlbumViewer } from "./attachments/AlbumViewer";
import { MessageEditForm } from "./message/MessageEditForm";
import { MessageFooter } from "./message/MessageFooter";
import { MessagePoll } from "./message/MessagePoll";
import { MessageInlineKeyboard } from "./message/MessageInlineKeyboard";
import { MESSAGE_SENDER_LABEL_CLASS } from "./chatPreviewClasses";
import { getSenderPaletteClass } from "../../utils/senderPalette";

interface ChatMessageProps {
  msg: any;
  isMe: boolean;
  isChannel?: boolean;
  chat: any;
  stealthMode: boolean;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  chatSavedMessages: any[];
  searchQuery: string;
  swipeReplyId: string | number | null;
  theme: "light" | "dark";
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
  onSetActivePhotoUrl: (url: string) => void;
  onSetPhotoOpen: (open: boolean) => void;
  onSetActiveMediaMsg?: (msg: any) => void;
  onSwipeReplyId: (id: string | number | null) => void;
  onSetVideoOpen: (open: boolean) => void;
  onSetShowComments: (show: boolean) => void;
  onSetActivePostId: (id: number | null) => void;
  onSetBounceMsgId: (id: string | number | null) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
  /** Casts or retracts the local vote on a poll option. */
  onPollVote?: (msgId: string | number, optionId: string) => void;
  onAction?: (action: string) => void;
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
  onRetry?: (msg: any) => void;
  /** Scrolls the list to a message id, used by the reply quote. */
  onJumpToMessage?: (id: string | number) => void;
  /** Number of replies hanging off this message (thread root chip). */
  threadReplies?: number;
  /** Opens the thread panel for this message. */
  onOpenThread?: (id: string | number) => void;
  /** Opens the album carousel viewer for multi-photo/video messages. */
  onOpenAlbum?: (msg: any) => void;
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string | number) => void;
  onSelect?: (msg: any) => void;
}

function ChatMessageImpl({
  msg, isMe, isChannel, chat, stealthMode,
  deliveryReceipts, readReceipts, chatSavedMessages, searchQuery,
  swipeReplyId, theme,
  onReply, onToggleSavedMessage,
  onSetActivePhotoUrl, onSetPhotoOpen,
  onSetActiveMediaMsg,
  onSwipeReplyId,
  onSetVideoOpen, onSetShowComments, onSetActivePostId,
  onSetBounceMsgId, onReactionMessage, onPollVote, onAction, onForward, onDelete,
  onJumpToMessage, threadReplies, onOpenThread,
  selectionMode = false, selected = false, onToggleSelect, onSelect,
  onRetry, onOpenAlbum,
}: ChatMessageProps) {
  const { t, lang } = useI18n();
  const [albumOpen, setAlbumOpen] = useState<any>(null);
  const { translate } = useServices();

  const {
    menuOpen, setMenuOpen, menuAnchorRect, openMessageMenu,
    editing, setEditing, isGroupFirst, displayName, showAvatar, isGroup,
    showSenderName, forwardedFrom, expired,
    handleBubbleClick, handleContextMenu,
    handlePointerDown, handlePointerUp, handlePointerLeave, handlePointerCancel,
    translation, translating, onTranslate,
    morseDecoded, toggleMorse, isMorse, stickerSrc, bubbleCornerClass,
    bodyText, inlineMeta,
  } = useMessageBubble({
    msg, isMe, isChannel, chat, theme, selectionMode,
    onToggleSelect, onReply, onReactionMessage, onSetBounceMsgId,
    translate, lang, t,
    hasThreads: (threadReplies ?? 0) > 0 && Boolean(onOpenThread),
  });

  // Every incoming message reserves the avatar gutter, but the avatar itself is
  // only painted on the last bubble of a run. Without the reserved column the
  // earlier bubbles start further left and the run looks ragged.
  const incomingGutter = !isChannel && !isMe;

  const startEditing = () => {
    setEditing(true);
    setMenuOpen(false);
  };

  const commitEdit = (trimmed: string) => {
    if (trimmed && trimmed !== msg.text) executeEditMessage(msg.id, trimmed, chat);
    setEditing(false);
  };

  if (msg._isDateSeparator) {
    return <MessageDateSeparator label={msg._dateLabel} />;
  }

  if (expired) {
    return <ExpiredMessage isMe={isMe} t={t} />;
  }

  const timestampNode = (
    <MessageTimestamp
      {...{ msg, isMe, stealthMode, deliveryReceipts, readReceipts }}
      onRetry={onRetry ? () => onRetry(msg) : undefined}
      inline={inlineMeta}
    />
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      drag={selectionMode ? false : "x"}
      dragConstraints={isMe ? { left: -80, right: 0 } : { left: 0, right: 80 }}
      dragElastic={0.1}
      onDragEnd={(_: unknown, info: PanInfo) => {
        if ((isMe && info.offset.x < -60) || (!isMe && info.offset.x > 60)) onReply(msg);
        onSwipeReplyId(null);
      }}
      onDrag={(_: unknown, info: PanInfo) => {
        onSwipeReplyId(isMe ? (info.offset.x < -10 ? msg.id : null) : (info.offset.x > 10 ? msg.id : null));
      }}
      className={`flex flex-col w-full group relative ${isMe ? "items-end" : "items-start"} ${msg._isLastInGroup !== false ? "mb-2" : "mb-0.5"}`}
    >
      {swipeReplyId === msg.id && (
        <div className={`absolute ${isMe ? "right-0 rounded-l-full" : "left-0 rounded-r-full"} top-2 bottom-2 w-1.5 bg-[var(--accent)] z-10`} />
      )}
      <div className={`msg-message-row flex flex-nowrap items-center relative gap-2 w-full max-w-[100%] ${incomingGutter ? "has-gutter" : ""} ${isMe ? "justify-start flex-row-reverse" : "justify-start"}`}>
        {showAvatar && (
          <MessageGutterAvatar isMe={isMe} displayName={displayName} chat={chat} />
        )}
        {incomingGutter && !showAvatar && <div className="w-8 shrink-0" aria-hidden="true" />}
        <div
          onClick={handleBubbleClick}
          onContextMenu={handleContextMenu}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
          className={`msg-bubble message max-w-[80%] md:max-w-[72%] lg:max-w-[68%] w-fit ${showAvatar ? "min-w-0" : "shrink-0"} ${msg.type === "sticker" ? "message-bare p-0" : msg.type ? "p-1.5" : "px-3 py-1.5"} text-sm leading-snug break-words relative ${bubbleCornerClass} ${selected ? "ring-2 ring-[var(--accent)]" : ""} ${isMe ? "outgoing" : ""}`}
        >
          {showSenderName && (
            <div className={`${MESSAGE_SENDER_LABEL_CLASS} ${!isMe ? getSenderPaletteClass(displayName, "label") : ""}`}>
              {displayName}
            </div>
          )}
          {msg.forwarded && <ForwardedLabel forwardedFrom={forwardedFrom} t={t} />}
          <AttachmentMedia
            msg={msg}
            isMe={isMe}
            stickerSrc={stickerSrc}
            onSetActivePhotoUrl={onSetActivePhotoUrl}
            onSetPhotoOpen={onSetPhotoOpen}
            onSetVideoOpen={onSetVideoOpen}
            onSetActiveMediaMsg={onSetActiveMediaMsg}
            onOpenAlbum={(albumData: any) => { setAlbumOpen(albumData); onOpenAlbum?.(albumData); }}
          />
          {msg.type === "payment" && <PaymentChatBubble msg={msg} />}
          {msg.type === "poll" && msg.poll && (
            <MessagePoll
              poll={msg.poll}
              onVote={onPollVote ? (optionId: string) => onPollVote(msg.id, optionId) : undefined}
            />
          )}
          {msg.replyTo && (
            <ReplyQuote
              replyTo={msg.replyTo}
              onJump={
                onJumpToMessage && msg.replyTo.id != null
                  ? () => onJumpToMessage(msg.replyTo.id)
                  : undefined
              }
            />
          )}
          {msg.text && msg.type !== "sticker" && msg.type !== "payment" && msg.type !== "story" && msg.type !== "location" && msg.type !== "article" && msg.type !== "poll" && (
            editing ? (
              <MessageEditForm
                initialText={typeof msg.text === "string" ? msg.text : ""}
                originalText={msg.text}
                t={t}
                onCommit={commitEdit}
                onCancel={() => setEditing(false)}
              />
            ) : (
            <MessageTextBlock
              msg={msg}
              text={bodyText}
              searchTerm={searchQuery}
              editedLabel={msg.edited ? t("chat.edited", "edited") : undefined}
              meta={inlineMeta ? timestampNode : undefined}
            />
            )
          )}
          {isMorse && (
            <MorseToggle decoded={morseDecoded} t={t} onToggle={toggleMorse} />
          )}
          {msg.keyboard && (
            <MessageInlineKeyboard rows={msg.keyboard} onAction={onAction} />
          )}
          {!isChannel && (threadReplies ?? 0) > 0 && onOpenThread && (
            <ThreadRepliesChip
              isMe={isMe}
              count={threadReplies ?? 0}
              t={t}
              onOpen={() => onOpenThread(msg.id)}
            />
          )}
          {msg._isLastInGroup && !inlineMeta && timestampNode}
          {isChannel && (
            <ChannelCommentsRow msg={msg} onSetActivePostId={onSetActivePostId} onSetShowComments={onSetShowComments} />
          )}
          {!isChannel && (
            <BubbleActions
              msg={msg}
              isMe={isMe}
              chat={chat}
              chatSavedMessages={chatSavedMessages}
              onReply={onReply}
              onToggleSavedMessage={onToggleSavedMessage}
              onReactionMessage={onReactionMessage}
            />
          )}
        </div>
      </div>
      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${incomingGutter ? "pl-10" : ""} max-w-full`}>
        <MessageFooter
          msg={msg}
          chat={chat}
          isMe={isMe}
          isChannel={!!isChannel}
          translation={translation}
          translating={translating}
          t={t}
          onReactionMessage={onReactionMessage}
          onAction={onAction}
        />
      </div>
      <ChatMessageMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRect={menuAnchorRect}
        title={typeof msg.text === "string" ? msg.text.slice(0, 48) : t("chat.message")}
        t={t}
        msg={msg}
        isMe={isMe}
        isChannel={!!isChannel}
        chat={chat}
        chatSavedMessages={chatSavedMessages}
        onSelect={onSelect}
        onReply={onReply}
        onToggleSavedMessage={onToggleSavedMessage}
        onForward={onForward}
        onDelete={onDelete}
        onTranslate={onTranslate}
        onEdit={isMe ? startEditing : undefined}
        onReactionMessage={onReactionMessage}
      />
      {albumOpen && (
        <AlbumViewer
          open={!!albumOpen}
          items={albumOpen?.items ?? []}
          alt={msg.text ? msg.text.slice(0, 32) : t("chat.album")}
          onClose={() => setAlbumOpen(null)}
        />
      )}
    </motion.div>
  );
}

export const ChatMessage = React.memo(ChatMessageImpl);
