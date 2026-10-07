import React from "react";
import { motion, type PanInfo } from "motion/react";
import { getICQStickerSrc } from "../../lib/icqEmojis";
import { FormattedText } from "./FormattedText";
import { MessageContextMenu } from "./MessageContextMenu";
import { buildMessageMenuActions } from "./messageMenuActions";
import { useI18n } from "../../lib/i18n";
import { useServices } from "../../services";
import { getBubbleCornerClass, type GroupPosition } from "../../utils/chatUtils";
import { useMessageGestures } from "./useMessageGestures";
import type { MenuAnchorRect } from "./menuPosition";
import { AttachmentMedia } from "./AttachmentMedia";
import { MessageTimestamp } from "./MessageTimestamp";
import { ChannelCommentsRow } from "./ChannelCommentsRow";
import { ReplyQuote } from "./ReplyQuote";
import { PaymentChatBubble } from "../payments/PaymentChatBubble";
import { isMorseCode, decodeMorse } from "../MorseDecoder";
import { executeEditMessage } from "../../hooks/useMessageActions";
import { MessageGutterAvatar } from "./message/MessageGutterAvatar";
import { MessageDateSeparator, ExpiredMessage, MorseToggle } from "./message/MessageTextStates";
import { MessageEditForm } from "./message/MessageEditForm";
import { MessageFooter } from "./message/MessageFooter";
import { useSelfDestructExpiry, useMessageTranslation, useMorseToggle } from "./message/useMessageChrome";

interface ChatMessageProps {
  msg: any;
  isMe: boolean;
  isDark: boolean;
  isChannel?: boolean;
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
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string | number) => void;
  onSelect?: (msg: any) => void;
}

function ChatMessageImpl({
  msg, isMe, isDark, isChannel, chat, stealthMode,
  deliveryReceipts, readReceipts, chatSavedMessages, searchQuery,
  swipeReplyId, activeReactionPicker, theme,
  onReply, onToggleSavedMessage,
  onSetActivePhotoUrl, onSetPhotoOpen,
  onSetActiveMediaMsg,
  onSetActiveReactionPicker, onSwipeReplyId,
  onSetVideoOpen, onSetShowComments, onSetActivePostId,
  onSetBounceMsgId, onReactionMessage, onAction, onForward, onDelete,
  selectionMode = false, selected = false, onToggleSelect, onSelect,
  onRetry,
}: ChatMessageProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [menuAnchorRect, setMenuAnchorRect] = React.useState<MenuAnchorRect | null>(null);
  const openMessageMenu = React.useCallback((anchorRect: MenuAnchorRect | null) => {
    setMenuAnchorRect(anchorRect);
    setMenuOpen(true);
  }, []);
  const [editing, setEditing] = React.useState(false);
  const { t, lang } = useI18n();
  const { translate } = useServices();
  const isGroupFirst =
    msg._groupPosition === "first" || msg._groupPosition === "single";
  const displayName = String(msg.sender || chat?.name || "");
  const showAvatar = !isChannel;
  // Avatars live in the outer gutter for every non-channel message, so identity
  // stays readable for media, stickers and edits too — not just plain text.
  const isGroup = chat?.type === "group" || Array.isArray(chat?.members);
  const showSenderName = showAvatar && isGroup && isGroupFirst && !isMe && !!displayName;
  const expired = useSelfDestructExpiry(msg.selfDestructAt as number | undefined);

  const {
    handleBubbleClick,
    handleContextMenu,
    handlePointerDown,
    handlePointerUp,
    handlePointerLeave,
    handlePointerCancel,
  } = useMessageGestures({
    msgId: msg.id,
    selectionMode,
    onToggleSelect,
    onReply,
    onReactionMessage,
    onSetBounceMsgId,
    onOpenMenu: openMessageMenu,
  });
  const { translation, translating, onTranslate } = useMessageTranslation({
    translate, text: String(msg.text ?? ''), lang, t,
  });
  const [morseDecoded, toggleMorse] = useMorseToggle();
  const isMorse = typeof msg.text === "string" && msg.type !== "sticker" && msg.type !== "payment" && msg.type !== "story" && msg.type !== "location" && msg.type !== "article" && isMorseCode(msg.text);
  const stickerSrc = React.useMemo(
    () => (msg.type === "sticker" ? getICQStickerSrc(msg.text, theme) : null),
    [msg.text, msg.type, theme],
  );
  const bubbleCornerClass = getBubbleCornerClass(msg._groupPosition as GroupPosition, isMe);

  const startEditing = () => {
    setEditing(true);
    setMenuOpen(false);
  };

  const commitEdit = (trimmed: string) => {
    if (trimmed && trimmed !== msg.text) executeEditMessage(msg.id, trimmed, chat);
    setEditing(false);
  };

  if (msg._isDateSeparator) {
    return <MessageDateSeparator isDark={isDark} label={msg._dateLabel} />;
  }

  if (expired) {
    return <ExpiredMessage isMe={isMe} isDark={isDark} t={t} />;
  }

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
      <div className={`msg-message-row flex flex-nowrap items-center relative gap-2 w-full max-w-[100%] ${showAvatar ? "has-gutter" : ""} ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
        {showAvatar && (
          <MessageGutterAvatar isMe={isMe} displayName={displayName} chat={chat} />
        )}
        <div
          onClick={handleBubbleClick}
          onContextMenu={handleContextMenu}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
          className={`msg-bubble message max-w-[85%] md:max-w-[80%] lg:max-w-[85%] w-fit ${showAvatar ? "min-w-0" : "shrink-0"} ${msg.type ? "p-1.5" : "p-2.5"} text-[14px] leading-relaxed break-words relative ${bubbleCornerClass} ${selected ? "ring-2 ring-[var(--accent)]" : ""} ${isMe ? "outgoing" : ""}`}
        >
          {showSenderName && (
            <div className="mb-1 text-[12px] font-semibold leading-tight text-[var(--accent)]">
              {displayName}
            </div>
          )}
          <AttachmentMedia
            msg={msg}
            isMe={isMe}
            isDark={isDark}
            stickerSrc={stickerSrc}
            onSetActivePhotoUrl={onSetActivePhotoUrl}
            onSetPhotoOpen={onSetPhotoOpen}
            onSetVideoOpen={onSetVideoOpen}
            onSetActiveMediaMsg={onSetActiveMediaMsg}
          />
          {msg.type === "payment" && <PaymentChatBubble msg={msg} isDark={isDark} />}
          {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} isDark={isDark} />}
          {msg.text && msg.type !== "sticker" && msg.type !== "payment" && msg.type !== "story" && msg.type !== "location" && msg.type !== "article" && (
            editing ? (
              <MessageEditForm
                initialText={typeof msg.text === "string" ? msg.text : ""}
                originalText={msg.text}
                t={t}
                onCommit={commitEdit}
                onCancel={() => setEditing(false)}
              />
            ) : (
            <span className={`pb-1 block ${msg.type ? "font-medium" : ""}`}>
              <FormattedText text={morseDecoded ? decodeMorse(msg.text) : msg.text} searchTerm={searchQuery} />
              {msg.edited && (
                <span className={`ml-1 align-middle text-[11px] uppercase tracking-wide ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>
                  {t("chat.edited", "edited")}
                </span>
              )}
            </span>
            )
          )}
          {isMorse && (
            <MorseToggle decoded={morseDecoded} isDark={isDark} t={t} onToggle={toggleMorse} />
          )}
          {msg.keyboard && (
            <div className="flex flex-col gap-1.5 mt-3 mb-1 w-full shrink-0">
              {msg.keyboard.map((row: any[], i: number) => (
                <div key={i} className="flex gap-1.5 w-full">
                  {row.map((btn: any, j: number) => (
                    <button
                      key={j}
                      onClick={() => { if (onAction) onAction(btn.action || btn.text); }}
                                             className={`flex-1 min-h-11 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95 ${isDark ? "bg-[var(--bg-tertiary)] hover:bg-[var(--hover-bg-dark)] text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-[var(--bg-primary)] hover:bg-black/10 text-[var(--text-secondary)] border border-[var(--border-color)]"}`}
                    >
                      {btn.text}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
          {msg._isLastInGroup && (
            <MessageTimestamp
              msg={msg}
              isMe={isMe}
              isDark={isDark}
              stealthMode={stealthMode}
              deliveryReceipts={deliveryReceipts}
              readReceipts={readReceipts}
              onRetry={onRetry ? () => onRetry(msg) : undefined}
            />
          )}
          {isChannel && (
            <ChannelCommentsRow
              msg={msg}
              isDark={isDark}
              onSetActivePostId={onSetActivePostId}
              onSetShowComments={onSetShowComments}
            />
          )}
        </div>
        <MessageFooter
          msg={msg}
          chat={chat}
          isMe={isMe}
          isDark={isDark}
          isChannel={!!isChannel}
          chatSavedMessages={chatSavedMessages}
          activeReactionPicker={activeReactionPicker}
          translation={translation}
          translating={translating}
          t={t}
          onReply={onReply}
          onToggleSavedMessage={onToggleSavedMessage}
          onSetActiveReactionPicker={onSetActiveReactionPicker}
          onReactionMessage={onReactionMessage}
          onAction={onAction}
        />
      </div>
      <MessageContextMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRect={menuAnchorRect}
        title={typeof msg.text === "string" ? msg.text.slice(0, 48) : t("chat.message")}
        isDark={isDark}
        actions={buildMessageMenuActions({
          msg,
          isMe,
          t,
          isChannel: !!isChannel,
          chat,
          chatSavedMessages,
          onSelect,
          onReply,
          onToggleSavedMessage,
          onForward,
          onDelete,
          onTranslate,
          onEdit: isMe ? startEditing : undefined,
        })}
      />
    </motion.div>
  );
}

export const ChatMessage = React.memo(ChatMessageImpl);
