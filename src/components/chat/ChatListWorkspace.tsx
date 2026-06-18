import { ChatListView } from "../ChatListView";

type ChatListWorkspaceProps = {
  theme: "light" | "dark";
  view: string;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  filteredChats: any[];
  filteredChannels: any[];
  bots: any[];
  archivedUnreadCount: number;
  toggleArchive: (id: string | number) => void;
  contacts: any[];
  setGlobalSelectedContact: (contact: any | null) => void;
  setActiveChat: (chat: any) => void;
  setView: (view: string) => void;
  setActiveStory: (story: any) => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: Record<string, boolean>;
  t: (key: string, options?: any) => string;
  isDark: boolean;
};

export const ChatListWorkspace = (props: ChatListWorkspaceProps) => (
  <ChatListView {...props} />
);
