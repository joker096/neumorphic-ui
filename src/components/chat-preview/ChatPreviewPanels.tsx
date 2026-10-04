import { ChatHeader } from "./ChatHeader";
import { SearchBar } from "./SearchBar";
import { ChatMediaPanel } from "./ChatMediaPanel";
import { MessageSelectionBar } from "./MessageSelectionBar";
import { PinnedMessagesBar } from "./PinnedMessagesBar";
import { useAppStore } from "../../store";

interface ChatPreviewPanelsProps {
  chat: any;
  isDark: boolean;
  t: (key: string, arg?: any) => string;
  isTyping: boolean;
  /** `useChatPreviewState` return surface. */
  preview: any;
  /** `useChatMessageActions` return surface. */
  msgActions: any;
  /** `useChatPreviewInteractions` return surface. */
  interactions: any;
  onClose: () => void;
  onProfileClick: () => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
}

/**
 * Preview chrome above the message list: header, in-chat search, media panel,
 * selection action bar and pinned-message bar. Rendered in this order by
 * `ChatPreviewLayer`.
 */
export const ChatPreviewPanels = ({
  chat,
  isDark,
  t,
  isTyping,
  preview,
  msgActions,
  interactions,
  onClose,
  onProfileClick,
  onCall,
  onVideoCall,
}: ChatPreviewPanelsProps) => {
  const {
    selectionMode,
    showSearch, setShowSearch,
    searchQuery, setSearchQuery,
    searchTypeFilter, setSearchTypeFilter,
    matchCount, activeMatch, goToPrevMatch, goToNextMatch,
    showMediaPanel,
    showFilterMenu, setShowFilterMenu,
    filterBySender, setFilterBySender,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    mediaTab, setMediaTab,
    mediaItems,
    setActivePhotoUrl, setPhotoOpen, setActiveMediaMsg,
  } = preview;
  const {
    selectedIds,
    handleCancelSelection,
    handleSelectAll,
    handleForwardSelected,
  } = msgActions;
  const {
    handleCopySelected,
    handleSaveSelected,
    confirmBulkDelete,
    handleJumpToPinned,
  } = interactions;
  const pinnedMessageList = useAppStore((s) => s.pinnedMessageList);

  return (
    <>
      {!selectionMode && (
        <ChatHeader
          chat={chat}
          isDark={isDark}
          onClose={onClose}
          onProfileClick={onProfileClick}
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
    </>
  );
};