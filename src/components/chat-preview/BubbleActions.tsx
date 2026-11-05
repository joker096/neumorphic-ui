import { useState } from "react";
import { Bookmark, Reply, SmilePlus } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useReactionEmojis } from "../../hooks/useReactionEmojis";
import { ReactionGrid } from "./ReactionGrid";

/**
 * Floating bubble toolbar. The outer button owns the 44px hit area while the
 * inner chip stays visually small, so the toolbar never inflates a bubble.
 */
const BUBBLE_BTN_CLASS = 'min-w-11 min-h-11 flex items-center justify-center rounded-full';
const CHIP_CLASS = 'w-7 h-7 flex items-center justify-center rounded-full border shadow-sm backdrop-blur-sm bg-[var(--msg-bg-panel)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]';

interface BubbleActionsProps {
  msg: any;
  isMe: boolean;
  chat: any;
  chatSavedMessages: any[];
  onReply: (msg: any) => void;
  onToggleSavedMessage: (chat: any, msg: any) => void;
  onReactionMessage: (msgId: string | number, emoji: string) => void;
}

export function BubbleActions({
  msg, isMe, chat, chatSavedMessages,
  onReply, onToggleSavedMessage, onReactionMessage,
}: BubbleActionsProps) {
  const { t } = useI18n();
  const emojis = useReactionEmojis();
  const [pickerOpen, setPickerOpen] = useState(false);
  const saved = chatSavedMessages.some((savedMsg: any) => savedMsg.messageId === msg.id);

  return (
    <div
      className={`absolute -top-2 z-20 hidden md:flex items-center gap-0.5 opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-hover:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto ${isMe ? "right-full mr-1" : "left-full ml-1"}`}
      onMouseLeave={() => setPickerOpen(false)}
    >
      <button
        type="button"
        aria-label={t('chat.reply')}
        onClick={(e) => { e.stopPropagation(); onReply(msg); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={BUBBLE_BTN_CLASS}
      >
        <span className={`${CHIP_CLASS} transition-transform hover:scale-110`}>
          <Reply size={14} />
        </span>
      </button>
      <button
        type="button"
        aria-label={t('chat.save')}
        onClick={(e) => { e.stopPropagation(); onToggleSavedMessage(chat, msg); }}
        onPointerDown={(e) => e.stopPropagation()}
        className={BUBBLE_BTN_CLASS}
      >
        <span className={`${CHIP_CLASS} transition-transform hover:scale-110`}>
          <Bookmark size={14} className={saved ? "fill-current" : ""} />
        </span>
      </button>
      <div className="relative">
        <button
          type="button"
          aria-label={t('chat.reactions')}
          aria-expanded={pickerOpen}
          onClick={(e) => { e.stopPropagation(); setPickerOpen((open) => !open); }}
          onPointerDown={(e) => e.stopPropagation()}
          className={BUBBLE_BTN_CLASS}
        >
          <span className={`${CHIP_CLASS} transition-transform hover:scale-110 ${pickerOpen ? "text-[var(--accent)] border-[var(--accent)] bg-[var(--accent-soft)]" : ""}`}>
            <SmilePlus size={14} />
          </span>
        </button>
        {pickerOpen && (
          <ReactionGrid
            emojis={emojis}
            mine={msg.myReactions || {}}
            onPick={(emoji) => { onReactionMessage(msg.id, emoji); setPickerOpen(false); }}
            className={`absolute top-full mt-1 z-30 ${isMe ? "right-0" : "left-0"}`}
          />
        )}
      </div>
    </div>
  );
}
