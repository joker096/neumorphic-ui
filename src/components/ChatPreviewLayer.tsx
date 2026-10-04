import React from "react";
import { motion, type PanInfo } from "motion/react";
import { useI18n } from "../lib/i18n";
import { ChatMessageList } from "./ChatMessageList";
import { ChatPreviewPanels } from "./chat-preview/ChatPreviewPanels";
import { ChatPreviewComposer } from "./chat-preview/ChatPreviewComposer";
import { ChatPreviewStatusBanners } from "./chat-preview/ChatPreviewStatusBanners";
import { ChatPreviewDialogs } from "./chat-preview/ChatPreviewDialogs";
import { useChatPreviewInteractions } from "./chat-preview/useChatPreviewInteractions";
import { ChatPreviewOverlays } from "./ChatPreviewOverlays";
import type { ContactProfile } from "./ContactProfileModal";
import { useChatPreviewState } from "../hooks/useChatPreviewState";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useChatPreviewTyping } from "../hooks/useChatPreviewTyping";
import { useChatMessageActions } from "../hooks/useChatMessageActions";
import { useMessageForward } from "../hooks/useMessageForward";
import { useAppStore } from "../store";

interface ChatPreviewLayerProps {
  chat: any;
  theme: "light" | "dark";
  onClose: () => void;
  onAction?: (action: string) => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  onUpdateChat?: (chat: any) => void;
  onReply?: (message: any) => void;
  savedMessages?: any[];
  onToggleSavedMessage?: (chat: any, message: any) => void;
  deliveryReceipts?: boolean;
  readReceipts?: boolean;
  setEditingContact: (contact: ContactProfile | null) => void;
  messageText?: string;
  setMessageText?: (text: string) => void;
  morseMode?: boolean;
  setMorseMode?: (mode: boolean) => void;
  silentMode?: boolean;
  setSilentMode?: (mode: boolean) => void;
  showStickerPicker?: boolean;
  setShowStickerPicker?: (show: boolean) => void;
  isRecordingVoice?: boolean;
  setIsRecordingVoice?: (recording: boolean) => void;
  voiceNoteError?: string;
  setVoiceNoteError?: (error: string) => void;
  scheduleDateTime?: string;
  setScheduleDateTime?: (value: string) => void;
  showSchedulePopup?: boolean;
  setShowSchedulePopup?: (show: boolean) => void;
  replyTarget?: any;
  setReplyTarget?: (target: any) => void;
  draftTextByChat?: Record<string, string>;
  setDraftTextByChat?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setChats?: (updater: any[] | ((prev: any[]) => any[])) => void;
  sendVoiceMessage?: (audioUrl: string, durationStr: string, blob?: Blob) => void;
  sendStickerMessage?: (sticker: string) => void;
  handleSendMessage?: () => void;
  onScheduleChange?: (value: string) => void;
  onToggleMute?: () => void;
  onAttachImage?: (message: any) => void;
  onToggleSchedulePopup?: () => void;
  onToggleSilent?: () => void;
  onToggleMorse?: () => void;
  onToggleStickerPicker?: () => void;
  onDelete?: (msg: any) => void;
  /** Locked sticker-pack upsell target (Settings → Premium). */
  onOpenPremium?: () => void;
}

export const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onVideoCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, setEditingContact, messageText, setMessageText, morseMode, setMorseMode, silentMode, setSilentMode, showStickerPicker, setShowStickerPicker, isRecordingVoice, setIsRecordingVoice, voiceNoteError, setVoiceNoteError, scheduleDateTime, setScheduleDateTime, showSchedulePopup, setShowSchedulePopup, replyTarget, setReplyTarget: setReplyTargetProp, sendVoiceMessage, sendStickerMessage, handleSendMessage: handleSendMessageProp, onScheduleChange, onToggleMute, onAttachImage, onToggleSchedulePopup, onToggleSilent, onToggleMorse, onToggleStickerPicker, onDelete, onOpenPremium }: ChatPreviewLayerProps) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const isMobile = useIsMobile();
  const isTyping = useChatPreviewTyping(chat.id, chat.name, chat.online, chat.type);
  const userProfile = useAppStore((s) => s.userProfile);
  // File drag & drop: same posting rights as the composer (channels — owner only).
  const canAttachFiles = !chat.isChannel || (!!chat.ownerId && chat.ownerId === userProfile?.id);
  const setChannels = useAppStore((s) => s.setChannels);
  const isSharingLiveLocation = useAppStore((s) => s.liveShare?.isLive === true);

  const { forwardOpen, openForward, closeForward, forwardTo } = useMessageForward(chat);
  const msgActions = useChatMessageActions({ chatId: chat.id, onForward: openForward, onDelete, onUpdateChat });
  const { selectionMode, selectedIds } = msgActions;

  const preview = useChatPreviewState(
    chat, onUpdateChat, onReply, savedMessages, onToggleSavedMessage,
    deliveryReceipts, readReceipts,
    messageText, setMessageText,
    morseMode, setMorseMode,
    silentMode, setSilentMode,
    showStickerPicker, setShowStickerPicker,
    isRecordingVoice, setIsRecordingVoice,
    voiceNoteError, setVoiceNoteError,
    scheduleDateTime, setScheduleDateTime,
    showSchedulePopup, setShowSchedulePopup,
    replyTarget, setReplyTargetProp,
  );

  const interactions = useChatPreviewInteractions({
    chat,
    t,
    onUpdateChat,
    onToggleSavedMessage,
    msgListRef: preview.msgListRef,
    flatItems: preview.flatItems,
    selectedIds: msgActions.selectedIds,
    chatSavedMessages: preview.chatSavedMessages,
    setSelectedContact: preview.setSelectedContact,
    setIsNearBottom: preview.setIsNearBottom,
    handleDeleteMessage: msgActions.handleDeleteMessage,
    handleDeleteSelected: msgActions.handleDeleteSelected,
  });

  const {
    msgListRef,
    flatItems,
    isNearBottom, setIsNearBottom,
    unreadSinceScroll,
    searchQuery,
    swipeReplyId,
    activeReactionPicker, setActiveReactionPicker,
    setShowSearch,
    setActivePhotoUrl, setPhotoOpen, setActiveMediaMsg, setVideoOpen,
    setShowComments, setActivePostId, setBounceMsgId,
    handleFileDrop,
    handleReactionMessage,
    retryFailedMessage,
    chatSavedMessages,
    stealthMode,
  } = preview;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      drag={isMobile && !selectionMode && !showStickerPicker && !preview.showMediaPanel ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.35 }}
      onDragEnd={(_: unknown, info: PanInfo) => {
        if (info.offset.x > 90 || info.velocity.x > 600) onClose?.();
      }}
      onDragOver={canAttachFiles ? (e) => e.preventDefault() : undefined}
      onDrop={canAttachFiles ? (e) => { e.preventDefault(); handleFileDrop(e.dataTransfer?.files, chat, onUpdateChat); } : undefined}
      className={`chat-surface glass-panel absolute inset-0 w-full h-full flex flex-col overflow-hidden z-50 md:z-40 rounded-2xl`}
    >
      <ChatPreviewPanels
        chat={chat}
        isDark={isDark}
        t={t}
        isTyping={isTyping}
        preview={preview}
        msgActions={msgActions}
        interactions={interactions}
        onClose={onClose}
        onProfileClick={interactions.handleProfileClick}
        onCall={onCall}
        onVideoCall={onVideoCall}
      />

      <ChatMessageList
        msgListRef={msgListRef}
        flatItems={flatItems}
        isNearBottom={isNearBottom}
        isDark={isDark}
        chat={chat}
        stealthMode={stealthMode}
        deliveryReceipts={deliveryReceipts}
        readReceipts={readReceipts}
        chatSavedMessages={chatSavedMessages}
        searchQuery={searchQuery}
        swipeReplyId={swipeReplyId}
        activeReactionPicker={activeReactionPicker}
        theme={theme}
        onReply={(m) => onReply?.(m)}
        onToggleSavedMessage={(c, m) => onToggleSavedMessage?.(c, m)}
        onSetActivePhotoUrl={setActivePhotoUrl}
        onSetPhotoOpen={setPhotoOpen}
        onSetActiveMediaMsg={setActiveMediaMsg}
        onSetActiveReactionPicker={setActiveReactionPicker}
        onSwipeReplyId={preview.setSwipeReplyId}
        onSetVideoOpen={setVideoOpen}
        onSetShowComments={setShowComments}
        onSetActivePostId={setActivePostId}
        onSetBounceMsgId={setBounceMsgId}
        onReactionMessage={handleReactionMessage}
        onAction={onAction}
        onForward={msgActions.handleForwardMessage}
        onDelete={interactions.confirmSingleDelete}
        onRetry={retryFailedMessage}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={msgActions.handleToggleSelect}
        onSelect={msgActions.handleEnterSelection}
        onScrollPosition={(nearBottom) => { setIsNearBottom(nearBottom); }}
      />

      <ChatPreviewComposer
        chat={chat}
        isDark={isDark}
        theme={theme}
        t={t}
        isSharingLiveLocation={isSharingLiveLocation}
        preview={preview}
        interactions={interactions}
        banners={
          <ChatPreviewStatusBanners
            isDark={isDark}
            isTyping={isTyping}
            isChannel={chat.isChannel}
            t={t}
            interactions={interactions}
          />
        }
        onUpdateChat={onUpdateChat}
        onAction={onAction}
        sendVoiceMessage={sendVoiceMessage}
        sendStickerMessage={sendStickerMessage}
        setChannels={setChannels}
        onOpenPremium={onOpenPremium}
      />

      <ChatPreviewOverlays
        chat={chat}
        isDark={isDark}
        theme={theme}
        photoOpen={preview.photoOpen}
        videoOpen={preview.videoOpen}
        activePhotoUrl={preview.activePhotoUrl}
        activeMediaMsg={preview.activeMediaMsg}
        setActiveMediaMsg={setActiveMediaMsg}
        setPhotoOpen={setPhotoOpen}
        setVideoOpen={setVideoOpen}
        showComments={preview.showComments}
        activePostId={preview.activePostId}
        setShowComments={setShowComments}
        showSavedPanel={preview.showSavedPanel}
        setShowSavedPanel={preview.setShowSavedPanel}
        chatSavedMessages={chatSavedMessages}
        onToggleSavedMessage={onToggleSavedMessage}
        onForward={msgActions.handleForwardMessage}
        onDelete={interactions.confirmSingleDelete}
        t={t}
        selectedContact={preview.selectedContact}
        setSelectedContact={preview.setSelectedContact as React.Dispatch<React.SetStateAction<ContactProfile | null>>}
        setEditingContact={setEditingContact}
        onUpdateChat={onUpdateChat}
        onCall={onCall}
        onVideoCall={onVideoCall}
        onMessage={onMessage}
        profileOpen={interactions.profileOpen}
        setProfileOpen={interactions.setProfileOpen}
        onClosePreview={onClose}
      />

      <ChatPreviewDialogs
        chat={chat}
        theme={theme}
        t={t}
        interactions={interactions}
        forwardOpen={forwardOpen}
        closeForward={closeForward}
        forwardTo={forwardTo}
      />
    </motion.div>
  );
};