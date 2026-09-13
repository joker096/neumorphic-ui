import React, { lazy, Suspense } from "react";
import { BellOff, ChevronRight, Clock, Mic, Smile, Plus, VolumeX, Volume2, Radio, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { CHAT_SEND_GRADIENT } from "../../constants/chatConstants";
const LazyLiveVoiceRecorder = lazy(() => import("../LiveVoiceRecorder").then(m => ({ default: m.LiveVoiceRecorder })));
import { StickerPicker } from "../chat/StickerPicker";
import { ChatInputSchedulePopup } from "./ChatInputSchedulePopup";
import { ChatInputReplyBar } from "./ChatInputReplyBar";
import { ChatInputVoiceError } from "./ChatInputVoiceError";
import { MorsePreview } from "./MorsePreview";
import { p2pNetwork } from "../../lib/p2p/network";
import { useAppStore } from "../../store";

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
  sendMessage: (attachment?: { url: string; type: 'image' | 'video' }) => void;
  sendVoiceMessage?: (url: string, dur: string) => void;
  sendStickerMessage?: (sticker: string) => void;
  handleImageAttach: (e: React.ChangeEvent<HTMLInputElement>, chat: any, onUpdateChat: any, silent: boolean) => void;
  onUpdateChat?: (chat: any) => void;
  onPasteFiles?: (files: FileList | null) => void;
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
    onPasteFiles,
    onAction,
  setChannels,
  theme,
  t,
}: ChatInputAreaProps) {
  const { t: translate } = useI18n();
  const showTyping = useAppStore((state) => state.typingIndicators);
  const userProfile = useAppStore((state) => state.userProfile);
  const typingActiveRef = React.useRef(false);
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pendingMedia, setPendingMedia] = React.useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const growTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.height = "auto";
      if (el.value) growTextarea(el);
    });
    return () => cancelAnimationFrame(raf);
  }, [chat.id]);

  React.useEffect(() => {
    if (isChannel || !showTyping || !chat?.name) return;
    const name = chat.name;

    if (eMsgText.trim()) {
      if (!typingActiveRef.current) {
        typingActiveRef.current = true;
        p2pNetwork.sendTypingIndicator(name, true);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        typingActiveRef.current = false;
        p2pNetwork.sendTypingIndicator(name, false);
      }, 2500);
    } else {
      if (typingActiveRef.current) {
        typingActiveRef.current = false;
        p2pNetwork.sendTypingIndicator(name, false);
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (typingActiveRef.current) {
        typingActiveRef.current = false;
        p2pNetwork.sendTypingIndicator(name, false);
      }
    };
  }, [eMsgText, isChannel, showTyping, chat?.name]);

  const messagePlaceholder = eMorseMode ? t("chat.morsePlaceholder") : t("chat.messagePlaceholder");
  const inputStyle = eMorseMode
    ? { fontFamily: "monospace", color: isDark ? "#fbbf24" : "#d97706", filter: "saturate(0.8)" }
    : undefined;

  if (isChannel) {
    const isChannelOwner = !!chat.ownerId && chat.ownerId === userProfile.id;
    if (!isChannelOwner) {
      return (
        <div className="px-4 pb-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setChannels?.((prev: any) => prev.map((c: any) => (c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c)));
              onAction?.("MUTE_TOGGLE");
            }}
            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium text-sm tracking-wide min-w-11 min-h-11 ${
              isDark
                ? "bg-[var(--bg-secondary)] hover:bg-[var(--hover-bg-dark)] text-[var(--accent)] border border-[var(--border-color)]"
                : "bg-white hover:bg-slate-50 text-[var(--accent)] border border-[var(--border-color)] shadow-sm"
            }`}
            aria-label={chat.isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}
            title={chat.isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}
          >
            {chat.isMuted ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{chat.isMuted ? t("chat.filters.unmuteChannel") : t("chat.filters.muteChannel")}</span>
          </button>
        </div>
      );
    }
    const sendPost = () => {
      if (!eMsgText.trim() && !pendingMedia) return;
      sendMessage(pendingMedia ?? undefined);
      setPendingMedia(null);
    };
    return (
      <div className="px-4 pb-3 pt-1">
        {pendingMedia && (
          <div className="relative w-fit mb-2">
            {pendingMedia.type === 'image' ? (
              <img src={pendingMedia.url} alt="" className="h-20 w-20 object-cover rounded-lg" />
            ) : (
              <video src={pendingMedia.url} className="h-20 w-20 object-cover rounded-lg" />
            )}
            <button
              type="button"
              onClick={() => setPendingMedia(null)}
              aria-label={t('chat.removeMedia')}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <div
          className={`w-full flex-shrink-0 min-h-11 max-h-[132px] rounded-[20px] px-3 py-1.5 flex items-center gap-1 ${
            isDark ? "bg-[var(--bg-secondary)]" : "bg-white shadow-sm"
          }`}
        >
          <input
            type="file"
            accept="image/*,video/*"
            className="hidden"
            id="channel-post-media-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setPendingMedia({ url: URL.createObjectURL(file), type: file.type.startsWith('video') ? 'video' : 'image' });
              }
              e.target.value = "";
            }}
            aria-label={t('chat.attachFile')}
          />
          <label
            htmlFor="channel-post-media-input"
            aria-label={t('chat.attachFile')}
            className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors min-w-11 min-h-11 ${
              isDark ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800"
            }`}
          >
            <Plus size={16} />
          </label>
          <textarea
            ref={inputRef}
            rows={1}
            value={eMsgText}
            onChange={(e) => {
              setMsgTextFn(e.target.value);
              growTextarea(e.target);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendPost();
              }
            }}
            placeholder={t("channelComposer.placeholder")}
            aria-label={t("channelComposer.placeholder")}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="send"
            spellCheck={!eMorseMode}
            className={`flex-1 min-w-0 bg-transparent outline-none border-none resize-none text-sm px-2 py-1.5 max-h-[120px] overflow-y-auto ${
              isDark ? "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" : "text-slate-800 placeholder:text-slate-400"
            } ${eMorseMode ? "font-mono" : ""}`}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={sendPost}
            disabled={!eMsgText.trim() && !pendingMedia}
            aria-label={t("channelComposer.send")}
            title={t("channelComposer.send")}
            className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors min-w-11 min-h-11 ${
              (eMsgText.trim() || pendingMedia)
                ? `${CHAT_SEND_GRADIENT} text-white`
                : isDark
                ? "bg-[var(--border-color)] text-[var(--text-muted)]"
                : "bg-slate-200 text-slate-400"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
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
          <Suspense fallback={null}>
            <LazyLiveVoiceRecorder
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
          </Suspense>
        </div>
      ) : null}

      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 px-2 sm:px-3 pb-3 pt-1">
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
              <div className={`min-w-11 min-h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 relative z-0 active:scale-95 ${
                isDark ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5" : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}>
                <Plus size={16} />
              </div>
            </div>

            <button
              type="button"
              aria-label={t("chat.scheduleMessage")}
              className={`min-w-11 min-h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 ${
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
              className={`min-w-11 min-h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 ${
                eShowStickerPicker
                  ? isDark
                    ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                    : "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : isDark
                    ? "bg-[var(--bg-secondary)] text-gray-400 hover:text-[var(--text-primary)] hover:bg-white/5"
                    : "bg-[var(--bg-primary)] text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              }`}
              onClick={() => {
                setShowStickerPickerFn2(!eShowStickerPicker);
              }}
            >
              <Smile size={16} />
            </button>
          </>
        )}

        <div className="order-first sm:order-none w-full sm:w-auto flex-shrink-0 sm:flex-1 min-w-0 min-h-11 max-h-[132px] rounded-[20px] px-2 sm:px-3 md:px-4 flex items-center gap-1">
          <textarea
            ref={inputRef}
            rows={1}
            value={eMsgText}
            onChange={(e) => {
              setMsgTextFn(e.target.value);
              growTextarea(e.target);
            }}
            onPaste={(e) => {
              const files = e.clipboardData?.files;
              if (files && files.length) {
                e.preventDefault();
                onPasteFiles?.(files);
              }
            }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={messagePlaceholder}
            aria-label={messagePlaceholder}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="send"
            spellCheck={!eMorseMode}
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
              aria-pressed={eSilentMode}
              onClick={() => {
                setSilentModeFn2(!eSilentMode);
              }}
              className={`min-w-11 min-h-11 px-1.5 py-1 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                eSilentMode
                  ? "bg-amber-500 text-[var(--ink-on-saturate)]"
                  : isDark
                    ? "text-gray-400 hover:text-gray-300 hover:bg-white/10"
                    : "text-slate-500 hover:text-slate-700 hover:bg-black/5"
              }`}
            >
              <BellOff size={14} />
            </button>
            <button
              type="button"
              title={t("chat.toggleMorseEncoder")}
              aria-label={t("chat.toggleMorseEncoder")}
              aria-pressed={eMorseMode}
              onClick={() => {
                setMorseModeFn2(!eMorseMode);
              }}
              className={`min-w-11 min-h-11 px-1.5 py-1 rounded-full text-xs font-mono font-bold cursor-pointer transition-all flex items-center justify-center active:scale-95 ${
                eMorseMode
                  ? "bg-amber-500 text-[var(--ink-on-saturate)]"
                  : isDark
                    ? "hover:bg-white/10 text-gray-400"
                    : "hover:bg-black/5 text-slate-500"
              }`}
            >
              <Radio size={14} />
              <span className="sr-only">{t("chat.morse")}</span>
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
          className={`order-last sm:order-none ml-auto sm:ml-0 min-w-11 min-h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center cursor-pointer transition-all flex-shrink-0 active:scale-95 select-none ${
            eScheduleDateTime && eMsgText
              ? "bg-[var(--cyan)] text-[var(--bg-primary)]"
              : eMsgText
                ? isDark
                  ? `${CHAT_SEND_GRADIENT} text-[var(--text-primary)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]`
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
      {eMorseMode && <MorsePreview msgText={eMsgText} isDark={isDark} />}

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
