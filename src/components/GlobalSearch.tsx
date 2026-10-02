import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, Clock } from "lucide-react";
import { DataState } from "./ui/DataState";
import { FilterChip, SearchResultSections } from "./search/SearchResults";
import {
  DATE_FILTERS,
  SENDER_FILTERS,
  TYPE_FILTERS,
  useSearchResults,
  type DateFilter,
  type SenderFilter,
  type TypeFilter,
} from "./search/searchEngine";
import { useBodyScrollLock } from "../lib/a11y";

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
    } else if (e.key === "Enter" && activeIndex >= 0 && flatRows[activeIndex]) {
      e.preventDefault();
      flatRows[activeIndex]();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[var(--z-drawer)] flex items-start justify-center p-3 sm:p-6 pt-[8vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />
      <div
        role="dialog"
        aria-label={t("search.title", "Search")}
        className="glass-panel relative w-full max-w-[560px] rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? "border-[var(--border-color)]" : "border-black/10"}`}>
          <Search size={18} className={isDark ? "text-[var(--text-tertiary)]" : "text-slate-400"} />
          <input
            aria-label={t("search.placeholder", "Search chats, messages, contacts…")}
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
            onKeyDown={handleKeyDown}
            placeholder={t("search.placeholder", "Search chats, messages, contacts…")}
            className={`flex-1 bg-transparent outline-none text-xs py-1 ${
              isDark ? "text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]" : "text-slate-800 placeholder:text-slate-400"
            }`}
          />
          {query && (
            <button
              type="button"
              aria-label={t("search.clear", "Clear")}
              onClick={() => setQuery("")}
              className={`min-w-11 min-h-11 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
                isDark ? "hover:bg-white/10" : "hover:bg-black/10"
              }`}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {hasQuery && (
          <div className={`flex flex-col gap-1.5 px-2 py-2 border-b ${isDark ? "border-[var(--border-color)]" : "border-black/10"}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              {DATE_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={t(f.key, f.fallback)}
                  active={dateFilter === f.value}
                  isDark={isDark}
                  onClick={() => { setDateFilter(f.value); setActiveIndex(-1); }}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`mr-1 text-[11px] font-bold uppercase tracking-[0.15em] ${isDark ? "text-[var(--text-tertiary)]" : "text-slate-500"}`}>
                {t("search.senderFilters.from", "From")}
              </span>
              {SENDER_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={t(f.key, f.fallback)}
                  active={senderFilter === f.value}
                  isDark={isDark}
                  onClick={() => { setSenderFilter(f.value); setActiveIndex(-1); }}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`mr-1 text-[11px] font-bold uppercase tracking-[0.15em] ${isDark ? "text-[var(--text-tertiary)]" : "text-slate-500"}`}>
                {t("search.typeFilters.type", "Type")}
              </span>
              {TYPE_FILTERS.map((f) => (
                <FilterChip
                  key={f.value}
                  label={t(f.key, f.fallback)}
                  active={typeFilter === f.value}
                  isDark={isDark}
                  onClick={() => { setTypeFilter(f.value); setActiveIndex(-1); }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-2">
          {!hasQuery && history.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
                  <Clock size={12} />
                  {t("search.history", "Recent searches")}
                </div>
                <button
                  type="button"
                  aria-label={t("search.historyClear", "Clear history")}
                  onClick={clearHistory}
                  className={`p-1 rounded-full cursor-pointer ${isDark ? "hover:bg-white/10" : "hover:bg-black/10"}`}
                >
                  <X size={12} />
                </button>
              </div>
              {history.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setQuery(h)}
                  className={`w-full flex items-center gap-3 px-3 min-h-11 rounded-xl text-left text-[13px] cursor-pointer ${
                    isDark ? "text-[var(--text-primary)] hover:bg-white/[0.05]" : "text-slate-700 hover:bg-black/5"
                  }`}
                >
                  <Clock size={14} className={isDark ? "text-[var(--text-tertiary)]" : "text-slate-400"} />
                  <span className="truncate">{h}</span>
                </button>
              ))}
            </div>
          )}

          {!hasQuery && history.length === 0 && (
            <div className={`flex flex-col items-center justify-center py-12 opacity-60 text-[13px] ${isDark ? "text-[var(--text-tertiary)]" : "text-slate-400"}`}>
              <Search size={32} className="mb-3" />
              {t("search.hint", "Search across all chats, channels and contacts")}
            </div>
          )}

          {isEmpty && (
            <DataState
              status="empty"
              isDark={isDark}
              emptyIcon="search"
              title={t("search.noResults", "Nothing found")}
              description={t("search.noResultsHint", "Try a different keyword")}
              action={{ label: t("search.clear", "Clear"), onClick: () => setQuery("") }}
            />
          )}

          <SearchResultSections
            results={{ chatResults, groupResults, channelResults, fileResults, linkResults, contactResults }}
            q={q}
            isDark={isDark}
            activeIndex={activeIndex}
            rowRefs={rowRefs}
            t={t}
            onSelectChat={selectChat}
            onSelectChannel={selectChannel}
            onSelectContact={selectContact}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
