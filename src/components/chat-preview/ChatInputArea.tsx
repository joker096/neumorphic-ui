import React from "react";
import { BellOff, ChevronRight, Clock, Mic, Smile, Plus } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CHAT_SEND_GRADIENT } from "../../constants/chatConstants";
import { LiveVoiceRecorder } from "../LiveVoiceRecorder";
import { StickerPicker } from "../chat/StickerPicker";
import { ChatInputSchedulePopup } from "./ChatInputSchedulePopup";
import { ChatInputReplyBar } from "./ChatInputReplyBar";
import { ChatInputVoiceError } from "./ChatInputVoiceError";
import { MorsePreview } from "./MorsePreview";

interface ChatInputAreaProps {
  isDark: boolean;
  isChannel: boolean;
  chat: any;
  eMsgText: string;
  setMsgTextFn: (v: string) => void;
  eMorseMode: boolean;
  setMorseModeFn2: (v: boolean) => void;
  eSilentMode: boolean;
  setSilentModeFn2: (v: boolean) => void;
  eShowStickerPicker: boolean;
  setShowStickerPickerFn2: (v: boolean) => void;
  eIsRecordingVoice: boolean;
  setIsRecordingVoiceFn2: (v: boolean) => void;
  eVoiceNoteError: string;
  setVoiceNoteErrFn2: (v: string) => void;
  eScheduleDateTime: string;
  setScheduleDtFn2: (v: string) => void;
  eShowSchedulePopup: boolean;
  setShowSchedulePopupFn2: (v: boolean) => void;
  eReplyTarget: any;
  setLocalReplyTarget: (v: any) => void;
  sendMessage: () => void;
  sendVoiceMessage?: (url: string, dur: string) => void;
  sendStickerMessage?: (sticker: string) => void;
  handleImageAttach: (e: React.ChangeEvent<HTMLInputElement>, chat: any, onUpdateChat: any, silent: boolean) => void;
  onUpdateChat?: (chat: any) => void;
  onAction?: (action: string) => void;
  setChannels?: (updater: any) => void;
  theme: "light" | "dark";
  t: (key: string, opts?: any) => string;
}

function ChatInputAreaImpl({
  isDark,
  isChannel,
  chat,
  eMsgText,
  setMsgTextFn,
  eMorseMode,
  setMorseModeFn2,
  eSilentMode,
  setSilentModeFn2,
  eShowStickerPicker,
  setShowStickerPickerFn2,
  eIsRecordingVoice,
  setIsRecordingVoiceFn2,
  eVoiceNoteError,
  setVoiceNoteErrFn2,
  eScheduleDateTime,
  setScheduleDtFn2,
  eShowSchedulePopup,
  setShowSchedulePopupFn2,
  eReplyTarget,
  setLocalReplyTarget,
  sendMessage,
  sendVoiceMessage,
  sendStickerMessage,
  handleImageAttach,
  onUpdateChat,
  onAction,
  setChannels,
  theme,
  t,
}: ChatInputAreaProps) {
  const { t: translate } = useI18n();
  const messagePlaceholder = eMorseMode ? t("chat.morsePlaceholder") : t("chat.messagePlaceholder");
  const inputStyle = eMorseMode
    ? { fontFamily: "monospace", color: isDark ? "#fbbf24" : "#d97706", filter: "saturate(0.8)" }
    : undefined;

  if (isChannel) {
    return (
      <div className="px-4 pb-3 pt-1">
        <button
          type="button"
          onClick={() => {
            setChannels?.((prev: any) => prev.map((c: any) => (c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c)));
            onAction?.("MUTE_TOGGLE");
          }}
          className={`w-full py-3 rounded-xl flex items-center justify-center cursor-pointer transition-colors font-medium text-sm tracking-wide ${
            isDark
              ? "bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg-dark)] text-[var(--accent)] border border-[var(--border-color)]"
              : "bg-white hover:bg-slate-50 text-[var(--accent)] border border-[var(--border-color)] shadow-sm"
          }`}
        >
          {chat.isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}
        </button>
      </div>
    );
  }

  return (
    <>
      <ChatInputSchedulePopup
        scheduleDateTime={eScheduleDateTime}
        setScheduleDateTime={setScheduleDtFn2}
        showSchedulePopup={eShowSchedulePopup}
        setShowSchedulePopup={setShowSchedulePopupFn2}
        isDark={isDark}
        t={t}
      />

      {eIsRecordingVoice ? (
        <div className="px-3 pb-2">
          <LiveVoiceRecorder
            isDark={isDark}
            onCancel={() => setIsRecordingVoiceFn2(false)}
            onReRecord={() => setIsRecordingVoiceFn2(true)}
            onPermissionDenied={(msg: string) => {
              setIsRecordingVoiceFn2(false);
              setVoiceNoteErrFn2(msg);
            }}
            onSend={(url, dur) => {
              setIsRecordingVoiceFn2(false);
              if (sendVoiceMessage) sendVoiceMessage(url, dur);
              else setVoiceNoteErrFn2("");
            }}
            holdToRecord
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-2 sm:px-3 pb-3 pt-1">
        {!eIsRecordingVoice && (
          <>
            <div className="relative group">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={(e) => {
                  handleImageAttach(e, chat, onUpdateChat, eSilentMode);
                  e.target.value = "";
                }}
                aria-label={t("chat.attachFile")}
              />
              <div className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 relative z-0 ${
                isDark ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5" : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}>
                <Plus size={16} />
              </div>
            </div>

            <button
              type="button"
              aria-label={t("chat.scheduleMessage")}
              className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                eScheduleDateTime
                  ? isDark
                    ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : isDark
                    ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5"
                    : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}
              onClick={() => setShowSchedulePopupFn2(!eShowSchedulePopup)}
            >
              <Clock size={16} />
            </button>

            <button
              type="button"
              aria-label={t("stickers.title")}
              className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                eShowStickerPicker
                  ? isDark
                    ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : isDark
                    ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5"
                    : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}
              onClick={() => setShowStickerPickerFn2(!eShowStickerPicker)}
            >
              <Smile size={16} />
            </button>
          </>
        )}

        <div className={`flex-1 min-w-0 h-11 sm:h-12 rounded-full px-2 sm:px-3 md:px-4 flex items-center relative ${
          isDark ? "bg-[var(--bg-secondary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]" : "bg-[var(--bg-primary)] shadow-[inset_2px_2px_4px_rgba(165,175,190,0.2)]"
        }`}>
          <input
            type="text"
            value={eMsgText}
            onChange={(e) => setMsgTextFn(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={messagePlaceholder}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="send"
            spellCheck={!eMorseMode}
            className={`w-full bg-transparent border-none outline-none text-[12px] sm:text-[13px] md:text-[14px] ${
              isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"
            }`}
            style={inputStyle}
          />
          <div className="absolute right-1 sm:right-2 flex items-center gap-1">
            <button
              type="button"
              title={t("chat.silentMessage")}
              aria-label={t("chat.silentMessage")}
              aria-pressed={eSilentMode}
              onClick={() => {
                setSilentModeFn2(!eSilentMode);
              }}
              className={`min-w-[40px] min-h-[40px] px-1.5 py-1 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                eSilentMode
                  ? isDark
                    ? "text-blue-400"
                    : "text-blue-600"
                  : isDark
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <BellOff size={12} />
            </button>
            <button
              type="button"
              title={t("chat.toggleMorseEncoder")}
              aria-label={t("chat.toggleMorseEncoder")}
              aria-pressed={eMorseMode}
              onClick={() => {
                setMorseModeFn2(!eMorseMode);
              }}
              className={`min-w-[40px] min-h-[40px] px-1.5 py-1 rounded-full text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                eMorseMode
                  ? "bg-amber-500 text-[var(--text-primary)]"
                  : isDark
                    ? "hover:bg-white/10 text-gray-400"
                    : "hover:bg-black/5 text-slate-500"
              }`}
            >
              M
            </button>
          </div>
        </div>

        <button
          type="button"
          title={eMsgText ? (eScheduleDateTime ? t("chat.scheduleSend") : t("chat.sendMessage")) : t("chat.holdToRecordVoiceNote")}
          aria-label={eMsgText ? (eScheduleDateTime ? t("chat.scheduleSend") : t("chat.sendMessage")) : t("chat.holdToRecordVoiceNote")}
          onClick={() => {
            if (eMsgText) sendMessage();
            else {
              setVoiceNoteErrFn2("");
              setIsRecordingVoiceFn2(true);
            }
          }}
          onPointerDown={() => {
            if (!eMsgText) {
              setVoiceNoteErrFn2("");
              setIsRecordingVoiceFn2(true);
            }
          }}
          onContextMenu={(e) => e.preventDefault()}
          className={`min-w-[44px] min-h-[44px] sm:w-10 sm:h-10 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${
            eScheduleDateTime && eMsgText
              ? isDark
                ? "bg-[var(--cyan)] text-[var(--bg-primary)]"
                : "bg-[var(--cyan)] text-[var(--bg-primary)]"
              : eMsgText
                ? isDark
                  ? `${CHAT_SEND_GRADIENT} text-[var(--text-primary)] shadow-[0_0_10px_rgba(111,127,255,0.5)]`
                  : `${CHAT_SEND_GRADIENT} text-[var(--text-primary)]`
                : isDark
                  ? "bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30"
                  : "bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20"
          }`}
        >
          {eMsgText ? (eScheduleDateTime ? <Clock size={16} /> : <ChevronRight size={18} />) : <Mic size={18} />}
        </button>
      </div>

      <ChatInputReplyBar replyTarget={eReplyTarget} setReplyTarget={setLocalReplyTarget} isDark={isDark} t={t} />
      <ChatInputVoiceError voiceNoteError={eVoiceNoteError} isDark={isDark} />
      <MorsePreview msgText={eMsgText} isDark={isDark} />

      {eShowStickerPicker && (
        <div className="animate-fade-in">
          <StickerPicker
            theme={theme}
            onSelect={(sticker: string) => {
              if (sendStickerMessage) sendStickerMessage(sticker);
              setShowStickerPickerFn2(false);
            }}
            onClose={() => setShowStickerPickerFn2(false)}
          />
        </div>
      )}
    </>
  );
}

export const ChatInputArea = React.memo(ChatInputAreaImpl);
