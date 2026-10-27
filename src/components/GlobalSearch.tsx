import React, { useState, useRef, useEffect } from "react";
import { useSearchResults, type DateFilter, type SenderFilter, type TypeFilter } from "./search/searchEngine";
import { useBodyScrollLock } from "../lib/a11y";
import { GlobalSearchDialog } from "./search/GlobalSearchDialog";

const SEARCH_HISTORY_KEY = "mess_search_history";
const HISTORY_LIMIT = 10;

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.filter((x): x is string => typeof x === "string").slice(0, HISTORY_LIMIT)
      : [];
  } catch {
    return [];
  }
}

function saveHistory(list: string[]) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
  } catch {
    /* storage unavailable */
  }
}

interface GlobalSearchProps {
  isDark?: boolean;
  chats: any[];
  channels: any[];
  contacts: any[];
  onClose: () => void;
  onOpenChat: (chat: any) => void;
  onOpenContact: (contact: any) => void;
  t: (key: string, fallback?: string) => string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isDark = false,
  chats,
  channels,
  contacts,
  onClose,
  onOpenChat,
  onOpenContact,
  t,
}) => {
  useBodyScrollLock(true);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [senderFilter, setSenderFilter] = useState<SenderFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const commitQuery = () => {
    const q = query.trim();
    if (q.length < 2) return;
    const next = [q, ...history.filter((x) => x !== q)].slice(0, HISTORY_LIMIT);
    saveHistory(next);
    setHistory(next);
  };

  const close = () => {
    commitQuery();
    onClose();
  };

  const closeRef = useRef(close);
  closeRef.current = close;

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (activeIndex >= 0) rowRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const q = query.toLowerCase().trim();

  const { chatResults, groupResults, channelResults, fileResults, linkResults, contactResults } =
    useSearchResults(chats, channels, contacts, q, { dateFilter, senderFilter, typeFilter });

  const hasQuery = q.length > 0;
  const isEmpty = hasQuery && !chatResults.length && !groupResults.length && !channelResults.length && !fileResults.length && !linkResults.length && !contactResults.length;

  const selectChat = (chat: any, messageId?: number | null) => {
    commitQuery();
    onOpenChat(messageId != null ? { ...chat, __jumpToMessageId: messageId } : chat);
    onClose();
  };
  const selectChannel = (chat: any, messageId?: number | null) => {
    commitQuery();
    onOpenChat(messageId != null ? { ...chat, __jumpToMessageId: messageId } : chat);
    onClose();
  };
  const selectContact = (contact: any) => { commitQuery(); onOpenContact(contact); onClose(); };

  const flatRows: Array<() => void> = [
    ...chatResults.map(({ chat, messageId }) => () => selectChat(chat, messageId)),
    ...groupResults.map(({ chat, messageId }) => () => selectChat(chat, messageId)),
    ...channelResults.map(({ chat, messageId }) => () => selectChannel(chat, messageId)),
    ...fileResults.map(({ chat, messageId }) => () => selectChat(chat, messageId)),
    ...linkResults.map(({ chat, messageId }) => () => selectChat(chat, messageId)),
    ...contactResults.map((c) => () => selectContact(c)),
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (flatRows.length === 0) {
        setActiveIndex(-1);
        return;
      }
      const dir = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((prev) => (prev + dir + flatRows.length) % flatRows.length);
    } else if (e.key === "Enter" && flatRows.length > 0) {
      e.preventDefault();
      // Enter opens the highlighted row; with no keyboard selection it opens the first match.
      const idx = activeIndex >= 0 ? activeIndex : 0;
      if (flatRows[idx]) flatRows[idx]();
    }
  };

  return (
    <GlobalSearchDialog
      isDark={isDark}
      t={t}
      query={query}
      onQueryChange={(v) => { setQuery(v); setActiveIndex(-1); }}
      dateFilter={dateFilter}
      onDateFilter={(f) => { setDateFilter(f); setActiveIndex(-1); }}
      senderFilter={senderFilter}
      onSenderFilter={(f) => { setSenderFilter(f); setActiveIndex(-1); }}
      typeFilter={typeFilter}
      onTypeFilter={(f) => { setTypeFilter(f); setActiveIndex(-1); }}
      hasQuery={hasQuery}
      isEmpty={isEmpty}
      contacts={contacts}
      history={history}
      onClearQuery={() => setQuery("")}
      onClearHistory={clearHistory}
      activeIndex={activeIndex}
      rowRefs={rowRefs}
      inputRef={inputRef}
      onKeyDown={handleKeyDown}
      onClose={close}
      onSelectContact={selectContact}
      results={{ chatResults, groupResults, channelResults, fileResults, linkResults, contactResults }}
      onSelectChat={selectChat}
      onSelectChannel={selectChannel}
    />
  );
};
