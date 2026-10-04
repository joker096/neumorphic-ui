import React from "react";
import { JumpToBottomButton } from "./JumpToBottomButton";
import { ScheduledMessages } from "./ScheduledMessages";
import { ChatInputArea } from "./ChatInputArea";

interface ChatPreviewComposerProps {
  chat: any;
  isDark: boolean;
  theme: "light" | "dark";
  t: (key: string, arg?: any) => string;
  isSharingLiveLocation: boolean;
  /** `useChatPreviewState` return surface. */
  preview: any;
  /** `useChatPreviewInteractions` return surface. */
  interactions: any;
  /** Rendered between the scheduled queue and the composer. */
  banners?: React.ReactNode;
  onUpdateChat?: (chat: any) => void;
  onAction?: (action: string) => void;
  sendVoiceMessage?: (audioUrl: string, durationStr: string, blob?: Blob) => void;
  sendStickerMessage?: (sticker: string) => void;
  setChannels: (updater: any) => void;
  /** Locked sticker-pack upsell target (Settings → Premium). */
  onOpenPremium?: () => void;
}

/**
 * Bottom chrome of the chat preview: unread jump button, scheduled-message
 * queue and the composer itself.
 *
 * `banners` is a slot rendered between the queue and the composer (typing
 * indicator / CRM lead suggestion) so that `ChatPreviewLayer` keeps its
 * original DOM order without prop-drilling every banner field here.
 */
export const ChatPreviewComposer = ({
  chat,
  isDark,
  theme,
  t,
  isSharingLiveLocation,
  preview,
  interactions,
  banners,
  onUpdateChat,
  onAction,
  sendVoiceMessage,
  sendStickerMessage,
  setChannels,
  onOpenPremium,
}: ChatPreviewComposerProps) => {
  const {
    isNearBottom,
    unreadSinceScroll, setUnreadSinceScroll,
    chatScheduledMessages,
    scheduledQueue,
    eMsgText, setMsgTextFn,
    eMorseMode, setMorseModeFn2,
    eSilentMode, setSilentModeFn2,
    eShowStickerPicker, setShowStickerPickerFn2,
    eIsRecordingVoice, setIsRecordingVoiceFn2,
    eVoiceNoteError, setVoiceNoteErrFn2,
    eScheduleDateTime, setScheduleDtFn2,
    eShowSchedulePopup, setShowSchedulePopupFn2,
    eReplyTarget, setReplyTargetFn2,
    sendMessage,
    sendGeoMessage,
    startLiveLocationShare,
    stopLiveLocationShare,
    sendArticleMessage,
    handleImageAttach,
    handleFileDrop,
    sendVideoNote,
  } = preview;
  const { handleScrollToBottom } = interactions;

  return (
    <>
      <JumpToBottomButton
        isNearBottom={isNearBottom}
        unreadSinceScroll={unreadSinceScroll}
        isDark={isDark}
        onScrollToBottom={() => {
          handleScrollToBottom();
          setUnreadSinceScroll(0);
        }}
      />

      <ScheduledMessages
        messages={chatScheduledMessages}
        chatScheduledMessages={chatScheduledMessages}
        scheduledQueue={scheduledQueue}
      />

      {banners}

      <ChatInputArea
        isDark={isDark}
        isChannel={chat.isChannel}
        chat={chat}
        eMsgText={eMsgText}
        setMsgTextFn={setMsgTextFn}
        eMorseMode={eMorseMode}
        setMorseModeFn2={setMorseModeFn2}
        eSilentMode={eSilentMode}
        setSilentModeFn2={setSilentModeFn2}
        eShowStickerPicker={eShowStickerPicker}
        setShowStickerPickerFn2={setShowStickerPickerFn2}
        eIsRecordingVoice={eIsRecordingVoice}
        setIsRecordingVoiceFn2={setIsRecordingVoiceFn2}
        eVoiceNoteError={eVoiceNoteError}
        setVoiceNoteErrFn2={setVoiceNoteErrFn2}
        eScheduleDateTime={eScheduleDateTime}
        setScheduleDtFn2={setScheduleDtFn2}
        eShowSchedulePopup={eShowSchedulePopup}
        setShowSchedulePopupFn2={setShowSchedulePopupFn2}
        eReplyTarget={eReplyTarget}
        setLocalReplyTarget={setReplyTargetFn2}
        sendMessage={sendMessage}
        sendGeoMessage={sendGeoMessage}
        startLiveLocationShare={startLiveLocationShare}
        stopLiveLocationShare={stopLiveLocationShare}
        isSharingLiveLocation={isSharingLiveLocation}
        sendArticleMessage={sendArticleMessage}
        sendVoiceMessage={sendVoiceMessage}
        sendStickerMessage={sendStickerMessage}
        handleImageAttach={handleImageAttach}
        sendVideoNote={sendVideoNote}
        onUpdateChat={onUpdateChat}
        onPasteFiles={(files) => handleFileDrop(files, chat, onUpdateChat)}
        onAction={onAction}
        setChannels={setChannels}
        theme={theme}
        t={t}
        onOpenPremium={onOpenPremium}
      />
    </>
  );
};