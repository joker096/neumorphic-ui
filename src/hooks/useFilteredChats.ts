import { useMemo } from "react";
import { CHAT_FOLDER_KEYS } from "../constants/chatConstants";
const ARCHIVED = CHAT_FOLDER_KEYS[5];
const UNREAD = CHAT_FOLDER_KEYS[2];
const PERSONAL = CHAT_FOLDER_KEYS[1];
const WORK = CHAT_FOLDER_KEYS[3];
const GROUPS = CHAT_FOLDER_KEYS[4];

export function useFilteredChats(
  currentChatList: any[],
  chatSearchQuery: string,
  activeFolder: string,
  archivedChats: any[],
  advancedFilters: any,
  channels: any[]
) {
  const MENTIONED_USER = "user";
  const mentionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const allChats = [...currentChatList, ...channels] as any[];
    allChats.forEach(c => {
      const history = c.history || [];
      let count = 0;
      history.forEach((msg: any) => {
        if (msg.mentions && msg.mentions.some((m: any) => m.name === MENTIONED_USER)) {
          count++;
        } else if (msg.text && new RegExp(`@${MENTIONED_USER}`, 'i').test(msg.text)) {
          count++;
        }
      });
      if (count > 0) {
        counts[c.id] = count;
      }
    });
    return counts;
  }, [currentChatList, channels]);

  const filteredChats = useMemo(() => currentChatList.filter(chat => {
    const query = chatSearchQuery.toLowerCase().trim();
    const historyText = (chat.history || [])
      .flatMap((m: any) => [m.text, m.replyTo?.text, m.duration, m.sender].filter(Boolean))
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      !query ||
      chat.name.toLowerCase().includes(query) ||
      (chat.message || "").toLowerCase().includes(query) ||
      historyText.includes(query);
    if (!matchesSearch) return false;
    if (advancedFilters.hasMedia && !(chat.history || []).some((m: any) => m.type === "image" || m.type === "video")) return false;
    if (advancedFilters.hasAudio && !(chat.history || []).some((m: any) => m.type === "audio")) return false;
    if (advancedFilters.hasReplies && !(chat.history || []).some((m: any) => !!m.replyTo)) return false;
    if (advancedFilters.fromBots && chat.type !== 'bot') return false;
    if (advancedFilters.priority && !chat.isPriority) return false;
    const isArchived = archivedChats.includes(chat.id);
    if (activeFolder === ARCHIVED) return isArchived;
    if (isArchived) return false;
    if (activeFolder === UNREAD) return chat.unread > 0;
    if (activeFolder === PERSONAL) return chat.type === 'dm' || chat.type === 'direct';
    if (activeFolder === WORK) return chat.type === 'group';
    if (activeFolder === GROUPS) return chat.type === 'group';
    return true;
  }), [currentChatList, chatSearchQuery, activeFolder, archivedChats, advancedFilters]);

  const filteredChannels = useMemo(() => channels.filter(channel => {
    const query = chatSearchQuery.toLowerCase().trim();
    const historyText = ((channel as any).history || [])
      .flatMap((m: any) => [m.text, m.replyTo?.text, m.duration, m.sender].filter(Boolean))
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || channel.name.toLowerCase().includes(query) || (channel as any).message?.toLowerCase().includes(query) || historyText.includes(query);
    if (!matchesSearch) return false;
    const isArchived = archivedChats.includes(channel.id);
    if (activeFolder === ARCHIVED) return isArchived;
    if (isArchived) return false;
    return true;
  }), [channels, chatSearchQuery, activeFolder, archivedChats]);

  return { filteredChats, filteredChannels, mentionCounts };
}
