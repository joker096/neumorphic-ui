import React from "react";
import { motion } from "motion/react";
import { useI18n } from "../lib/i18n";
import { ChatMessageList } from "./ChatMessageList";
import { PinnedMessagesBar } from "./chat-preview/PinnedMessagesBar";
import { MessageSelectionBar } from "./chat-preview/MessageSelectionBar";
import { ChatHeader } from "./chat-preview/ChatHeader";
import { SearchBar } from "./chat-preview/SearchBar";
import { ChatMediaPanel } from "./chat-preview/ChatMediaPanel";
import { ChatInputArea } from "./chat-preview/ChatInputArea";
import { ScheduledMessages } from "./chat-preview/ScheduledMessages";
import { JumpToBottomButton } from "./chat-preview/JumpToBottomButton";
import { ChatPreviewOverlays } from "./ChatPreviewOverlays";
import type { ContactProfile } from "./ContactProfileModal";
import { useChatPreviewState } from "../hooks/useChatPreviewState";
import { useChatPreviewTyping } from "../hooks/useChatPreviewTyping";
import { useChatMessageActions } from "../hooks/useChatMessageActions";
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
  onForward?: (msg: any) => void;
  onDelete?: (msg: any) => void;
}

export const ChatPreviewLayer = ({ chat, theme, onClose, onAction, onCall, onVideoCall, onMessage, onUpdateChat, onReply, savedMessages = [], onToggleSavedMessage, deliveryReceipts = true, readReceipts = true, setEditingContact, messageText, setMessageText, morseMode, setMorseMode, silentMode, setSilentMode, showStickerPicker, setShowStickerPicker, isRecordingVoice, setIsRecordingVoice, voiceNoteError, setVoiceNoteError, scheduleDateTime, setScheduleDateTime, showSchedulePopup, setShowSchedulePopup, replyTarget, setReplyTarget: setReplyTargetProp, sendVoiceMessage, sendStickerMessage, handleSendMessage: handleSendMessageProp, onScheduleChange, onToggleMute, onAttachImage, onToggleSchedulePopup, onToggleSilent, onToggleMorse, onHoldRecord, onReRecord, onPermissionDenied,   onSendVoice, onToggleStickerPicker, onForward, onDelete }: ChatPreviewLayerProps) => {
  const isDark = theme === "dark";
  const { t } = useI18n();
  const isTyping = useChatPreviewTyping(chat.id, chat.name, chat.online, chat.type);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const pinnedMessageList = useAppStore((s) => s.pinnedMessageList);
  const userProfile = useAppStore((s) => s.userProfile);
  // File drag & drop: same posting rights as the composer (channels — owner only).
  const canAttachFiles = !chat.isChannel || (!!chat.ownerId && chat.ownerId === userProfile?.id);

  const {
    selectionMode,
    selectedIds,
    handleForwardMessage,
    handleDeleteMessage,
    handleEnterSelection,
    handleToggleSelect,
    handleSelectAll,
    handleCancelSelection,
    handleForwardSelected,
    handleDeleteSelected,
  } = useChatMessageActions({ chatId: chat.id, onForward, onDelete, onUpdateChat });

  const handleJumpToPinned = (id: number) => {
    const messages = (chat.messages || []) as any[];
    const idx = messages.findIndex((m) => m.id === id);
    if (idx >= 0 && msgListRef.current) {
      (msgListRef.current as any).scrollToIndex?.(idx);
    }
  };

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
    searchTypeFilter, setSearchTypeFilter,
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
    handleFileDrop,
    handleReactionMessage,
    mediaItems,
    chatSavedMessages,
    chatScheduledMessages,
    flatItems,
    matchCount,
    activeMatch,
    goToNextMatch,
    goToPrevMatch,
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

  // Deep-link: jump to a message when opened via search (chat carries __jumpToMessageId).
  React.useEffect(() => {
    const target = (chat as any)?.__jumpToMessageId;
    if (target == null) return;
    const idx = flatItems.findIndex((item: any) => !item._isDateSeparator && item.id === target);
    if (idx >= 0) setIsNearBottom(false);
    const frame = window.requestAnimationFrame(() => {
      if (idx >= 0) (msgListRef.current as any)?.scrollToIndex?.(idx, "center");
      if (onUpdateChat) onUpdateChat({ ...chat, __jumpToMessageId: undefined });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [chat.id, (chat as any)?.__jumpToMessageId]);

  const handleProfileClick = () => {
    const groupish = chat.type === 'group' || chat.type === 'channel' || chat.type === 'bot' || chat.isChannel;
    if (groupish) {
      setProfileOpen(true);
      return;
    }
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onDragOver={canAttachFiles ? (e) => e.preventDefault() : undefined}
      onDrop={canAttachFiles ? (e) => { e.preventDefault(); handleFileDrop(e.dataTransfer?.files, chat, onUpdateChat); } : undefined}
      className={`absolute inset-0 w-full h-full flex flex-col overflow-hidden z-50 md:z-40 ${
        isDark
          ? "bg-[var(--bg-secondary)] shadow-[0_32px_64px_rgba(0,0,0,0.8),_inset_0_1.5px_2px_rgba(255,255,255,0.05),_inset_0_-2px_4px_rgba(0,0,0,0.9)] rounded-2xl"
          : "bg-[var(--bg-secondary)] shadow-[0_32px_64px_rgba(165,175,190,0.8),_inset_1.5px_1.5px_3px_rgba(255,255,255,1)] rounded-2xl"
      }`}
    >
      <ChatHeader
        chat={chat}
        isDark={isDark}
        onClose={onClose}
        onProfileClick={handleProfileClick}
        t={t}
        typing={isTyping}
        onCall={onCall}
        onVideoCall={onVideoCall}
        onSearchToggle={() => setShowSearch(prev => !prev)}
      />

      <SearchBar
        showSearch={showSearch}
        isDark={isDark}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder={t('chat.filters.searchPlaceholder')}
        searchTypeFilter={searchTypeFilter}
        onSearchTypeChange={setSearchTypeFilter}
        matchCount={matchCount}
        activeMatch={activeMatch}
        onPrevMatch={goToPrevMatch}
        onNextMatch={goToNextMatch}
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

      {selectionMode && (
        <MessageSelectionBar
          isDark={isDark}
          count={selectedIds.size}
          onCancel={handleCancelSelection}
          onSelectAll={() => handleSelectAll(chat.messages || [])}
          onForward={() => handleForwardSelected(chat.messages || [])}
          onDelete={() => handleDeleteSelected(chat.messages || [])}
        />
      )}

      <PinnedMessagesBar
        chatId={chat.id}
        messages={chat.messages || []}
        pinnedMessages={pinnedMessageList}
        isDark={isDark}
        onUnpin={(id) => useAppStore.getState().removePinnedMessage(id)}
        onJump={handleJumpToPinned}
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
          onForward={handleForwardMessage}
          onDelete={handleDeleteMessage}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelect={handleEnterSelection}
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

      {isTyping && !chat.isChannel && (
        <div className="px-4 sm:px-6 pb-1 flex justify-start">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl rounded-bl-md ${
              isDark
                ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]/60"
                : "bg-white/70 border border-[var(--border-color)]/60"
            } shadow-[0_2px_4px_rgba(0,0,0,0.12)]`}
            aria-live="polite"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce`}
              style={{ animationDelay: "0ms" }}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce`}
              style={{ animationDelay: "150ms" }}
            />
            <span
              className={`w-1.5 h-1.5 rounded-full bg-[var(--text-secondary)] animate-bounce`}
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}

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
        onPasteFiles={(files) => handleFileDrop(files, chat, onUpdateChat)}
        onAction={onAction}
        setChannels={setChannels}
        theme={theme}
        t={t}
      />

      <ChatPreviewOverlays
        chat={chat}
        isDark={isDark}
        theme={theme}
        photoOpen={photoOpen}
        videoOpen={videoOpen}
        activePhotoUrl={activePhotoUrl}
        setPhotoOpen={setPhotoOpen}
        setVideoOpen={setVideoOpen}
        showComments={showComments}
        activePostId={activePostId}
        setShowComments={setShowComments}
        showSavedPanel={showSavedPanel}
        setShowSavedPanel={setShowSavedPanel}
        chatSavedMessages={chatSavedMessages}
        onToggleSavedMessage={onToggleSavedMessage}
        t={t}
        selectedContact={selectedContact}
        setSelectedContact={setSelectedContact as React.Dispatch<React.SetStateAction<ContactProfile | null>>}
        setEditingContact={setEditingContact}
        onUpdateChat={onUpdateChat}
        onCall={onCall}
        onVideoCall={onVideoCall}
        onMessage={onMessage}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        onClosePreview={onClose}
      />
    </motion.div>
  );
};
