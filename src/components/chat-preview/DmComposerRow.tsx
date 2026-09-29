import React from "react";
import { BellOff, ChevronRight, Clock, Mic, Radio } from "lucide-react";
import type { ChatMentions } from "./useChatMentions";
import { MENTION_MENU_ID } from "./MentionSuggestionsMenu";
import { composerInputStyle, growTextarea } from "./composerInput";

export interface DmComposerRowProps {
  isDark: boolean;
  msgText: string;
  setMsgText: (value: string) => void;
  morseMode: boolean;
  onToggleMorse: () => void;
  silentMode: boolean;
  onToggleSilent: () => void;
  scheduleDateTime: string;
  onSend: () => void;
  /** Clears the stale voice error, then arms the hold-to-record gesture. */
  onStartVoiceRecording: () => void;
  onPasteFiles?: (files: FileList | null) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  mentions: ChatMentions;
  t: (key: string, opts?: any) => string;
}

/**
 * The DM message row: textarea, silent/Morse toggles and the send/mic button.
 *
 * The send button is a dual control: with text it sends, with an empty draft it
 * arms the hold-to-record gesture. Keyboard activation is mirrored on the
 * button itself (Enter/Space) because a bare `pointerdown` handler would make
 * the empty state unreachable from the keyboard.
 */
export function DmComposerRow({
  isDark,
  msgText,
  setMsgText,
  morseMode,
  onToggleMorse,
  silentMode,
  onToggleSilent,
  scheduleDateTime,
  onSend,
  onStartVoiceRecording,
  onPasteFiles,
  inputRef,
  mentions,
  t,
}: DmComposerRowProps) {
  const placeholder = morseMode ? t("chat.morsePlaceholder") : t("chat.messagePlaceholder");
  const inputStyle = composerInputStyle(morseMode, isDark);

  return (
    <>
      <div className="order-first sm:order-none w-full sm:flex-1 min-w-0 min-h-11 max-h-[132px] flex items-center gap-1">
        <textarea
          ref={inputRef}
          rows={1}
          value={msgText}
          onChange={(e) => {
            setMsgText(e.target.value);
            mentions.trackCaret(e.target.selectionStart ?? e.target.value.length);
            growTextarea(e.target);
          }}
          onSelect={(e) => mentions.trackCaret(e.currentTarget.selectionStart ?? 0)}
          onPaste={(e) => {
            const files = e.clipboardData?.files;
            if (files && files.length) {
              e.preventDefault();
              onPasteFiles?.(files);
            }
          }}
          onKeyDown={(e) => mentions.handleKeyDown(e, onSend)}
          placeholder={placeholder}
          aria-label={placeholder}
          aria-autocomplete="list"
          aria-controls={mentions.open ? MENTION_MENU_ID : undefined}
          aria-activedescendant={mentions.open ? `${MENTION_MENU_ID}-${mentions.activeIndex}` : undefined}
          autoComplete="off"
          inputMode="text"
          enterKeyHint="send"
          spellCheck={!morseMode}
          className={`flex-1 min-w-0 min-h-11 py-[13px] bg-transparent border-none outline-none resize-none text-[12px] sm:text-[13px] md:text-[14px] leading-snug max-h-[120px] overflow-y-auto ${
            isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"
          }`}
          style={inputStyle}
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            title={t("chat.silentMessage")}
            aria-label={t("chat.silentMessage")}
            aria-pressed={silentMode}
            onClick={onToggleSilent}
            className={`icon-button ${silentMode ? "bg-amber-500 text-[var(--ink-on-saturate)]" : ""}`}
          >
            <BellOff size={14} />
          </button>
          <button
            type="button"
            title={t("chat.toggleMorseEncoder")}
            aria-label={t("chat.toggleMorseEncoder")}
            aria-pressed={morseMode}
            onClick={onToggleMorse}
            className={`icon-button text-xs font-mono font-bold ${
              morseMode ? "bg-amber-500 text-[var(--ink-on-saturate)]" : ""
            }`}
          >
            <Radio size={14} />
            <span className="sr-only">{t("chat.morse")}</span>
          </button>
        </div>
      </div>

      <button
        type="button"
        title={msgText ? (scheduleDateTime ? t("chat.scheduleSend") : t("chat.sendMessage")) : t("chat.holdToRecordVoiceNote")}
        aria-label={msgText ? (scheduleDateTime ? t("chat.scheduleSend") : t("chat.sendMessage")) : t("chat.holdToRecordVoiceNote")}
        onClick={() => {
          if (msgText) onSend();
        }}
        onKeyDown={(e) => {
          if (!msgText && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onStartVoiceRecording();
          }
        }}
        onPointerDown={() => {
          if (!msgText) onStartVoiceRecording();
        }}
        onContextMenu={(e) => e.preventDefault()}
        className={`icon-button order-last sm:order-none ml-auto sm:ml-0 select-none ${
          scheduleDateTime && msgText
            ? "bg-[var(--cyan)] text-[var(--bg-primary)]"
            : msgText
              ? "primary"
              : "bg-[var(--accent)]/20 text-[var(--accent)]"
        }`}
      >
        {msgText ? (scheduleDateTime ? <Clock size={16} /> : <ChevronRight size={18} />) : <Mic size={18} />}
      </button>
    </>
  );
}
