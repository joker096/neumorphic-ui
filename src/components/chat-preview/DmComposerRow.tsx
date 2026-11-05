import React from "react";
import { BellOff, Clock, Mic, Radio, Send } from "lucide-react";
import type { ChatMentions } from "./useChatMentions";
import { MENTION_MENU_ID } from "./MentionSuggestionsMenu";
import { composerInputStyle, growTextarea } from "./composerInput";

export interface DmComposerRowProps {
  msgText: string;
  setMsgText: (value: string) => void;
  /** Active composer modes are only marked here; they are toggled from the
   *  attach menu so the row stays a plain field + send button. */
  morseMode: boolean;
  silentMode: boolean;
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
  msgText,
  setMsgText,
  morseMode,
  silentMode,
  scheduleDateTime,
  onSend,
  onStartVoiceRecording,
  onPasteFiles,
  inputRef,
  mentions,
  t,
}: DmComposerRowProps) {
  const placeholder = morseMode ? t("chat.morsePlaceholder") : t("chat.messagePlaceholder");
  const inputStyle = composerInputStyle(morseMode);

  return (
    <>
      <div className="flex-1 min-w-0 min-h-11 max-h-[132px] flex items-center gap-1">
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
          className={`flex-1 min-w-0 min-h-11 py-[13px] bg-transparent border-none outline-none resize-none text-xs sm:text-sm md:text-sm leading-snug max-h-[120px] overflow-y-auto text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]`}
          style={inputStyle}
        />
        <div className="flex items-center gap-1 flex-shrink-0">
          {(silentMode || morseMode) && (
            <span
              aria-hidden="true"
              data-testid="composer-mode-marker"
              className="flex h-11 items-center text-[var(--amber)]"
            >
              {morseMode ? <Radio size={14} /> : <BellOff size={14} />}
            </span>
          )}
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
        className={`icon-button order-last sm:order-none select-none ${
          scheduleDateTime && msgText
            ? "primary icon-button-schedule-state"
            : msgText
              ? "primary"
              : "icon-button-state"
        }`}
      >
        {msgText ? (scheduleDateTime ? <Clock size={16} /> : <Send size={18} />) : <Mic size={18} />}
      </button>
    </>
  );
}
