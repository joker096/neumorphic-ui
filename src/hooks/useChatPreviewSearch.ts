import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { groupMessages, formatDateLabel } from "../utils/chatUtils";
import { useDebounce } from "./useDebounce";

interface UseChatPreviewSearchArgs {
  chat: any;
  savedMessages: any[];
  scheduledMessages: any[];
  lang: string;
  t: (key: string, fallback?: string) => string;
}

interface ChatMessageListRef {
  scrollToBottom: () => void;
  scrollToIndex?: (index: number, align?: "start" | "center" | "end") => void;
}

/**
 * In-chat search and the derived message collections the preview renders:
 * the filtered history, the media strip, saved + scheduled messages and the
 * flat, day-separator-annotated list the virtual list consumes. Match
 * navigation (бриф §5.4 "переход к сообщению") lives here too — it owns the
 * list ref it scrolls.
 */
export function useChatPreviewSearch({ chat, savedMessages, scheduledMessages, lang, t }: UseChatPreviewSearchArgs) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mediaTab, setMediaTab] = useState<'all' | 'photos' | 'audio' | 'links'>('all');
  const [filterBySender, setFilterBySender] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [searchTypeFilter, setSearchTypeFilter] = useState<'all' | 'media' | 'files' | 'links'>('all');

  const msgListRef = useRef<ChatMessageListRef>(null);

  const debouncedSearch = useDebounce(searchQuery, 200);

  const filteredHistory = useMemo(() =>
    chat.history?.filter((msg: any, idx: number) => {
      if (filterBySender === 'me' && msg.sender !== 'me') return false;
      if (filterBySender === 'them' && msg.sender === 'me') return false;
      if (filterStartDate || filterEndDate) {
        const msgDate = new Date(idx * 86400000 + Date.now());
        if (filterStartDate && msgDate < new Date(filterStartDate)) return false;
        if (filterEndDate && msgDate > new Date(filterEndDate)) return false;
      }
      const matchesType =
        searchTypeFilter === 'all' ? true :
        searchTypeFilter === 'media' ? (msg.type === 'image' || msg.type === 'video') :
        searchTypeFilter === 'files' ? msg.type === 'file' :
        searchTypeFilter === 'links' ? (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text)) :
        true;
      if (!matchesType) return false;
      return debouncedSearch ? msg.text?.toLowerCase().includes(debouncedSearch.toLowerCase()) || !msg.text : true;
    }) || [],
    [chat.history, filterBySender, filterStartDate, filterEndDate, debouncedSearch, searchTypeFilter]
  );

  const mediaItems = useMemo(() =>
    (chat.history || []).filter((msg: any) => {
      if (filterBySender === 'me' && msg.sender !== 'me') return false;
      if (filterBySender === 'them' && msg.sender === 'me') return false;
      if (debouncedSearch && !msg.text?.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      if (mediaTab === 'photos') return msg.type === 'image';
      if (mediaTab === 'audio') return msg.type === 'audio';
      if (mediaTab === 'links') return typeof msg.text === 'string' && /https?:\/\//i.test(msg.text);
      return msg.type === 'image' || msg.type === 'audio' || (typeof msg.text === 'string' && /https?:\/\//i.test(msg.text));
    }),
    [chat.history, filterBySender, debouncedSearch, mediaTab]
  );

  const chatSavedMessages = useMemo(() =>
    savedMessages.filter((saved: any) => saved.chatId === chat.id),
    [savedMessages, chat.id]
  );

  const chatScheduledMessages = useMemo(() =>
    scheduledMessages.filter((m: any) => m.chatId === chat.id),
    [scheduledMessages, chat.id]
  );

  const flatItems = useMemo(() => {
    const groups = groupMessages(filteredHistory);
    const items: any[] = [];
    const dayLabels = {
      lang,
      today: t('chat.today', 'Today'),
      yesterday: t('chat.yesterday', 'Yesterday'),
    };
    let lastDateLabel = '';
    for (const group of groups) {
      const firstMsg = group.messages[0];
      const dateLabel = formatDateLabel(firstMsg.time, firstMsg.ts, dayLabels);
      if (dateLabel !== lastDateLabel && items.length > 0) {
        items.push({ id: `sep-${dateLabel}`, _isDateSeparator: true, _dateLabel: dateLabel });
      }
      lastDateLabel = dateLabel;
      group.messages.forEach((msg: any, mi: number) => {
        items.push({ ...msg, _groupPosition: group.groupPositions[mi], _isLastInGroup: mi === group.messages.length - 1 });
      });
    }
    return items;
  }, [filteredHistory, lang, t]);

  // In-chat search: match navigation (бриф §5.4 "переход к сообщению")
  const matchIndices = useMemo(() => {
    const q = (debouncedSearch || '').toLowerCase().trim();
    if (!q) return [] as number[];
    const out: number[] = [];
    flatItems.forEach((item: any, idx: number) => {
      if (!item._isDateSeparator && typeof item.text === 'string' && item.text.toLowerCase().includes(q)) {
        out.push(idx);
      }
    });
    return out;
  }, [flatItems, debouncedSearch]);

  const [activeMatch, setActiveMatch] = useState(0);
  useEffect(() => {
    if (matchIndices.length === 0) {
      setActiveMatch(0);
      return;
    }
    setActiveMatch(0);
    msgListRef.current?.scrollToIndex?.(matchIndices[0], 'center');
  }, [matchIndices]);

  const goToMatch = useCallback((dir: 1 | -1) => {
    if (matchIndices.length === 0) return;
    const next = (activeMatch + dir + matchIndices.length) % matchIndices.length;
    setActiveMatch(next);
    msgListRef.current?.scrollToIndex?.(matchIndices[next], 'center');
  }, [activeMatch, matchIndices, msgListRef]);

  return {
    searchQuery, setSearchQuery,
    showSearch, setShowSearch,
    mediaTab, setMediaTab,
    filterBySender, setFilterBySender,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    showFilterMenu, setShowFilterMenu,
    showDateFilter, setShowDateFilter,
    searchTypeFilter, setSearchTypeFilter,
    debouncedSearch,
    filteredHistory,
    mediaItems,
    chatSavedMessages,
    chatScheduledMessages,
    flatItems,
    matchCount: matchIndices.length,
    activeMatch,
    goToNextMatch: () => goToMatch(1),
    goToPrevMatch: () => goToMatch(-1),
    msgListRef,
  };
}