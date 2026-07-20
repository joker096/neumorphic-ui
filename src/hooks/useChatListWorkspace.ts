import React, { useMemo } from "react";

export interface ChatListWorkspaceArgs {
  theme: "light" | "dark";
  view: string;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  filteredChats: any[];
  filteredChannels: any[];
  bots: any[];
  archivedChats: any[];
  chats: any[];
  channels: any[];
  toggleArchive: (id: string | number) => void;
  contacts: any[];
  setGlobalSelectedContact: (contact: any) => void;
  setActiveChat: (chat: any) => void;
  setView: React.Dispatch<React.SetStateAction<string>>;
  setActiveStory: (story: any) => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: any;
  t: (key: string) => string;
  isDark: boolean;
  onCall: (name?: string, color?: string, type?: string) => void;
  onVideoCall: (name: string, color?: string) => void;
}

export function useChatListWorkspace(args: ChatListWorkspaceArgs) {
  const {
    theme, view, activeFolder, setActiveFolder, chatSearchQuery, setChatSearchQuery,
    filteredChats, filteredChannels, bots, archivedChats, chats, channels, toggleArchive,
    contacts, setGlobalSelectedContact, setActiveChat, setView, setActiveStory,
    setShowCreateChannel, setShowCreateBot, setShowAdvancedFilterModal, advancedFilters,
    t, isDark, onCall, onVideoCall,
  } = args;

  const archivedUnreadCount = useMemo(() => {
    let count = 0;
    chats.forEach(c => { if (archivedChats.includes(c.id)) count += c.unread || 0; });
    channels.forEach(c => { if (archivedChats.includes(c.id)) count += (c as any).unread || 0; });
    return count;
  }, [chats, channels, archivedChats]);

  return useMemo(() => ({
    theme, view, activeFolder, setActiveFolder, chatSearchQuery, setChatSearchQuery,
    filteredChats, filteredChannels, bots, archivedUnreadCount, toggleArchive,
    contacts, setGlobalSelectedContact, setActiveChat, setView, setActiveStory,
    setShowCreateChannel, setShowCreateBot, setShowAdvancedFilterModal, advancedFilters,
    t, isDark, onCall, onVideoCall,
  }), [
    view, activeFolder, setActiveFolder, chatSearchQuery, setChatSearchQuery,
    filteredChats, filteredChannels, bots, archivedUnreadCount, toggleArchive,
    contacts, setGlobalSelectedContact, setActiveChat, setView, setActiveStory,
    setShowCreateChannel, setShowCreateBot, setShowAdvancedFilterModal, advancedFilters,
    t, isDark, onCall, onVideoCall,
  ]);
}
