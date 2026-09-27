import React, { lazy, Suspense } from "react";
import { BellOff, ChevronRight, Clock, FileText, Image as ImageIcon, Link2, MapPin, Mic, Music, Plus, Smile, Video as VideoIcon, VolumeX, Volume2, Radio, X } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useEscapeKey } from "../../hooks/useEscapeKey";
const LazyLiveVoiceRecorder = lazy(() => import("../LiveVoiceRecorder").then(m => ({ default: m.LiveVoiceRecorder })));
const LazyLiveVideoRecorder = lazy(() => import("../LiveVideoRecorder").then(m => ({ default: m.LiveVideoRecorder })));
import { StickerPicker } from "../chat/StickerPicker";
import { ChatInputSchedulePopup } from "./ChatInputSchedulePopup";
import { ChatInputReplyBar } from "./ChatInputReplyBar";
import { ChatInputVoiceError } from "./ChatInputVoiceError";
import { MorsePreview } from "./MorsePreview";
import { p2pNetwork } from "../../lib/p2p/network";
import { useAppStore } from "../../store";
import { useMentionAutocomplete } from "../../hooks/useMentionAutocomplete";
import type { MentionCandidate, MentionSuggestion } from "../../types";
import { createMentionHandle } from "../../types/mention";

const MENTION_MENU_ID = "chat-mention-menu";

type MentionSource = {
  id?: string | number;
  name?: string;
  username?: string;
  telegram?: string;
  avatar?: string;
};

const toMentionCandidate = (source: MentionSource | null | undefined): MentionCandidate | null => {
  const name = typeof source?.name === "string" ? source.name.trim() : "";
  const suppliedUsername = typeof source?.username === "string"
    ? source.username.trim()
    : typeof source?.telegram === "string"
      ? source.telegram.trim()
      : "";
  const username = createMentionHandle((suppliedUsername || name).replace(/^@/, ""));
  if (!name || !username) return null;
  return {
    id: String(source?.id ?? username),
    name,
    username,
    avatar: typeof source?.avatar === "string" ? source.avatar : undefined,
  };
};

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
  sendMessage: (attachment?: { url: string; type: 'image' | 'video' } | Array<{ url: string; type: 'image' | 'video' }>) => void;
  sendVoiceMessage?: (url: string, dur: string, blob?: Blob) => void;
  sendStickerMessage?: (sticker: string) => void;
  handleImageAttach: (e: React.ChangeEvent<HTMLInputElement>, chat: any, onUpdateChat: any, silent: boolean) => void;
  sendVideoNote?: (file: File) => void;
  sendGeoMessage?: (lat: number, lng: number) => void;
  sendArticleMessage?: (url: string, title?: string) => void;
  onUpdateChat?: (chat: any) => void;
  onPasteFiles?: (files: FileList | null) => void;
  onAction?: (action: string) => void;
  setChannels?: (updater: any) => void;
  theme: "light" | "dark";
  t: (key: string, opts?: any) => string;
  /** Locked sticker-pack upsell target (Settings → Premium). */
  onOpenPremium?: () => void;
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
  sendGeoMessage,
  sendArticleMessage,
    handleImageAttach,
    onUpdateChat,
    onPasteFiles,
    onAction,
    sendVideoNote,
    setChannels,
  theme,
  t,
  onOpenPremium,
}: ChatInputAreaProps) {
  const { t: translate } = useI18n();
  const showTyping = useAppStore((state) => state.typingIndicators);
  const userProfile = useAppStore((state) => state.userProfile);
  const typingActiveRef = React.useRef(false);
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pendingMedia, setPendingMedia] = React.useState<Array<{ url: string; type: 'image' | 'video' }>>([]);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const contacts = useAppStore((state) => state.contacts);
  const [mentionCaret, setMentionCaret] = React.useState(0);
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const [mentionDismissed, setMentionDismissed] = React.useState(false);
  // Lookup indexes built once per contacts change. Scanning the array per lookup
  // re-normalized every contact's handle (NFKC + two regex passes) for each
  // candidate examined; here each contact is indexed exactly once.
  const { byId, byName, byUsername } = React.useMemo(() => {
    const id = new Map<string, MentionSource>();
    const name = new Map<string, MentionSource>();
    const username = new Map<string, MentionSource>();
    for (const contact of (contacts ?? []) as MentionSource[]) {
      const idKey = String(contact?.id ?? "");
      if (idKey && !id.has(idKey)) id.set(idKey, contact);
      const nameKey = typeof contact?.name === "string" ? contact.name.trim().toLowerCase() : "";
      if (nameKey && !name.has(nameKey)) name.set(nameKey, contact);
      const handle = toMentionCandidate(contact)?.username.toLowerCase();
      if (handle && !username.has(handle)) username.set(handle, contact);
    }
    return { byId: id, byName: name, byUsername: username };
  }, [contacts]);
  const mentionCandidates = React.useMemo<MentionCandidate[]>(() => {
    if (isChannel) return [];
    const selfId = String(userProfile.id);

    const isGroup = chat?.type === "group" || Array.isArray(chat?.members);
    if (isGroup) {
      const memberIds = Array.isArray(chat?.memberIds) ? chat.memberIds : undefined;
      const members: MentionSource[] = Array.isArray(chat?.members) && chat.members.length > 0
        ? chat.members
        : memberIds
          ? memberIds.map((id: string) => byId.get(String(id))).filter(Boolean) as MentionSource[]
          : [];
      // Single pass with a seen-set: the previous `all.findIndex(...)` filter was
      // quadratic in the member count (a 500-member group did 250k comparisons).
      const seen = new Set<string>();
      const candidates: MentionCandidate[] = [];
      for (const member of members) {
        const candidate = toMentionCandidate(member);
        if (!candidate || candidate.id === selfId || seen.has(candidate.id)) continue;
        seen.add(candidate.id);
        candidates.push(candidate);
      }
      return candidates;
    }

    const chatName = typeof chat?.name === "string" ? chat.name.trim() : "";
    const peerId = chat?.contactId ?? chat?.peerId ?? chat?.memberIds?.[0];
    const chatUsername = typeof chat?.username === "string"
      ? createMentionHandle(chat.username.replace(/^@/, "")).toLowerCase()
      : "";
    const peer = (peerId !== undefined && peerId !== null ? byId.get(String(peerId)) : undefined)
      ?? (chatUsername ? byUsername.get(chatUsername) : undefined)
      ?? (chatName !== "" ? byName.get(chatName.toLowerCase()) : undefined);
    const candidate = toMentionCandidate(peer ?? (chatName
      ? { id: chat?.id ?? chatName, name: chatName, username: chat?.username }
      : null));
    return candidate && candidate.id !== selfId ? [candidate] : [];
  }, [byId, byName, byUsername, chat, isChannel, userProfile.id]);
  const {
    token: mentionToken,
    suggestions: mentionSuggestions,
    replace: replaceMention,
  } = useMentionAutocomplete(eMsgText, mentionCaret, { contacts: mentionCandidates });
  const mentionOpen = !mentionDismissed && !!mentionToken && mentionSuggestions.length > 0;
  const activeMentionIndex = mentionSuggestions.length > 0
    ? Math.min(mentionIndex, mentionSuggestions.length - 1)
    : 0;

  React.useEffect(() => {
    setMentionCaret(0);
    setMentionIndex(0);
    setMentionDismissed(false);
  }, [chat?.id]);

  const applyMention = (suggestion: MentionSuggestion) => {
    const next = replaceMention(suggestion.username);
    if (next === null || !mentionToken) return;
    const suffix = eMsgText.slice(mentionToken.end);
    const caret = next.length - suffix.length;
    setMsgTextFn(next);
    setMentionCaret(caret);
    setMentionIndex(0);
    setMentionDismissed(true);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = React.useState(false);
  const dmMediaInputRef = React.useRef<HTMLInputElement>(null);
  const dmDocInputRef = React.useRef<HTMLInputElement>(null);
  const dmAudioInputRef = React.useRef<HTMLInputElement>(null);
  const articleInputRef = React.useRef<HTMLInputElement>(null);
  const [showArticleInput, setShowArticleInput] = React.useState(false);
  const [articleUrl, setArticleUrl] = React.useState("");
  const [attachError, setAttachError] = React.useState("");
  useEscapeKey(() => {
    setShowAttachMenu(false);
    setShowArticleInput(false);
    setShowVideoRecorder(false);
  }, showAttachMenu || showArticleInput || showVideoRecorder);

  const growTextarea = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  React.useEffect(() => {
    if (showArticleInput) articleInputRef.current?.focus();
  }, [showArticleInput]);

  const handleGeoRequest = () => {
    setAttachError("");
    if (!("geolocation" in navigator)) {
      setAttachError(t("chat.locationDenied", "Location access denied"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => sendGeoMessage?.(pos.coords.latitude, pos.coords.longitude),
      () => setAttachError(t("chat.locationDenied", "Location access denied")),
      { timeout: 10000, maximumAge: 60000 },
    );
  };

  const submitArticle = () => {
    const url = articleUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setAttachError(t("chat.articleInvalid", "Enter a valid URL (https://…)"));
      return;
    }
    setAttachError("");
    setShowAttachMenu(false);
    setShowArticleInput(false);
    setArticleUrl("");
    sendArticleMessage?.(url);
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
      if (!eMsgText.trim() && pendingMedia.length === 0) return;
      sendMessage(pendingMedia.length ? pendingMedia : undefined);
      setPendingMedia([]);
    };
    return (
      <div className="px-4 pb-3 pt-1">
        {pendingMedia.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {pendingMedia.map((media, i) => (
              <div key={`${media.url}-${i}`} className="relative w-fit">
                {media.type === 'image' ? (
                  <img src={media.url} alt="" className="h-20 w-20 object-cover rounded-lg" />
                ) : (
                  <video src={media.url} className="h-20 w-20 object-cover rounded-lg" />
                )}
                <button
                  type="button"
                  onClick={() => setPendingMedia((prev) => prev.filter((_, idx) => idx !== i))}
                  aria-label={t('chat.removeMedia')}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="message-composer w-full flex-shrink-0 min-h-11 max-h-[132px] flex items-center gap-1">
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            id="channel-post-media-input"
            onChange={(e) => {
              const files = [...(e.target.files || [])].slice(0, 10);
              if (files.length) {
                setPendingMedia((prev) => [
                  ...prev,
                  ...files.map((f) => ({ url: URL.createObjectURL(f), type: (f.type.startsWith('video') ? 'video' : 'image') as 'image' | 'video' })),
                ]);
              }
              e.target.value = "";
            }}
            aria-label={t('chat.attachFile')}
          />
          <label
            htmlFor="channel-post-media-input"
            aria-label={t('chat.attachFile')}
            className={`icon-button shrink-0 ${
              isDark ? "text-gray-400" : "text-slate-500 hover:text-slate-800"
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
              isDark ? "text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" : "text-slate-800 placeholder:text-slate-400"
            } ${eMorseMode ? "font-mono" : ""}`}
            style={inputStyle}
          />
          <button
            type="button"
            onClick={sendPost}
            disabled={!eMsgText.trim() && pendingMedia.length === 0}
            aria-label={t("channelComposer.send")}
            title={t("channelComposer.send")}
            className={`icon-button ${((eMsgText.trim() || pendingMedia.length > 0)) ? "primary" : ""}`}
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

      {showVideoRecorder ? (
        <div className="px-3 pb-2">
          <Suspense fallback={null}>
            <LazyLiveVideoRecorder
              onCancel={() => setShowVideoRecorder(false)}
              onPermissionDenied={(msg: string) => {
                setShowVideoRecorder(false);
                setVoiceNoteErrFn2(msg);
              }}
              onSend={(url, _dur, blob) => {
                setShowVideoRecorder(false);
                if (sendVideoNote) {
                  const file = new File([blob], "video-note.webm", { type: blob.type || "video/webm" });
                  sendVideoNote(file);
                }
                URL.revokeObjectURL(url);
              }}
            />
          </Suspense>
        </div>
      ) : null}

      {eIsRecordingVoice ? (
        <div className="px-3 pb-2">
          <Suspense fallback={null}>
            <LazyLiveVoiceRecorder
              isDark={isDark}
              onCancel={() => setIsRecordingVoiceFn2(false)}
               onPermissionDenied={(msg: string) => {
                 setIsRecordingVoiceFn2(false);
                 setVoiceNoteErrFn2(msg);
               }}
               onSend={(url, dur, blob) => {
                 setIsRecordingVoiceFn2(false);
                 if (sendVoiceMessage) sendVoiceMessage(url, dur, blob);
                 else setVoiceNoteErrFn2("");
               }}
              holdToRecord
            />
          </Suspense>
        </div>
      ) : null}

      {showAttachMenu && (
        <div className={`mx-2 sm:mx-3 mb-2 p-1.5 sm:p-2 rounded-xl flex flex-col gap-0.5 ${
          isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"
        }`}>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] px-3 py-1.5">
            {t("chat.attachFile")}
          </span>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              dmMediaInputRef.current?.click();
            }}
            className={`min-w-11 min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
              isDark ? "text-[var(--text-primary)] hover:bg-white/5" : "text-slate-700 hover:bg-black/5"
            }`}
          >
            <ImageIcon size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("chat.photo")} / {t("chat.video")}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              dmDocInputRef.current?.click();
            }}
            className={`min-w-11 min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
              isDark ? "text-[var(--text-primary)] hover:bg-white/5" : "text-slate-700 hover:bg-black/5"
            }`}
          >
            <FileText size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("media.document")}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              dmAudioInputRef.current?.click();
            }}
            className={`min-w-11 min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
              isDark ? "text-[var(--text-primary)] hover:bg-white/5" : "text-slate-700 hover:bg-black/5"
            }`}
          >
            <Music size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("media.audio")}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              setShowVideoRecorder(true);
            }}
            className={`min-w-11 min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
              isDark ? "text-[var(--text-primary)] hover:bg-white/5" : "text-slate-700 hover:bg-black/5"
            }`}
          >
            <VideoIcon size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("chat.videoNote", "Video note")}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAttachMenu(false);
              handleGeoRequest();
            }}
            className={`min-w-11 min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
              isDark ? "text-[var(--text-primary)] hover:bg-white/5" : "text-slate-700 hover:bg-black/5"
            }`}
          >
            <MapPin size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("chat.location")}
          </button>
          <button
            type="button"
            onClick={() => {
              setAttachError("");
              setArticleUrl("");
              setShowArticleInput((v) => !v);
            }}
            aria-expanded={showArticleInput}
            className={`min-w-11 min-h-11 w-full flex items-center gap-3 px-3 rounded-lg text-sm cursor-pointer transition-colors ${
              isDark ? "text-[var(--text-primary)] hover:bg-white/5" : "text-slate-700 hover:bg-black/5"
            }`}
          >
            <Link2 size={18} className="text-[var(--accent)] flex-shrink-0" />
            {t("chat.article")}
          </button>
          {showArticleInput && (
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <input
                ref={articleInputRef}
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitArticle();
                  }
                }}
                placeholder={t("chat.articleUrl", "https://…")}
                className={`min-h-11 flex-1 min-w-0 px-3 rounded-lg text-sm outline-none transition-colors ${
                  isDark
                    ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                    : "bg-slate-100 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              <button
                type="button"
                onClick={submitArticle}
                aria-label={t("chat.sendMessage")}
                className={`icon-button primary cursor-pointer ${
                  isDark ? "" : ""
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {attachError && (
        <div className="mx-2 sm:mx-3 mb-2 px-3 py-2 rounded-lg text-xs border border-rose-500/40 bg-rose-500/10 text-rose-500 flex items-center gap-2">
          <X size={14} className="flex-shrink-0 cursor-pointer min-h-11 min-w-11 -my-1 -mx-2 p-3" onClick={() => setAttachError("")} aria-label="Dismiss" />
          <span>{attachError}</span>
        </div>
      )}

      <div className="message-composer relative shrink-0 mx-2 sm:mx-3 mb-3 mt-1 flex flex-wrap sm:flex-nowrap">
        {mentionOpen && (
          <div
            id={MENTION_MENU_ID}
            role="menu"
            aria-label={t("notif.settings.mentions")}
            className="glass-menu absolute bottom-full left-0 right-0 mb-2 z-50 max-h-56 overflow-y-auto"
          >
            {mentionSuggestions.map((suggestion, index) => (
              <button
                id={`${MENTION_MENU_ID}-${index}`}
                key={suggestion.id}
                type="button"
                role="menuitem"
                aria-selected={index === activeMentionIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyMention(suggestion)}
                className={`glass-menu-item ${index === activeMentionIndex ? "bg-[var(--msg-bg-panel-hover)]" : ""}`}
              >
                <span className="min-w-0 flex-1 truncate">{suggestion.name}</span>
                <span className="text-xs text-[var(--msg-text-muted)] truncate">@{suggestion.username}</span>
              </button>
            ))}
          </div>
        )}
        {!eIsRecordingVoice && (
          <>
            <div className="relative group">
              <input
                ref={dmMediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                id="dm-media-input"
                className="hidden"
                onChange={(e) => {
                  handleImageAttach(e, chat, onUpdateChat, eSilentMode);
                  e.target.value = "";
                }}
                aria-label={t("chat.attachFile")}
              />
              <input
                ref={dmDocInputRef}
                type="file"
                accept="application/*,text/*"
                id="dm-doc-input"
                className="hidden"
                onChange={(e) => {
                  handleImageAttach(e, chat, onUpdateChat, eSilentMode);
                  e.target.value = "";
                }}
                aria-label={t("media.document")}
              />
              <input
                ref={dmAudioInputRef}
                type="file"
                accept="audio/*"
                id="dm-audio-input"
                className="hidden"
                onChange={(e) => {
                  handleImageAttach(e, chat, onUpdateChat, eSilentMode);
                  e.target.value = "";
                }}
                aria-label={t("media.audio")}
              />
              <button
                type="button"
                aria-label={t("chat.attachFile")}
                aria-haspopup="menu"
                aria-expanded={showAttachMenu}
                onClick={() => setShowAttachMenu((v) => !v)}
                className={`icon-button cursor-pointer ${
                  isDark ? "text-gray-400" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              type="button"
              aria-label={t("chat.scheduleMessage")}
              className={`icon-button ${
                eScheduleDateTime
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : ""
              }`}
              onClick={() => setShowSchedulePopupFn2(!eShowSchedulePopup)}
            >
              <Clock size={16} />
            </button>

            <button
              type="button"
              aria-label={t("stickers.title")}
              className={`icon-button ${
                eShowStickerPicker
                  ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                  : ""
              }`}
              onClick={() => {
                setShowStickerPickerFn2(!eShowStickerPicker);
              }}
            >
              <Smile size={16} />
            </button>
          </>
        )}

        <div className="order-first sm:order-none w-full sm:flex-1 min-w-0 min-h-11 max-h-[132px] flex items-center gap-1">
          <textarea
            ref={inputRef}
            rows={1}
            value={eMsgText}
            onChange={(e) => {
              setMsgTextFn(e.target.value);
              setMentionCaret(e.target.selectionStart ?? e.target.value.length);
              setMentionIndex(0);
              setMentionDismissed(false);
              growTextarea(e.target);
            }}
            onSelect={(e) => setMentionCaret(e.currentTarget.selectionStart ?? 0)}
            onPaste={(e) => {
              const files = e.clipboardData?.files;
              if (files && files.length) {
                e.preventDefault();
                onPasteFiles?.(files);
              }
            }}
            onKeyDown={(e) => {
              if (mentionOpen) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMentionIndex((i) => (i + 1) % mentionSuggestions.length);
                  return;
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMentionIndex((i) => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
                  return;
                }
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const picked = mentionSuggestions[activeMentionIndex];
                  if (picked) applyMention(picked);
                  return;
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setMentionDismissed(true);
                  return;
                }
              }
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder={messagePlaceholder}
            aria-label={messagePlaceholder}
            aria-autocomplete="list"
            aria-controls={mentionOpen ? MENTION_MENU_ID : undefined}
            aria-activedescendant={mentionOpen ? `${MENTION_MENU_ID}-${activeMentionIndex}` : undefined}
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
              className={`icon-button ${
                eSilentMode
                  ? "bg-amber-500 text-[var(--ink-on-saturate)]"
                  : ""
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
              className={`icon-button text-xs font-mono font-bold ${
                eMorseMode
                  ? "bg-amber-500 text-[var(--ink-on-saturate)]"
                  : ""
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
          }}
          onKeyDown={(e) => {
            if (!eMsgText && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
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
          className={`icon-button order-last sm:order-none ml-auto sm:ml-0 select-none ${
            eScheduleDateTime && eMsgText
              ? "bg-[var(--cyan)] text-[var(--bg-primary)]"
              : eMsgText
                ? "primary"
                : "bg-[var(--accent)]/20 text-[var(--accent)]"
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
            onOpenPremium={onOpenPremium}
          />
        </div>
      )}
    </>
  );
}

export const ChatInputArea = React.memo(ChatInputAreaImpl);
