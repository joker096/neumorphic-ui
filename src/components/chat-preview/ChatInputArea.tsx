import React from "react";
import { BellOff, ChevronRight, Clock, Mic, Radio } from "lucide-react";
import { useI18n } from "../../lib/i18n";
import { useEscapeKey } from "../../hooks/useEscapeKey";
import { StickerPicker } from "../chat/StickerPicker";
import { ChatAttachLayer } from "./ChatAttachLayer";
import { ChatInputSchedulePopup } from "./ChatInputSchedulePopup";
import { ChatInputReplyBar } from "./ChatInputReplyBar";
import { ChatInputVoiceError } from "./ChatInputVoiceError";
import { ChannelComposer } from "./ChannelComposer";
import { ComposerToolbar } from "./ComposerToolbar";
import { selfDestructLabel } from "../../lib/selfDestruct";
import { ComposerFormatBar } from "./ComposerFormatBar";
import { DmComposerRow } from "./DmComposerRow";
import { composerInputStyle, growTextarea, wrapSelection, type FormatWrapKey } from "./composerInput";
import { MorsePreview } from "./MorsePreview";
import { useAppStore } from "../../store";
import { useTypingIndicator } from "./useTypingIndicator";
import { useChatMentions } from "./useChatMentions";
import { MENTION_MENU_ID, MentionSuggestionsMenu } from "./MentionSuggestionsMenu";
import { DmRecorderSlots } from "./DmRecorderSlots";
import { useChatSelfDestructTimer } from "./useChatSelfDestructTimer";

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
  startLiveLocationShare?: (opts?: { durationMs?: number; approximate?: boolean }) => void;
  isSharingLiveLocation?: boolean;
  stopLiveLocationShare?: () => void;
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
  startLiveLocationShare,
  isSharingLiveLocation,
  stopLiveLocationShare,
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
  const { timerValue, onCycleTimer } = useChatSelfDestructTimer(chat);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const onFormatWrap = React.useCallback((key: FormatWrapKey) => {
    const el = inputRef.current;
    if (!el) return;
    const { text, caret } = wrapSelection(el.value, el.selectionStart, el.selectionEnd, key);
    setMsgTextFn(text);
    // The textarea is controlled, so the caret can only be restored after React
    // has committed the new value — the same reason `applyMention` defers.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
      el.style.height = "auto";
      if (el.value) growTextarea(el);
    });
  }, [setMsgTextFn]);
  const mentions = useChatMentions({
    isChannel,
    chat,
    msgText: eMsgText,
    setMsgText: setMsgTextFn,
    inputRef,
  });
  const [showAttachMenu, setShowAttachMenu] = React.useState(false);
  const [showVideoRecorder, setShowVideoRecorder] = React.useState(false);
  const dmMediaInputRef = React.useRef<HTMLInputElement>(null);
  const dmDocInputRef = React.useRef<HTMLInputElement>(null);
  const dmAudioInputRef = React.useRef<HTMLInputElement>(null);
  useEscapeKey(() => {
    setShowAttachMenu(false);
    setShowVideoRecorder(false);
  }, showAttachMenu || showVideoRecorder);

  React.useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.style.height = "auto";
      if (el.value) growTextarea(el);
    });
    return () => cancelAnimationFrame(raf);
  }, [chat.id]);

  useTypingIndicator({
    isChannel,
    enabled: showTyping,
    peerName: chat?.name,
    text: eMsgText,
  });

  const messagePlaceholder = eMorseMode ? t("chat.morsePlaceholder") : t("chat.messagePlaceholder");
  const inputStyle = composerInputStyle(eMorseMode, isDark);

  if (isChannel) {
    const isChannelOwner = !!chat.ownerId && chat.ownerId === userProfile.id;
    return (
      <ChannelComposer
        isDark={isDark}
        isOwner={isChannelOwner}
        isMuted={!!chat.isMuted}
        onToggleMute={() => {
          setChannels?.((prev: any) => prev.map((c: any) => (c.id === chat.id ? { ...c, isMuted: !chat.isMuted } : c)));
          onAction?.("MUTE_TOGGLE");
        }}
        msgText={eMsgText}
        onMsgTextChange={setMsgTextFn}
        morseMode={eMorseMode}
        onSend={(media) => sendMessage(media as any)}
        inputRef={inputRef}
        t={t}
      />
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

      <DmRecorderSlots
        isDark={isDark}
        showVideoRecorder={showVideoRecorder}
        recordingVoice={eIsRecordingVoice}
        onStopVideo={() => setShowVideoRecorder(false)}
        onStopVoice={() => setIsRecordingVoiceFn2(false)}
        onVoiceError={setVoiceNoteErrFn2}
        sendVideoNote={sendVideoNote}
        sendVoiceMessage={sendVoiceMessage}
      />

      <ChatAttachLayer
        isDark={isDark}
        open={showAttachMenu}
        onClose={() => setShowAttachMenu(false)}
        onOpenVideoRecorder={() => setShowVideoRecorder(true)}
        mediaInputRef={dmMediaInputRef}
        docInputRef={dmDocInputRef}
        audioInputRef={dmAudioInputRef}
        sendGeoMessage={sendGeoMessage}
      startLiveLocationShare={startLiveLocationShare}
      isSharingLiveLocation={isSharingLiveLocation}
      stopLiveLocationShare={stopLiveLocationShare}
        sendArticleMessage={sendArticleMessage}
        t={t}
      />

      <div className="message-composer relative shrink-0 mx-2 sm:mx-3 mb-3 mt-1 flex flex-wrap sm:flex-nowrap">
        <MentionSuggestionsMenu
          open={mentions.open}
          suggestions={mentions.suggestions}
          activeIndex={mentions.activeIndex}
          onPick={mentions.applyMention}
          t={t}
        />
        {!eIsRecordingVoice && eMsgText.length > 0 && (
          <ComposerFormatBar onFormat={onFormatWrap} t={t} />
        )}
        <ComposerToolbar
          isDark={isDark}
          hidden={eIsRecordingVoice}
          attachOpen={showAttachMenu}
          onToggleAttach={() => setShowAttachMenu((v) => !v)}
          scheduleActive={!!eScheduleDateTime}
          onToggleSchedule={() => setShowSchedulePopupFn2(!eShowSchedulePopup)}
          stickersOpen={eShowStickerPicker}
          onToggleStickers={() => setShowStickerPickerFn2(!eShowStickerPicker)}
          mediaInputRef={dmMediaInputRef}
          docInputRef={dmDocInputRef}
          audioInputRef={dmAudioInputRef}
          onPickFiles={(event) => {
            handleImageAttach(event, chat, onUpdateChat, eSilentMode);
            event.target.value = "";
          }}
          timerActive={timerValue !== "Off"}
          timerLabel={selfDestructLabel(t, timerValue)}
          onCycleTimer={onCycleTimer}
          t={t}
        />

        <DmComposerRow
          isDark={isDark}
          msgText={eMsgText}
          setMsgText={setMsgTextFn}
          morseMode={eMorseMode}
          onToggleMorse={() => setMorseModeFn2(!eMorseMode)}
          silentMode={eSilentMode}
          onToggleSilent={() => setSilentModeFn2(!eSilentMode)}
          scheduleDateTime={eScheduleDateTime}
          onSend={() => sendMessage()}
          onStartVoiceRecording={() => {
            setVoiceNoteErrFn2("");
            setIsRecordingVoiceFn2(true);
          }}
          onPasteFiles={onPasteFiles}
          inputRef={inputRef}
          mentions={mentions}
          t={t}
        />
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
