import { useMemo } from "react";
import { CHAT_FOLDER_KEYS, CRM_SEGMENT_KEYS } from "../constants/chatConstants";
import { findCrmContactByChat } from "../lib/crm/bridge";
import { chatActivityOf } from "../utils/chatUtils";
const ARCHIVED = CHAT_FOLDER_KEYS[5];
const UNREAD = CHAT_FOLDER_KEYS[2];
const PERSONAL = CHAT_FOLDER_KEYS[1];
const WORK = CHAT_FOLDER_KEYS[3];
const GROUPS = CHAT_FOLDER_KEYS[4];
const LEADS = CRM_SEGMENT_KEYS[0];
const CLIENTS = CRM_SEGMENT_KEYS[1];

/**
 * Ordering of the chat list.
 *  - `recent` — by last activity: send time of the newest bubble (with message
 *    id fallback — live senders use `Date.now()` for both), else the chat's
 *    `createdAt`, else 0. Chats with equal keys keep their relative insertion
 *    order (Array.sort is stable), so never-active chats don't churn.
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
  crmContacts: any[] = [],
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
    // CRM sales segments: a chat belongs to the segment when its matched CRM
    // contact carries the segment's status (`leads` → `lead`, `clients` → `client`).
    if (activeFolder === LEADS || activeFolder === CLIENTS) {
      const match = findCrmContactByChat(crmContacts, chat);
      if (!match) return false;
      return match.status === (activeFolder === LEADS ? 'lead' : 'client');
    }
    return true;
  }), [currentChatList, chatSearchQuery, activeFolder, archivedChats, advancedFilters, isSpamChat, crmContacts]);

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
    // Sales segments are contact-based; channels never belong to one.
    if (activeFolder === LEADS || activeFolder === CLIENTS) return false;
    return true;
  }), [channels, chatSearchQuery, activeFolder, archivedChats]);

  const sortedChats = useMemo(() => {
    // Copy first — `filteredChats` items are the live store objects, and sort
    // must not mutate the array that came out of the filter.
    if (sortBy !== 'alpha') {
      return [...filteredChats].sort((a, b) => chatActivityOf(b) - chatActivityOf(a));
    }
    return [...filteredChats].sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' })
    );
  }, [filteredChats, sortBy]);

  const sortedChannels = useMemo(() => {
    if (sortBy !== 'alpha') {
      return [...filteredChannels].sort((a, b) => chatActivityOf(b) - chatActivityOf(a));
    }
    return [...filteredChannels].sort((a, b) =>
      String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' })
    );
  }, [filteredChannels, sortBy]);

  return { filteredChats: sortedChats, filteredChannels: sortedChannels, mentionCounts };
}
