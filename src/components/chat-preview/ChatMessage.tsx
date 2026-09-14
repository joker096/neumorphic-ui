import React from "react";
import { motion } from "motion/react";
import { Clock } from "lucide-react";
import { getICQStickerSrc } from "../../lib/icqEmojis";
import { FormattedText } from "./FormattedText";
import { MessageReactions } from "./MessageReactions";
import { MessageContextMenu } from "./MessageContextMenu";
import { buildMessageMenuActions } from "./messageMenuActions";
import { useI18n } from "../../lib/i18n";
import { useServices } from "../../services";
import { InlineKeyboard } from "../features/bot/InlineKeyboard";
import { toast } from "../ui/Toast";
import { getBubbleCornerClass, type GroupPosition } from "../../utils/chatUtils";
import { useMessageGestures } from "./useMessageGestures";
import { AttachmentMedia } from "./AttachmentMedia";
import { MessageTimestamp } from "./MessageTimestamp";
import { BubbleActions } from "./BubbleActions";
import { ChannelCommentsRow } from "./ChannelCommentsRow";
import { ReplyQuote } from "./ReplyQuote";
import { PaymentChatBubble } from "../payments/PaymentChatBubble";
import { isMorseCode, decodeMorse } from "../MorseDecoder";

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
  onSetActiveReactionPicker, onSwipeReplyId,
  onSetVideoOpen, onSetShowComments, onSetActivePostId,
  onSetBounceMsgId, onReactionMessage, onAction, onForward, onDelete,
  selectionMode = false, selected = false, onToggleSelect, onSelect,
  onRetry,
}: ChatMessageProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { t } = useI18n();
  const { translate } = useServices();
  const [expired, setExpired] = React.useState(
    () => typeof msg.selfDestructAt === "number" && Date.now() > (msg.selfDestructAt as number),
  );

  React.useEffect(() => {
    if (typeof msg.selfDestructAt !== "number") {
      setExpired(false);
      return;
    }
    const check = () => setExpired(Date.now() > (msg.selfDestructAt as number));
    const remaining = (msg.selfDestructAt as number) - Date.now();
    if (remaining <= 0) {
      setExpired(true);
      return;
    }
    const timer = window.setTimeout(check, Math.min(remaining + 50, 2_147_483_647));
    return () => window.clearTimeout(timer);
  }, [msg.selfDestructAt]);

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
    onOpenMenu: () => setMenuOpen(true),
  });
  const [translation, setTranslation] = React.useState<string | null>(null);
  const [translating, setTranslating] = React.useState(false);
  const [morseDecoded, setMorseDecoded] = React.useState(false);
  const isMorse = typeof msg.text === "string" && msg.type !== "sticker" && msg.type !== "payment" && msg.type !== "story" && isMorseCode(msg.text);
  const stickerSrc = React.useMemo(
    () => (msg.type === "sticker" ? getICQStickerSrc(msg.text, theme) : null),
    [msg.text, msg.type, theme],
  );
  const linkPreview = React.useMemo(() => {
    if (typeof msg.text !== "string") return null;
    const match = msg.text.match(/https?:\/\/[^\s]+/i);
    return match?.[0] ?? null;
  }, [msg.text]);
  const bubbleCornerClass = getBubbleCornerClass(msg._groupPosition as GroupPosition, isMe);

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const from = await translate.detectLang(msg.text);
      setTranslation(await translate.translate(msg.text, from, "ru"));
    } catch {
      toast(t("chat.translateNotConfigured", "Перевод не подключён"));
    } finally {
      setTranslating(false);
    }
  };

  if (msg._isDateSeparator) {
    return (
      <div className="sticky top-0 z-10 flex items-center gap-3 py-2">
        <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <span className="text-xs font-bold uppercase tracking-widest shrink-0 text-[var(--text-tertiary)]">
          {msg._dateLabel}
        </span>
        <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
      </div>
    );
  }

  if (expired) {
    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
        <div className={`flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs italic ${
          isDark ? "bg-[var(--bg-tertiary)] text-gray-500" : "bg-slate-100 text-slate-500"
        }`}>
          <Clock size={14} />
          <span>{t("chat.messageExpired", "Message expired")}</span>
        </div>
      </div>
    );
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
      onDragEnd={(_: any, info: any) => {
        if ((isMe && info.offset.x < -60) || (!isMe && info.offset.x > 60)) onReply(msg);
        onSwipeReplyId(null);
      }}
      onDrag={(_: any, info: any) => {
        onSwipeReplyId(isMe ? (info.offset.x < -10 ? msg.id : null) : (info.offset.x > 10 ? msg.id : null));
      }}
      className={`flex flex-col w-full group relative ${isMe ? "items-end" : "items-start"} ${msg._isLastInGroup !== false ? "mb-2" : "mb-0.5"}`}
    >
      {swipeReplyId === msg.id && (
        <div className={`absolute ${isMe ? "right-0 rounded-l-full" : "left-0 rounded-r-full"} top-2 bottom-2 w-1.5 bg-[var(--accent)] z-10`} />
      )}
      <div className={`flex flex-wrap items-center relative gap-2 w-full max-w-[100%] ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
        <div
          onClick={handleBubbleClick}
          onContextMenu={handleContextMenu}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerCancel={handlePointerCancel}
          className={`msg-bubble max-w-[85%] md:max-w-[80%] lg:max-w-[85%] w-fit shrink-0 ${msg.type ? "p-1.5" : "p-2.5"} text-[14px] leading-relaxed break-words relative ${bubbleCornerClass} ${selected ? "ring-2 ring-[var(--accent)]" : ""} ${
            isMe
              ? isDark
                ? "bg-[var(--accent-soft)] text-[var(--text-primary)] border border-[var(--accent-soft)] shadow-[0_2px_4px_rgba(0,0,0,0.15),_inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "bg-gradient-to-br from-[var(--accent)] to-[var(--accent2)] text-[var(--text-primary)] shadow-[0_2px_4px_rgba(249,115,22,0.2),_inset_0_1px_0_rgba(255,255,255,0.2)]"
              : isDark
                ? "bg-[var(--bg-tertiary)] text-gray-300 border border-[var(--border-color)] shadow-[0_2px_4px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "bg-white text-slate-700 border border-[var(--border-color)] shadow-[0_2px_4px_rgba(165,175,190,0.15)]"
          }`}
        >
          <AttachmentMedia
            msg={msg}
            isMe={isMe}
            isDark={isDark}
            stickerSrc={stickerSrc}
            onSetActivePhotoUrl={onSetActivePhotoUrl}
            onSetPhotoOpen={onSetPhotoOpen}
            onSetVideoOpen={onSetVideoOpen}
          />
          {msg.type === "payment" && <PaymentChatBubble msg={msg} isDark={isDark} />}
          {msg.replyTo && <ReplyQuote replyTo={msg.replyTo} isDark={isDark} />}
          {msg.text && msg.type !== "sticker" && msg.type !== "payment" && msg.type !== "story" && (
            <span className={`pb-1 block ${msg.type ? "font-medium" : ""}`}>
              <FormattedText text={morseDecoded ? decodeMorse(msg.text) : msg.text} searchTerm={searchQuery} />
            </span>
          )}
          {isMorse && (
            <button
              type="button"
              onClick={() => setMorseDecoded((v) => !v)}
               aria-label={morseDecoded ? t("chat.morseEncode", "Show Morse code") : t("chat.morseDecode", "Show text")}
               title={morseDecoded ? t("chat.morseEncode", "Show Morse code") : t("chat.morseDecode", "Show text")}
               className={`mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono tracking-wider transition-colors min-h-11 cursor-pointer ${
                isDark
                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30"
                  : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/30"
              }`}
            >
              {morseDecoded ? "••• / −−−" : t("chat.morseSample", "AБВ")}
            </button>
          )}
          {linkPreview && (
            <div className={`mt-2 p-2 rounded-xl border text-xs ${isDark ? "bg-white/5 border-[var(--border-color)] text-gray-300" : "bg-slate-50 border-[var(--border-color)] text-slate-600"}`}>
              <div className="font-bold uppercase tracking-widest text-xs opacity-70 mb-1">{t('chat.linkPreview')}</div>
              <div className="break-all line-clamp-2">{linkPreview}</div>
            </div>
          )}
          {msg.keyboard && (
            <div className="flex flex-col gap-1.5 mt-3 mb-1 w-full shrink-0">
              {msg.keyboard.map((row: any[], i: number) => (
                <div key={i} className="flex gap-1.5 w-full">
                  {row.map((btn: any, j: number) => (
                    <button
                      key={j}
                      onClick={() => { if (onAction) onAction(btn.action || btn.text); }}
                                             className={`flex-1 min-h-11 flex items-center justify-center rounded-lg text-xs font-bold transition-all active:scale-95 ${isDark ? "bg-[#2a2d36] hover:bg-[#343842] text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-[var(--bg-primary)] hover:bg-slate-200 text-slate-700 border border-[var(--border-color)]"}`}
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
        {!isChannel && (
          <BubbleActions
            msg={msg}
            isMe={isMe}
            isDark={isDark}
            chat={chat}
            chatSavedMessages={chatSavedMessages}
            onReply={onReply}
            onToggleSavedMessage={onToggleSavedMessage}
          />
        )}
        <MessageReactions
          msg={msg}
          isMe={isMe}
          isDark={isDark}
          activeReactionPicker={activeReactionPicker}
          onSetActiveReactionPicker={onSetActiveReactionPicker}
          onReactionMessage={onReactionMessage}
        />
        {translating && (
          <div className={`mt-1 text-xs italic ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            {t("chat.translating", "Перевод…")}
          </div>
        )}
        {translation && !translating && (
          <div className={`mt-1 text-xs italic ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            {translation}
          </div>
        )}
        {Array.isArray(msg.inlineKeyboard) && msg.inlineKeyboard.length > 0 && (
          <InlineKeyboard
            botId={chat.botId ?? String(chat.id)}
            messageId={String(msg.id)}
            isDark={isDark}
            rows={msg.inlineKeyboard}
          />
        )}
      </div>
      <MessageContextMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
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
          onTranslate: handleTranslate,
        })}
      />
    </motion.div>
  );
}

export const ChatMessage = React.memo(ChatMessageImpl);
