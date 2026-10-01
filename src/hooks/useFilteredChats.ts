import { useMemo } from "react";
import { CHAT_FOLDER_KEYS } from "../constants/chatConstants";
const ARCHIVED = CHAT_FOLDER_KEYS[5];
const UNREAD = CHAT_FOLDER_KEYS[2];
const PERSONAL = CHAT_FOLDER_KEYS[1];
const WORK = CHAT_FOLDER_KEYS[3];
const GROUPS = CHAT_FOLDER_KEYS[4];

/**
 * Ordering of the chat list.
 *  - `recent` — store insertion order (newest chat first). The default, and the
 *    only honest "recent" we have: chats carry no numeric timestamp, `chat.time`
 *    is a preformatted display string ("10:42" / "Yesterday"), so it cannot be
 *    ordered against. A real recency sort needs a timestamp plumbed through the
 *    whole send path (chatSlice + send hooks + IDB + wire format).
 *  - `alpha`   — by chat name, locale-aware. Telegram calls this "By name".
 */
export type ChatSortBy = 'recent' | 'alpha';

export function useFilteredChats(
  currentChatList: any[],
  chatSearchQuery: string,
  activeFolder: string,
  archivedChats: any[],
  advancedFilters: any,
  channels: any[],
  contacts: any[] = [],
  spamFilter = false,
  sortBy: ChatSortBy = 'recent',
) {
  const MENTIONED_USER = "user";

  /**
   * settings.spamFilter: a direct chat with somebody who is not in the contact
   * list and that we never wrote to is unsolicited — hide it from the list until
   * the user answers. Anything the user engaged in (or a known contact) stays
   * visible, and blocked contacts are hidden unconditionally.
   */
  const isSpamChat = useMemo(() => {
    if (!spamFilter) return () => false;
    const known = new Set<string>(contacts.map((c: any) => String(c.id)));
    const knownNames = new Set<string>(contacts.map((c: any) => String(c.name)));
    // Blocked contacts are hidden unconditionally — including the ones that are
    // in the contact list, so their ids/names are matched before `known`.
    const blocked = new Set<string>(contacts.filter((c: any) => c.isBlocked).map((c: any) => String(c.id)));
    const blockedNames = new Set<string>(contacts.filter((c: any) => c.isBlocked).map((c: any) => String(c.name)));
    return (chat: any) => {
      if (chat.type === 'group' || chat.type === 'bot' || chat.type === 'channel') return false;
      if (blocked.has(String(chat.id)) || blockedNames.has(String(chat.name))) return true;
      if (known.has(String(chat.id)) || knownNames.has(String(chat.name))) return false;
      return (chat.history || []).every((m: any) => m.sender !== "me");
    };
  }, [spamFilter, contacts]);

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
    if (isSpamChat(chat)) return false;
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
  }), [currentChatList, chatSearchQuery, activeFolder, archivedChats, advancedFilters, isSpamChat]);

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

  const sortedChats = useMemo(() => {
    if (sortBy !== 'alpha') return filteredChats;
    // Copy first — `filteredChats` items are the live store objects, and sort
    // must not mutate the array that came out of the filter.
    return [...filteredChats].sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' })
    );
  }, [filteredChats, sortBy]);

  const sortedChannels = useMemo(() => {
    if (sortBy !== 'alpha') return filteredChannels;
    return [...filteredChannels].sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' })
    );
  }, [filteredChannels, sortBy]);

  return { filteredChats: sortedChats, filteredChannels: sortedChannels, mentionCounts };
}
