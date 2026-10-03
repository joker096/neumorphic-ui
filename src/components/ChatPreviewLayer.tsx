import React from "react";
import { motion, type PanInfo } from "motion/react";
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
import { useIsMobile } from "../hooks/useMediaQuery";
import { useChatPreviewTyping } from "../hooks/useChatPreviewTyping";
import { useChatMessageActions } from "../hooks/useChatMessageActions";
import { useMessageForward } from "../hooks/useMessageForward";
import { useAppStore } from "../store";
import { ChatPickerModal } from "./payments/ChatPickerModal";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
import { toast } from "./ui/Toast";
import { CrmLeadSuggestionBar } from "./crm/CrmLeadSuggestionBar";
import { resolveLeadSuggestion } from "../lib/crm/leadSuggestion";

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
  const [profileOpen, setProfileOpen] = React.useState(false);
  const pinnedMessageList = useAppStore((s) => s.pinnedMessageList);
  const userProfile = useAppStore((s) => s.userProfile);
  // File drag & drop: same posting rights as the composer (channels — owner only).
  const canAttachFiles = !chat.isChannel || (!!chat.ownerId && chat.ownerId === userProfile?.id);
  const { forwardOpen, openForward, closeForward, forwardTo } = useMessageForward(chat);

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
  } = useChatMessageActions({ chatId: chat.id, onForward: openForward, onDelete, onUpdateChat });

  const [deleteConfirm, setDeleteConfirm] = React.useState<{ kind: "single" | "bulk"; msg?: any } | null>(null);

  const confirmSingleDelete = (msg: any) => setDeleteConfirm({ kind: "single", msg });
  const confirmBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirm({ kind: "bulk" });
  };
  const cancelDelete = () => setDeleteConfirm(null);
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.kind === "single") handleDeleteMessage(deleteConfirm.msg);
    else handleDeleteSelected(chat.messages || []);
    setDeleteConfirm(null);
  };

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
    activeMediaMsg, setActiveMediaMsg,
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
    unreadSinceScroll, setUnreadSinceScroll,
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
    sendGeoMessage,
    startLiveLocationShare,
    stopLiveLocationShare,
    sendArticleMessage,
    handleImageAttach,
    handleFileDrop,
    sendVideoNote,
    handleReactionMessage,
    retryFailedMessage,
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
  const isSharingLiveLocation = useAppStore(s => s.liveShare?.isLive === true);

  // Unknown incoming contact → suggest saving them as a CRM lead.
  const contacts = useAppStore((s) => s.contacts);
  const crmContacts = useAppStore((s) => s.crmContacts);
  const [dismissedLeadChats, setDismissedLeadChats] = React.useState<string[]>([]);
  const leadSuggestion = React.useMemo(
    () => resolveLeadSuggestion(chat, contacts, crmContacts),
    [chat, contacts, crmContacts],
  );
  const leadSuggestionVisible = !!leadSuggestion && !dismissedLeadChats.includes(String(chat.id));
  const addLeadSuggestion = () => {
    if (!leadSuggestion) return;
    useAppStore.getState().syncMessengerContacts([leadSuggestion.contact]);
    toast(t("crm.leadAdded", "Lead added to CRM"));
    setDismissedLeadChats((prev) => [...prev, String(chat.id)]);
  };
  const dismissLeadSuggestion = () => setDismissedLeadChats((prev) => [...prev, String(chat.id)]);

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
      // Real liveness only: useChatPresence stamps chat.lastSeen on peer
      // disconnect and real contacts carry it from creation/import.
      // 0 = unknown, which ContactProfileModal renders as "—".
      lastSeen: chat.online ? 0 : (chat.lastSeen ?? profileContact?.lastSeen ?? 0),
      online: chat.online,
      isFavorite: chat.isFavorite,
      localFields: profileContact?.localFields
    });
  };

  const handleScrollToBottom = () => {
    msgListRef.current?.scrollToBottom();
  };

  const selectedMessages = (chat.messages || []).filter((m: any) => selectedIds.has(m.id));
  const handleCopySelected = async () => {
    const texts = selectedMessages
      .map((m: any) => (typeof m.text === "string" ? m.text : ""))
      .filter(Boolean)
      .join("\n");
    if (!texts) return;
    try {
      await navigator.clipboard.writeText(texts);
      toast(t("chat.copied", "Copied"));
    } catch {
      /* clipboard unavailable */
    }
  };
  const handleSaveSelected = () => {
    const savedKeys = new Set(chatSavedMessages.map((m: any) => m.messageId));
    let added = 0;
    for (const m of selectedMessages) {
      if (!savedKeys.has(m.id)) {
        onToggleSavedMessage?.(chat, m);
        added += 1;
      }
    }
    if (added > 0) toast(t("chat.saved", "Saved"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      drag={isMobile && !selectionMode && !showStickerPicker && !showMediaPanel ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.35 }}
      onDragEnd={(_: unknown, info: PanInfo) => {
        if (info.offset.x > 90 || info.velocity.x > 600) onClose?.();
      }}
      onDragOver={canAttachFiles ? (e) => e.preventDefault() : undefined}
      onDrop={canAttachFiles ? (e) => { e.preventDefault(); handleFileDrop(e.dataTransfer?.files, chat, onUpdateChat); } : undefined}
      className={`chat-surface glass-panel absolute inset-0 w-full h-full flex flex-col overflow-hidden z-50 md:z-40 rounded-2xl`}
    >
      {!selectionMode && (
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
      )}

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
        setActiveMediaMsg={setActiveMediaMsg}
        t={t}
      />

      {selectionMode && (
        <MessageSelectionBar
          isDark={isDark}
          count={selectedIds.size}
          onCancel={handleCancelSelection}
          onSelectAll={() => handleSelectAll(chat.history || [])}
          onForward={() => handleForwardSelected(chat.history || [])}
          onCopy={handleCopySelected}
          onSave={handleSaveSelected}
          onDelete={confirmBulkDelete}
        />
      )}

      <PinnedMessagesBar
        chatId={chat.id}
        messages={chat.history || []}
        pinnedMessages={pinnedMessageList}
        isDark={isDark}
        onUnpin={(id) => useAppStore.getState().removePinnedMessage(id, chat.id)}
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
        onSetActiveMediaMsg={setActiveMediaMsg}
        onSetActiveReactionPicker={setActiveReactionPicker}
        onSwipeReplyId={setSwipeReplyId}
        onSetVideoOpen={setVideoOpen}
        onSetShowComments={setShowComments}
        onSetActivePostId={setActivePostId}
        onSetBounceMsgId={setBounceMsgId}
        onReactionMessage={handleReactionMessage}
        onAction={onAction}
          onForward={handleForwardMessage}
          onDelete={confirmSingleDelete}
          onRetry={retryFailedMessage}
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

      {isTyping && !chat.isChannel && (
        <div className="px-4 sm:px-6 pb-1 flex justify-start">
          <div
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl rounded-bl-md ${
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

      {leadSuggestionVisible && leadSuggestion && (
        <CrmLeadSuggestionBar
          hint={t("crm.suggestLeadHint", { detail: leadSuggestion.detail })}
          actionLabel={t("crm.suggestLead", "Add")}
          dismissLabel={t("crm.dismissSuggestion", "Dismiss")}
          onAdd={addLeadSuggestion}
          onDismiss={dismissLeadSuggestion}
        />
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

      <ChatPreviewOverlays
        chat={chat}
        isDark={isDark}
        theme={theme}
        photoOpen={photoOpen}
        videoOpen={videoOpen}
        activePhotoUrl={activePhotoUrl}
        activeMediaMsg={activeMediaMsg}
        setActiveMediaMsg={setActiveMediaMsg}
        setPhotoOpen={setPhotoOpen}
        setVideoOpen={setVideoOpen}
        showComments={showComments}
        activePostId={activePostId}
        setShowComments={setShowComments}
        showSavedPanel={showSavedPanel}
        setShowSavedPanel={setShowSavedPanel}
        chatSavedMessages={chatSavedMessages}
        onToggleSavedMessage={onToggleSavedMessage}
        onForward={handleForwardMessage}
        onDelete={confirmSingleDelete}
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

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title={
          deleteConfirm?.kind === "bulk"
            ? t("chat.bulkDeleteMessageConfirm", { count: selectedIds.size })
            : t("chat.deleteMessageConfirm", "Delete this message?")
        }
        message={deleteConfirm?.kind === "bulk" ? "" : undefined}
        variant="danger"
        theme={theme}
        confirmLabel={t("chat.delete")}
        cancelLabel={t("common.cancel")}
        confirmIcon={<Trash2 size={18} />}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <ChatPickerModal
        open={forwardOpen}
        onClose={closeForward}
        onPick={forwardTo}
        title={t("chat.forward", "Forward")}
        excludeChatId={chat.id}
      />
    </motion.div>
  );
};
