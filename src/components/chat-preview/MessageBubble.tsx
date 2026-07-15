/**
 * Individual message bubble component with reactions, attachments, and metadata
 * Extracted from ChatPreviewLayer.tsx
 */
import React from "react";
import { motion } from "motion/react";
import { Check, CheckCheck, BellOff, Play } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { FormattedText } from "./FormattedText";
import { VoiceWaveform } from "./VoiceWaveform";
import { getICQStickerSrc } from "../../lib/icqEmojis";
import { encodeMorse } from "./MorseDecoder";
import { useI18n } from "../../lib/i18n";

export type GroupPosition = "single" | "first" | "middle" | "last";

export interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  groupPosition: GroupPosition;
  deliveryReceipts: boolean;
  readReceipts: boolean;
  searchQuery: string;
  swipeReplyId: string | number | null;
  setSwipeReplyId: (id: string | number | null) => void;
  lastTapRef: React.RefObject<{ time: number; msgId: string | number }>;
  handleReactionMessage: (msgId: string | number, emoji: string) => void;
  bounceMsgId: string | number | null;
  setBounceMsgId: (id: string | number | null) => void;
  setActiveReactionPicker: (id: string | number | null) => void;
  activeReactionPicker: string | number | null;
  onReply?: (message: any) => void;
  onToggleSavedMessage?: (chat: any, message: any) => void;
  savedMessages?: any[];
  chat: any;
  onAttachImage?: (message: any) => void;
  setActivePhotoUrl: (url: string | null) => void;
  setVideoOpen: (v: boolean) => void;
  setActivePostId: (id: number | null) => void;
  setShowComments: (v: boolean) => void;
  fuzzTime: (timeStr: string, id: number) => string;
  setActiveVideo: (v: boolean) => void;
  setActivePhoto: (v: boolean) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({
  msg,
  isMe,
  groupPosition,
  deliveryReceipts,
  readReceipts,
  searchQuery,
  swipeReplyId,
  setSwipeReplyId,
  lastTapRef,
  handleReactionMessage,
  bounceMsgId,
  setBounceMsgId,
  setActiveReactionPicker,
  activeReactionPicker,
  onReply,
  onToggleSavedMessage,
  savedMessages = [],
  chat,
  setActivePhotoUrl,
  setVideoOpen,
  setActivePostId,
  setShowComments,
  fuzzTime,
}) => {
  const { t } = useI18n();
  const stickerSrc = msg.type === "sticker" ? getICQStickerSrc(msg.text, "light") : null;
  const gp = groupPosition as GroupPosition;

  const bubbleCornerClass = (() => {
    if (isMe) {
      if (gp === "single") return "rounded-md rounded-br-sm";
      if (gp === "first") return "rounded-t-xl rounded-bl-xl rounded-br-xl rounded-bl-sm";
      if (gp === "middle") return "rounded-l-xl rounded-r-xl rounded-br-xl rounded-bl-xl";
      if (gp === "last") return "rounded-tl-xl rounded-tr-xl rounded-br-sm rounded-bl-xl";
      return "rounded-md rounded-br-sm";
    } else {
      if (gp === "single") return "rounded-md rounded-bl-sm";
      if (gp === "first") return "rounded-t-xl rounded-br-xl rounded-br-sm rounded-bl-xl";
      if (gp === "middle") return "rounded-r-xl rounded-l-xl rounded-bl-xl rounded-br-xl";
      if (gp === "last") return "rounded-tr-xl rounded-tl-xl rounded-bl-sm rounded-br-xl";
      return "rounded-md rounded-bl-sm";
    }
  })();

  return (
    <motion.div
      layout
      key={msg.id}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: bounceMsgId === msg.id ? [1, 0.95, 1.05, 1] : 1,
        x: !isMe && swipeReplyId === msg.id ? 40 : 0,
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      drag={!isMe ? "x" : false}
      dragConstraints={!isMe ? { left: 0, right: 80 } : undefined}
      dragElastic={!isMe ? 0.1 : undefined}
      onDragEnd={!isMe ? (_: any, info: any) => {
        if (info.offset.x > 60) {
          onReply?.(msg);
        }
        setSwipeReplyId(null);
      } : undefined}
      onDrag={!isMe ? (_: any, info: any) => {
        if (info.offset.x > 10) setSwipeReplyId(msg.id);
        else setSwipeReplyId(null);
      } : undefined}
      className={`flex flex-col w-full group relative ${isMe ? "items-end" : "items-start"} ${msg._isLastInGroup !== false ? "mb-4" : "mb-1"}`}
    >
      {/* Reply swipe indicator */}
      {!isMe && swipeReplyId === msg.id && (
        <div className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-blue-500 z-10" />
      )}

      <div className={`flex items-center relative gap-2 max-w-[100%] ${isMe ? "justify-end flex-row-reverse" : "justify-start"}`}>
        <div
          onClick={() => {
            const now = Date.now();
            if (now - lastTapRef.current.time < 300 && lastTapRef.current.msgId === msg.id) {
              handleReactionMessage(msg.id, "\uD83D\uFE0F");
              setBounceMsgId(msg.id);
              setTimeout(() => setBounceMsgId(null), 300);
              lastTapRef.current = { time: 0, msgId: 0 };
            } else {
              lastTapRef.current = { time: now, msgId: msg.id };
            }
          }}
          className={`w-full max-w-full md:max-w-[80%] lg:max-w-[85%] ${msg.type ? "p-2" : "p-3.5"} text-[14px] leading-relaxed break-words relative ${bubbleCornerClass} ${isMe ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-[0_2px_4px_rgba(249,115,22,0.2),_inset_0_1px_0_rgba(255,255,255,0.2)]" : "bg-[var(--bg-secondary)] text-[--text-primary] border border-[var(--border-color)] shadow-[0_2px_4px_rgba(165,175,190,0.15)]"}`}
        >
          {/* Image attachment */}
          {msg.type === "image" && (
            <div className="rounded-md overflow-hidden mb-1 relative border border-[var(--border-color)] cursor-pointer" onClick={() => setActivePhotoUrl(msg.attachment || msg.url)}>
              <img src={msg.attachment || msg.url} alt="Shared" className="w-full h-auto object-cover max-h-[240px] sm:max-h-[280px] md:max-h-[320px]" loading="lazy" decoding="async" />
            </div>
          )}

          {/* Video attachment */}
          {msg.type === "video" && (
            <div className="rounded-[14px] overflow-hidden mb-1 relative border border-white/10 group cursor-pointer" onClick={() => setVideoOpen(true)}>
              <img src={msg.thumb} alt="Video thumbnail" className="w-full h-auto sm:w-[180px] sm:h-[100px] md:w-[200px] md:h-[120px] object-cover opacity-80" loading="lazy" decoding="async" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[--bg-secondary]/20 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play size={20} className="text-[--text-primary] fill-[--text-primary] ml-1" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-[--bg-elevated]/50 backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold text-[--text-primary] tracking-wider">
                {msg.duration}
              </div>
            </div>
          )}

          {/* Audio attachment */}
          {msg.type === "audio" && <VoiceWaveform duration={msg.duration} isMe={isMe} audioUrl={msg.audioUrl} />}

          {/* Sticker */}
          {msg.type === "sticker" && (
            <div className="flex items-center justify-center">
              {stickerSrc ? (
                <img src={stickerSrc} alt="Sticker" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" loading="lazy" decoding="async" />
              ) : (
                <span className="text-4xl">{msg.text}</span>
              )}
            </div>
          )}

          {/* Photo label */}
          {msg.type === "image" && (
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-[--bg-tertiary]/5 text-[--text-secondary]">
              <span>{t("chat.filters.photo")}</span>
              {msg.attachment && <span className="opacity-70">{t("chat.filters.ready")}</span>}
            </div>
          )}

          {/* Reply to */}
          {msg.replyTo && (
            <div className="mb-2 px-3 py-2 rounded-md border-l-2 text-[12px] bg-[--bg-tertiary]/5 border-orange-500 text-[--text-secondary]">
              <div className="font-bold text-[10px] uppercase tracking-widest opacity-70 mb-1">
                {t("chat.reply")} {msg.replyTo.sender === "me" ? t("chat.yourMessage") : msg.replyTo.sender}
              </div>
              <div className="line-clamp-2">{msg.replyTo.text || (msg.replyTo.type === "audio" ? `Voice note \u00B7 ${msg.replyTo.duration || ""}` : "Attachment")}</div>
            </div>
          )}

          {/* Message text */}
          {msg.text && msg.type !== "sticker" && <span className={`px-2 pb-1 block ${msg.type ? "font-medium" : ""}`}>{<FormattedText text={msg.type === "morse" && msg.originalText ? msg.originalText : msg.text} searchTerm={searchQuery} />}</span>}

          {/* Link preview */}
          {msg.text && typeof msg.text === "string" && /https?:\/\/[^\s]+/i.test(msg.text) && (
            <div className="mt-2 p-2 rounded-md border text-[11px] bg-[--bg-secondary] border-[var(--border-color)] text-[--text-secondary]">
              <div className="font-bold uppercase tracking-widest text-[9px] opacity-70">{t("chat.linkPreview")}</div>
              <div className="break-all line-clamp-2">{msg.text.match(/https?:\/\/[^\s]+/i)?.[0]}</div>
            </div>
          )}

          {/* Keyboard buttons */}
          {msg.keyboard && (
            <div className="flex flex-col gap-1.5 mt-3 mb-1 w-full shrink-0">
              {msg.keyboard.map((row: any[], i: number) => (
                <div key={i} className="flex gap-1.5 w-full">
                  {row.map((btn: any, j: number) => (
                    <button
                      key={j}
                      onClick={() => {
                        btn.action && btn.text && btn.text;
                      }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 bg-[--bg-primary] hover:bg-[--bg-tertiary] text-[--text-primary] border border-[var(--border-color)]"
                    >
                      {btn.text}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Delivery receipts */}
          {msg._isLastInGroup && (
            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] font-bold tracking-wide opacity-70 ${msg.type ? "px-2" : ""}`}>
              {msg.silent && <BellOff size={10} className="mr-0.5 opacity-60" />}
              {fuzzTime(msg.time, msg.id)}
              {isMe && (
                <AnimatePresence mode="wait">
                  {(!deliveryReceipts || msg.status === "sent") && (
                    <motion.span key="sent" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                      <Check size={12} strokeWidth={2.5} />
                    </motion.span>
                  )}
                  {deliveryReceipts && msg.status === "delivered" && (
                    <motion.span key="delivered" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                      <CheckCheck size={12} strokeWidth={2.5} />
                    </motion.span>
                  )}
                  {deliveryReceipts && readReceipts && msg.status === "read" && (
                    <motion.span key="read" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                      <CheckCheck size={12} strokeWidth={2.5} className="text-blue-500" />
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </div>
          )}

          {/* Action buttons */}
          {msg._isLastInGroup && (
            <div className={`mt-1.5 flex items-center gap-1.5 sm:gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!chat.isChannel && (
                <button onClick={() => onReply?.(msg)} className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]">
                  {t("chat.reply")}
                </button>
              )}
              {!chat.isChannel && (
                <button
                  onClick={() => onToggleSavedMessage?.(chat, msg)}
                  className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full transition-colors flex items-center gap-1 text-[--text-secondary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 3l1.5 3 7 0 2.5-3 0 16-5-4-7 0 0-16 7 4" />
                  </svg>
                  {savedMessages.some((saved: any) => saved.messageId === msg.id) ? t("chat.saved") : t("chat.save")}
                </button>
              )}
            </div>
          )}

          {/* Channel comments */}
          {chat.isChannel && (
            <div
              className="flex items-center gap-1 mt-2 -mb-1 px-1 py-1 rounded-lg cursor-pointer hover:bg-[--bg-tertiary] text-[--text-secondary] hover:text-[--text-primary] transition-colors w-max"
              onClick={() => {
                setActivePostId(msg.id);
                setShowComments(true);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="text-[11px] font-medium tracking-wide">{msg.id === 402 ? t('channelComments.commentsCount', { count: 45 }) : t('channelComments.leaveAComment')}</span>
            </div>
          )}
        </div>

        {/* Reaction trigger */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer w-10 h-10 rounded-full flex items-center justify-center shadow-md z-10 shrink-0 border border-[--border-color]/5 bg-[--bg-secondary] text-[--text-tertiary] hover:text-[--text-primary] hover:bg-[--bg-tertiary]"
          onClick={() => setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id)}
          aria-label="Reactions"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveReactionPicker(activeReactionPicker === msg.id ? null : msg.id); }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3l0 18-9-9 18 0-9-9z" />
          </svg>
        </div>
      </div>

      {/* Reactions summary */}
      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
        <div className="flex gap-1.5 mt-1 z-10 relative">
          {Object.entries(msg.reactions).map(([emoji, count]) => (
            <React.Fragment key={emoji}>
              <div
                className="rounded-full px-2 py-0.5 text-[12px] shadow-sm flex items-center cursor-help group select-none border transition-colors bg-[--bg-secondary] text-[--text-primary] border-[--border-color]/5 hover:bg-[--bg-tertiary] hover:border-[--border-color]/10"
                onClick={() => handleReactionMessage(msg.id, emoji)}
              >
                {emoji}
                <span className="ml-1.5 text-[11px] font-bold opacity-80">{String(count)}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </motion.div>
  );
});
