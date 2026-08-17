import React, { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BellOff, Bookmark, Check, CheckCheck, Play,
} from "lucide-react";
import { getICQStickerSrc } from "../../lib/icqEmojis";
import { FormattedText } from "./FormattedText";
import { Tooltip } from "../Tooltip";
import { VoiceWaveform } from "./VoiceWaveform";
import { MessageReactions } from "./MessageReactions";
import { MessageContextMenu } from "./MessageContextMenu";
import { buildMessageMenuActions } from "./messageMenuActions";
import { useI18n } from "../../lib/i18n";
import { useServices } from "../../services";
import { InlineKeyboard } from "../features/bot/InlineKeyboard";
import { toast } from "../ui/Toast";
import { decodeIfMorse } from "../MorseDecoder";
import { fuzzTime, getBubbleCornerClass, type GroupPosition } from "../../utils/chatUtils";

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
}: ChatMessageProps) {
  const lastTapRef = useRef<{ time: number; msgId: string | number }>({ time: 0, msgId: 0 });
  const longPressTimer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { t } = useI18n();
  const { translate } = useServices();
  const [translation, setTranslation] = React.useState<string | null>(null);
  const [translating, setTranslating] = React.useState(false);
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
        <span className={`text-[11px] font-bold uppercase tracking-widest shrink-0 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
          {msg._dateLabel}
        </span>
        <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: 1, y: 0, scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      drag={!isMe ? "x" : false}
      dragConstraints={!isMe ? { left: 0, right: 80 } : undefined}
      dragElastic={!isMe ? 0.1 : undefined}
      onDragEnd={!isMe ? (_: any, info: any) => {
        if (info.offset.x > 60) onReply(msg);
        onSwipeReplyId(null);
      } : undefined}
      onDrag={!isMe ? (_: any, info: any) => {
        onSwipeReplyId(info.offset.x > 10 ? msg.id : null);
      } : undefined}
      className={`flex flex-col w-full group relative ${isMe ? "items-end" : "items-start"} ${msg._isLastInGroup !== false ? "mb-4" : "mb-1"}`}
    >
      {!isMe && swipeReplyId === msg.id && (
        <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-blue-500 z-10" />
      )}
      <div className={`flex items-center relative gap-2 max-w-[100%] ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
        <div
          onClick={() => {
            if (selectionMode) {
              onToggleSelect?.(msg.id);
              return;
            }
            if (longPressed.current) {
              longPressed.current = false;
              return;
            }
            const now = Date.now();
            if (now - lastTapRef.current.time < 300 && lastTapRef.current.msgId === msg.id) {
              onReactionMessage(msg.id, '👍');
              onSetBounceMsgId(msg.id);
              setTimeout(() => onSetBounceMsgId(null), 300);
              lastTapRef.current = { time: 0, msgId: 0 };
            } else {
              lastTapRef.current = { time: now, msgId: msg.id };
            }
          }}
          onContextMenu={(e) => {
            if (selectionMode) return;
            e.preventDefault();
            setMenuOpen(true);
          }}
          onPointerDown={() => {
            if (selectionMode) return;
            longPressed.current = false;
            if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
            longPressTimer.current = window.setTimeout(() => {
              longPressed.current = true;
              setMenuOpen(true);
            }, 480);
          }}
          onPointerUp={() => {
            if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
          }}
          onPointerLeave={() => {
            if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
          }}
          onPointerCancel={() => {
            if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
          }}
          className={`w-full max-w-full md:max-w-[80%] lg:max-w-[85%] ${msg.type ? "p-2" : "p-3.5"} text-[14px] leading-relaxed break-words relative ${bubbleCornerClass} ${selected ? "ring-2 ring-orange-500" : ""} ${
            isMe
              ? isDark
                ? "bg-orange-600/20 text-orange-50 border border-orange-500/30 shadow-[0_2px_4px_rgba(0,0,0,0.15),_inset_0_1px_0_rgba(255,255,255,0.08)]"
                : "bg-gradient-to-br from-orange-400 to-orange-500 text-[var(--text-primary)] shadow-[0_2px_4px_rgba(249,115,22,0.2),_inset_0_1px_0_rgba(255,255,255,0.2)]"
              : isDark
                ? "bg-[var(--bg-tertiary)] text-gray-300 border border-[var(--border-color)] shadow-[0_2px_4px_rgba(0,0,0,0.2),_inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "bg-white text-slate-700 border border-[var(--border-color)] shadow-[0_2px_4px_rgba(165,175,190,0.15)]"
          }`}
        >
          {msg.type === "image" && (
            <div
              className="rounded-xl overflow-hidden mb-1 relative border border-[var(--border-color)] cursor-pointer"
              onClick={() => { onSetActivePhotoUrl(msg.attachment || msg.url); onSetPhotoOpen(true); }}
            >
              <img src={msg.attachment || msg.url} alt={msg.text ? `Shared image: ${msg.text}` : "Shared image"} className="w-full h-auto object-cover max-h-[240px] sm:max-h-[280px] md:max-h-[320px]" />
            </div>
          )}
          {msg.type === "video" && (
            <div
              className="rounded-[14px] overflow-hidden mb-1 relative border border-[var(--border-color)] group cursor-pointer"
              onClick={() => onSetVideoOpen(true)}
            >
              <img src={msg.thumb} alt="Video thumbnail" className="w-full h-auto sm:w-[180px] sm:h-[100px] md:w-[200px] md:h-[120px] object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg transition-transform">
                  <Play size={20} className="text-[var(--text-primary)] fill-white ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-[var(--text-primary)] tracking-wider">{msg.duration}</div>
            </div>
          )}
          {msg.type === "audio" && (
            <VoiceWaveform duration={msg.duration} isMe={isMe} isDark={isDark} audioUrl={msg.audioUrl} />
          )}
          {msg.type === "sticker" && (
            <div className="flex items-center justify-center">
              {stickerSrc ? (
                <img src={stickerSrc} alt="Sticker" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" loading="eager" decoding="async" />
              ) : (
                <span className="text-4xl">{msg.text}</span>
              )}
            </div>
          )}
          {msg.type === "image" && (
            <div className={`mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${isDark ? "bg-white/5 text-gray-400" : "bg-black/5 text-slate-500"}`}>
              <span>{t('chat.filters.photo')}</span>
              {msg.attachment && <span className="opacity-70">{t('chat.filters.ready')}</span>}
            </div>
          )}
          {msg.replyTo && (
            <div className={`mb-2 px-3 py-2 rounded-xl border-l-2 text-[12px] ${isDark ? "bg-white/5 border-orange-400 text-gray-300" : "bg-black/5 border-orange-500 text-slate-600"}`}>
              <div className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">
                {t('chat.replyingTo')} {msg.replyTo.sender === "me" ? t('chat.yourMessage') : msg.replyTo.sender}
              </div>
               <div className="line-clamp-2">
                 {msg.replyTo.text ? (
                   decodeIfMorse(msg.replyTo.text)
                 ) : msg.replyTo.type === "audio" ? (
                   `${t('chat.voiceNote')}${msg.replyTo.duration || ""}`
                 ) : (
                   t('chat.attachment')
                 )}
               </div>
            </div>
          )}
          {msg.text && msg.type !== "sticker" && (
            <span className={`px-2 pb-1 block ${msg.type ? "font-medium" : ""}`}>
              <FormattedText text={msg.text} searchTerm={searchQuery} />
            </span>
          )}
          {linkPreview && (
            <div className={`mt-2 p-2 rounded-xl border text-[11px] ${isDark ? "bg-white/5 border-[var(--border-color)] text-gray-300" : "bg-slate-50 border-[var(--border-color)] text-slate-600"}`}>
              <div className="font-bold uppercase tracking-widest text-[9px] opacity-70 mb-1">{t('chat.linkPreview')}</div>
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
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${isDark ? "bg-[#2a2d36] hover:bg-[#343842] text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-[var(--bg-primary)] hover:bg-slate-200 text-slate-700 border border-[var(--border-color)]"}`}
                    >
                      {btn.text}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
          {msg._isLastInGroup && (
            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-70 ${isMe && !isDark ? "text-orange-100" : ""} ${msg.type ? "px-2" : ""}`}>
              {msg.silent && <BellOff size={10} className="mr-0.5 opacity-60" />}
              {stealthMode ? fuzzTime(msg.time, msg.id) : msg.time}
              {isMe && (
                <span className="inline-flex items-center">
                  <AnimatePresence mode="wait">
                    {(!deliveryReceipts || msg.status === 'sent') && (
                      <motion.span key="sent" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                        <Check size={12} strokeWidth={2.5} />
                      </motion.span>
                    )}
                    {deliveryReceipts && msg.status === 'delivered' && (
                      <motion.span key="delivered" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                        <CheckCheck size={12} strokeWidth={2.5} />
                      </motion.span>
                    )}
                    {deliveryReceipts && readReceipts && msg.status === 'read' && (
                      <motion.span key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                        <CheckCheck size={12} strokeWidth={2.5} className={isDark ? 'text-blue-400' : 'text-blue-500'} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
              )}
            </div>
          )}
          {msg._isLastInGroup && (
            <div className={`mt-1.5 flex items-center gap-1.5 sm:gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isChannel && (
                <button onClick={() => onReply(msg)} className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors ${isDark ? "text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-black/5"}`}>
                  {t('chat.reply')}
                </button>
              )}
              {!isChannel && (
                <button onClick={() => onToggleSavedMessage(chat, msg)} className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors flex items-center gap-1 ${isDark ? "text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5" : "text-slate-500 hover:text-slate-800 hover:bg-black/5"}`}>
                  <Bookmark size={10} />
                  {chatSavedMessages.some((saved: any) => saved.messageId === msg.id) ? t('chat.saved') : t('chat.save')}
                </button>
              )}
            </div>
          )}
          {isChannel && (
            <div
              className={`flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-[var(--text-primary)]" : "hover:bg-black/5 text-slate-500 hover:text-slate-800"} transition-colors max-w-full`}
              onClick={() => { onSetActivePostId(msg.id); onSetShowComments(true); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span className="text-[11px] font-medium tracking-wide">
                {msg.id === 402 ? t('channelComments.replies', { count: 45 }) : t('channelComments.leaveAComment')}
              </span>
            </div>
          )}
        </div>
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




