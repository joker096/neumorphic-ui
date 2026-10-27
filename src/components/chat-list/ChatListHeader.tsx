import type { ChatFolder } from "../../lib/chat/customFolders";
import { StoriesStrip } from "../../features/stories/components/StoriesStrip";
import {
  BulkActionsBar,
  ChatListSearchHeader,
  ChatListSortControls,
  FolderFilterBar,
  ViewTabs,
} from "../chat-preview";
import { CrmNextStepsBanner } from "../crm/CrmNextStepsBanner";

type Translate = (key: string, options?: any) => string;

interface ChatListHeaderProps {
  isDark?: boolean;
  view: string;
  archivedUnreadCount: number;
  t: Translate;
  setView: (view: string) => void;
  setActiveFolder: (folder: string) => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
  setShowCreateGroup?: (show: boolean) => void;
  onOpenGlobalSearch: () => void;
  premium: boolean;
  onOpenTasks: () => void;
  activeFolder: string;
  advancedFilters: Record<string, boolean>;
  setShowAdvancedFilterModal: (show: boolean) => void;
  segments: readonly string[];
  folderUnread?: Record<string, number>;
  customFolders?: ChatFolder[];
  onEditFolders: () => void;
  chatSortBy?: "recent" | "alpha";
  setChatSortBy?: (sort: "recent" | "alpha") => void;
  hasFilteredUnread: boolean;
  onMarkAllRead: () => void;
  onComposeStory?: () => void;
  canShowBulk: boolean;
  selectMode: boolean;
  selectedIds: Set<string | number>;
  onCancel: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onToggleMute: () => void;
}

export const ChatListHeader = ({
  isDark,
  view,
  archivedUnreadCount,
  t,
  setView,
  setActiveFolder,
  setShowCreateChannel,
  setShowCreateBot,
  setShowCreateGroup,
  onOpenGlobalSearch,
  premium,
  onOpenTasks,
  activeFolder,
  advancedFilters,
  setShowAdvancedFilterModal,
  segments,
  folderUnread,
  customFolders,
  onEditFolders,
  chatSortBy,
  setChatSortBy,
  hasFilteredUnread,
  onMarkAllRead,
  onComposeStory,
  canShowBulk,
  selectMode,
  selectedIds,
  onCancel,
  onArchive,
  onDelete,
  onMarkRead,
  onToggleMute,
}: ChatListHeaderProps) => {
  return (
    <>
      <ChatListSearchHeader
        isDark={isDark}
        view={view}
        archivedUnreadCount={archivedUnreadCount}
        t={t}
        setView={setView}
        setActiveFolder={setActiveFolder}
        setShowCreateChannel={setShowCreateChannel}
        setShowCreateBot={setShowCreateBot}
        setShowCreateGroup={setShowCreateGroup}
        onOpenGlobalSearch={onOpenGlobalSearch}
      />
      <ViewTabs view={view} onSelect={setView} t={t} />

      {view === "chats" && premium && <CrmNextStepsBanner onOpenTasks={onOpenTasks} />}

      {/* Stories sit directly under the tabs, above folders — Telegram order. */}
      {view === "chats" && <StoriesStrip t={t} onComposeStory={onComposeStory} />}

      {view === "chats" && (
        <>
          <FolderFilterBar
            activeFolder={activeFolder}
            setActiveFolder={setActiveFolder}
            advancedFilters={advancedFilters}
            setShowAdvancedFilterModal={setShowAdvancedFilterModal}
            t={t}
            segments={segments}
            folderUnread={folderUnread}
            customFolders={customFolders}
            onEditFolders={onEditFolders}
          />
          <ChatListSortControls
            chatSortBy={chatSortBy}
            setChatSortBy={setChatSortBy}
            hasFilteredUnread={hasFilteredUnread}
            onMarkAllRead={onMarkAllRead}
            t={t}
            isDark={isDark}
          />
        </>
      )}

      {view === "chats" && canShowBulk && selectMode && (
        <BulkActionsBar
          selectedIds={selectedIds}
          t={t}
          onCancel={onCancel}
          onArchive={onArchive}
          onDelete={onDelete}
          onMarkRead={onMarkRead}
          onToggleMute={onToggleMute}
        />
      )}
    </>
  );
};
