import React from "react";
import { motion } from "motion/react";
import { VideoPlayerOverlay } from "./chat/VideoPlayerOverlay";
import { PhotoViewerOverlay } from "./PhotoViewer";

import { ChannelCommentsView } from "./ChannelCommentsView";
import { LiveVoiceRecorder } from "./LiveVoiceRecorder";
import { StickerPicker } from "./chat/StickerPicker";
import { FormattedText } from "./chat-preview/FormattedText";
import { Tooltip } from "./Tooltip";
import { useI18n } from "../lib/i18n";
import { ChatMessageList } from "./ChatMessageList";
import { ContactProfileModal } from "./ContactProfileModal";
import type { ContactProfile } from "./ContactProfileModal";
import { ChatHeader } from "./chat-preview/ChatHeader";
import { SearchBar } from "./chat-preview/SearchBar";
import { ReactionPicker } from "./chat-preview/ReactionPicker";
import { MessageActions } from "./chat-preview/MessageActions";
import { InputFooter } from "./chat-preview/InputFooter";
import { SavedMessagesPanel } from "./chat-preview/SavedMessagesPanel";
import { ChatMediaPanel } from "./chat-preview/ChatMediaPanel";
import { ChatInputArea } from "./chat-preview/ChatInputArea";
import { ScheduledMessages } from "./chat-preview/ScheduledMessages";
import { JumpToBottomButton } from "./chat-preview/JumpToBottomButton";
import { useChatPreviewState } from "../hooks/useChatPreviewState";
import { useChatPreviewTyping } from "../hooks/useChatPreviewTyping";
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
  sendVoiceMessage?: (audioUrl: string, durationStr: string) => void;
  sendStickerMessage?: (sticker: string) => void;
  handleSendMessage?: () => void;
  onScheduleChange?: (value: string) => void;
  onToggleMute?: () => void;
  onAttachImage?: (message: any) => void;
  onToggleSchedulePopup?: () => void;
  onToggleSilent?: () => void;
  onToggleMorse?: () => void;
  onHoldRecord?: () => void;
  onReRecord?: () => void;
  onPermissionDenied?: (message: string) => void;
  onSendVoice?: (url: string, duration: string) => void;
  onToggleStickerPicker?: () => void;
}

export const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onVideoCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, setEditingContact, messageText, setMessageText, morseMode, setMorseMode, silentMode, setSilentMode, showStickerPicker, setShowStickerPicker, isRecordingVoice, setIsRecordingVoice, voiceNoteError, setVoiceNoteError, scheduleDateTime, setScheduleDateTime, showSchedulePopup, setShowSchedulePopup, replyTarget, setReplyTarget: setReplyTargetProp, sendVoiceMessage, sendStickerMessage, handleSendMessage: handleSendMessageProp, onScheduleChange, onToggleMute, onAttachImage, onToggleSchedulePopup, onToggleSilent, onToggleMorse, onHoldRecord, onReRecord, onPermissionDenied, onSendVoice, onToggleStickerPicker, }: ChatPreviewLayerProps) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const isTyping = useChatPreviewTyping(chat.id, chat.online, chat.type);

  const {
    videoOpen, setVideoOpen,
    photoOpen, setPhotoOpen,
    activePhotoUrl, setActivePhotoUrl,
    searchQuery, setSearchQuery,
    showSearch, setShowSearch,
    showMediaPanel, setShowMediaPanel,
    selectedContact, setSelectedContact,
    mediaTab, setMediaTab,
    filterBySender, setFilterBySender,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    showFilterMenu, setShowFilterMenu,
    showComments, setShowComments,
    activePostId, setActivePostId,
    activeReactionPicker, setActiveReactionPicker,
    showSavedPanel, setShowSavedPanel,
    bounceMsgId, setBounceMsgId,
    isNearBottom, setIsNearBottom,
    unreadSinceScroll,
    eMsgText, setMsgTextFn,
    eMorseMode, setMorseModeFn2,
    eSilentMode, setSilentModeFn2,
    eShowStickerPicker, setShowStickerPickerFn2,
    eIsRecordingVoice, setIsRecordingVoiceFn2,
    eVoiceNoteError, setVoiceNoteErrFn2,
    eScheduleDateTime, setScheduleDtFn2,
    eShowSchedulePopup, setShowSchedulePopupFn2,
    eReplyTarget, setReplyTargetFn2,
    swipeReplyId, setSwipeReplyId,
    msgListRef,
    sendMessage,
    handleImageAttach,
    handleReactionMessage,
    mediaItems,
    chatSavedMessages,
    chatScheduledMessages,
    flatItems,
    scheduledQueue,
    stealthMode,
  } = useChatPreviewState(
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
  const setChannels = useAppStore(s => s.setChannels);

  const handleProfileClick = () => {
    const allContacts = useAppStore.getState().contacts;
    const profileContact = allContacts.find((ct: any) => ct.name === chat.name);
    setSelectedContact({
      id: `hash_${chat.id}`,
      name: chat.name,
      color: chat.color,
      lastSeen: chat.online ? 0 : Date.now() - 3600000,
      online: chat.online,
      isFavorite: chat.isFavorite,
      localFields: profileContact?.localFields
    });
  };

  const handleScrollToBottom = () => {
    msgListRef.current?.scrollToBottom();
  };

  const handleCall = () => {
    if (onCall && selectedContact) onCall(selectedContact.name, selectedContact.color);
    setSelectedContact(null);
  };
  const handleVideoCall = () => {
    if (onVideoCall && selectedContact) onVideoCall(selectedContact.name, selectedContact.color);
    setSelectedContact(null);
  };
  const handleMessage = () => {
    if (onMessage && selectedContact) onMessage(selectedContact.name, selectedContact.color);
    setSelectedContact(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`absolute inset-0 w-full h-full flex flex-col overflow-hidden z-50 md:z-40 ${
        isDark
          ? "bg-[var(--bg-secondary)] shadow-[0_32px_64px_rgba(0,0,0,0.8),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-orange-500/10"
          : "bg-[var(--bg-secondary)] shadow-[0_32px_64px_rgba(165,175,190,0.8),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] border border-[var(--border-color)]"
      }`}
    >
      <ChatHeader
        chat={chat}
        isDark={isDark}
        onClose={onClose}
        onProfileClick={handleProfileClick}
        t={t}
        typing={isTyping}
        onSearchToggle={() => setShowSearch(prev => !prev)}
      />

      <SearchBar
        showSearch={showSearch}
        isDark={isDark}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder={t('chat.filters.searchPlaceholder')}
      />

      <ChatMediaPanel
        isDark={isDark}
        showMediaPanel={showMediaPanel}
        showFilterMenu={showFilterMenu}
        setShowFilterMenu={setShowFilterMenu}
        filterBySender={filterBySender}
        setFilterBySender={setFilterBySender}
        filterStartDate={filterStartDate}
        setFilterStartDate={setFilterStartDate}
        filterEndDate={filterEndDate}
        setFilterEndDate={setFilterEndDate}
        mediaTab={mediaTab}
        setMediaTab={setMediaTab}
        mediaItems={mediaItems}
        setActivePhotoUrl={setActivePhotoUrl}
        setPhotoOpen={setPhotoOpen}
        t={t}
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
        onSetActiveReactionPicker={setActiveReactionPicker}
        onSwipeReplyId={setSwipeReplyId}
        onSetVideoOpen={setVideoOpen}
        onSetShowComments={setShowComments}
        onSetActivePostId={setActivePostId}
        onSetBounceMsgId={setBounceMsgId}
        onReactionMessage={handleReactionMessage}
        onAction={onAction}
        onScrollPosition={(nearBottom) => { setIsNearBottom(nearBottom); }}
      />

      <JumpToBottomButton
        isNearBottom={isNearBottom}
        unreadSinceScroll={unreadSinceScroll}
        isDark={isDark}
        onScrollToBottom={handleScrollToBottom}
      />

      <ScheduledMessages
        messages={chatScheduledMessages}
        chatScheduledMessages={chatScheduledMessages}
        scheduledQueue={scheduledQueue}
      />

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
        sendVoiceMessage={sendVoiceMessage}
        sendStickerMessage={sendStickerMessage}
        handleImageAttach={handleImageAttach}
        onUpdateChat={onUpdateChat}
        onAction={onAction}
        setChannels={setChannels}
        theme={theme}
        t={t}
      />

      <VideoPlayerOverlay open={videoOpen} onClose={() => setVideoOpen(false)} theme={theme} />
      <PhotoViewerOverlay open={photoOpen} url={activePhotoUrl} onClose={() => setPhotoOpen(false)} theme={theme} />
      <ChannelCommentsView isOpen={showComments} postId={activePostId || 0} onClose={() => setShowComments(false)} theme={theme} postKey="" channelChatId={chat?.id ? String(chat.id) : ""} />
      <SavedMessagesPanel show={showSavedPanel} isDark={isDark} chatSavedMessages={chatSavedMessages} chatName={chat.name} onClose={() => setShowSavedPanel(false)} onToggleSavedMessage={(chat, msg) => onToggleSavedMessage?.(chat, msg)} t={t} />
      <ContactProfileModal
        contact={selectedContact}
        theme={theme}
        onClose={() => setSelectedContact(null)}
        onCall={handleCall}
        onVideoCall={handleVideoCall}
        onMessage={handleMessage}
        onDelete={() => setSelectedContact(null)}
        onEdit={() => { if (selectedContact) setEditingContact(selectedContact); setSelectedContact(null); }}
        onBlock={() => setSelectedContact(null)}
        onToggleFavorite={(id, isFavorite) => {
          setSelectedContact(prev => prev && prev.id === id ? { ...prev, isFavorite } : prev);
          if (chat) onUpdateChat?.({ ...chat, isFavorite });
        }}
      />
    </motion.div>
  );
};

