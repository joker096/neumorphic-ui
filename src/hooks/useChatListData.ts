import { useState } from "react";
import { useAppStore } from "../store";
import { useUiStore } from "../store/uiStore";
import { useFilteredChats } from "./useFilteredChats";
import { useUnreadCount } from "./useUnreadCount";
import { useArchivedUnreadCount } from "./useArchivedUnreadCount";

/**
 * Chat-list surface data for the app shell: folder/search/sort state plus the
 * filtered lists, unread badges and the contacts the shell forwards to the side
 * list. Sourced here (not drilled from `App`) because every input is store
 * state or list-local UI state.
 */
export const useChatListData = () => {
  const advancedFilters = useUiStore(s => s.advancedFilters);
  const chats = useAppStore(s => s.chats);
  const setChats = useAppStore(s => s.setChats);
  const channels = useAppStore(s => s.channels);
  const contacts = useAppStore(s => s.contacts);
  const setContacts = useAppStore(s => s.setContacts);
  const bots = useAppStore(s => s.bots);
  const archivedChats = useAppStore(s => s.archivedChats);
  const spamFilter = useAppStore(s => s.spamFilter);
  const crmContacts = useAppStore(s => s.crmContacts);
  const toggleArchive = useAppStore(s => s.toggleArchive);

  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [chatSortBy, setChatSortBy] = useState<'recent' | 'alpha'>('recent');
  const [chatSearchQuery, setChatSearchQuery] = useState("");

  const { filteredChats, filteredChannels } = useFilteredChats(
    chats,
    chatSearchQuery,
    activeFolder,
    archivedChats,
    advancedFilters,
    channels,
    contacts,
    spamFilter,
    chatSortBy,
    crmContacts,
  );

  const { chatsUnread, companyUnread } = useUnreadCount(chats, channels);
  const archivedUnreadCount = useArchivedUnreadCount(chats, channels, archivedChats);

  return {
    chatsUnread,
    companyUnread,
    activeFolder,
    setActiveFolder,
    chatSearchQuery,
    setChatSearchQuery,
    chatSortBy,
    setChatSortBy,
    filteredChats,
    filteredChannels,
    bots,
    archivedUnreadCount,
    toggleArchive,
    contacts,
    setContacts,
    chats,
    setChats,
  };
};
