import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, X, MessageCircle, Users, Hash, CornerDownLeft, Clock, FileText, Link2 } from "lucide-react";
import { DataState } from "./ui/DataState";
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

function findMatch(history: any[], query: string, pred?: (m: any) => boolean): { snippet: string; messageId: number } | null {
  if (!history) return null;
  const q = query.toLowerCase();
  for (const m of history) {
    const text = (m.text || m.replyTo?.text || m.duration || "").toString();
    if (text.toLowerCase().includes(q) && (!pred || pred(m))) {
      return {
        snippet: text.length > 80 ? text.slice(0, 80) + "…" : text,
        messageId: m.id,
      };
    }
  }
  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;
  return text.split(new RegExp(`(${escapeRegExp(q)})`, "gi")).map((part, i) =>
    part.toLowerCase() === q.toLowerCase()
      ? <mark key={i} className="rounded bg-[var(--accent)]/25 px-[2px]">{part}</mark>
      : part,
  );
}

export type DateFilter = "all" | "today" | "yesterday" | "week";

const DATE_FILTERS: Array<{ value: DateFilter; key: string; fallback: string }> = [
  { value: "all", key: "search.dateFilters.all", fallback: "All" },
  { value: "today", key: "search.dateFilters.today", fallback: "Today" },
  { value: "yesterday", key: "search.dateFilters.yesterday", fallback: "Yesterday" },
  { value: "week", key: "search.dateFilters.week", fallback: "Last 7 days" },
];

function inDateRange(date: string | undefined, filter: DateFilter): boolean {
  if (filter === "all") return true;
  if (!date) return false;
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.round((Date.parse(today) - Date.parse(date)) / 86400000);
  if (filter === "today") return days === 0;
  if (filter === "yesterday") return days === 1;
  return days >= 0 && days <= 7;
}

export type SenderFilter = "all" | "me" | "others";

const SENDER_FILTERS: Array<{ value: SenderFilter; key: string; fallback: string }> = [
  { value: "all", key: "search.senderFilters.all", fallback: "All" },
  { value: "me", key: "search.senderFilters.me", fallback: "Me" },
  { value: "others", key: "search.senderFilters.others", fallback: "Others" },
];

function senderMatches(sender: string | undefined, filter: SenderFilter): boolean {
  if (filter === "all") return true;
  const me = sender === "me";
  return filter === "me" ? me : !me;
}

export type TypeFilter = "all" | "media" | "files" | "links";

const TYPE_FILTERS: Array<{ value: TypeFilter; key: string; fallback: string }> = [
  { value: "all", key: "search.typeFilters.all", fallback: "All" },
  { value: "media", key: "search.typeFilters.media", fallback: "Media" },
  { value: "files", key: "search.typeFilters.files", fallback: "Files" },
  { value: "links", key: "search.typeFilters.links", fallback: "Links" },
];

function isMediaMessage(m: any): boolean {
  return m.type === "image" || m.type === "video";
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

  const chatResults = useMemo(() => {
    if (!q) return [];
    if (typeFilter === "files" || typeFilter === "links") return [];
    const pred = (m: any) => (typeFilter !== "media" || isMediaMessage(m)) && senderMatches(m.sender, senderFilter) && inDateRange(m.date, dateFilter);
    return chats
      .filter((c) => c.type !== "group")
      .filter((c) => {
        const hay = (c.name + " " + (c.message || "") + " " +
          ((c.history || []).flatMap((m: any) => [m.text, m.replyTo?.text, m.duration]).filter(Boolean).join(" "))).toLowerCase();
        if (!hay.includes(q)) return false;
        return (typeFilter === "all" && dateFilter === "all" && senderFilter === "all") || findMatch(c.history, q, pred) !== null;
      })
      .slice(0, 12)
      .map((c) => {
        const match = findMatch(c.history, q, pred);
        return { chat: c, snippet: match ? match.snippet : undefined, messageId: match ? match.messageId : null };
      });
  }, [chats, q, dateFilter, senderFilter, typeFilter]);

  const groupResults = useMemo(() => {
    if (!q) return [];
    if (typeFilter === "files" || typeFilter === "links") return [];
    const pred = (m: any) => (typeFilter !== "media" || isMediaMessage(m)) && senderMatches(m.sender, senderFilter) && inDateRange(m.date, dateFilter);
    return chats
      .filter((c) => c.type === "group")
      .filter((c) => {
        const members = ((c.members || []) as any[]).map((m) => m.name).join(" ");
        const hay = (c.name + " " + members + " " + (c.message || "") + " " +
          ((c.history || []).flatMap((m: any) => [m.text, m.replyTo?.text, m.duration]).filter(Boolean).join(" "))).toLowerCase();
        if (!hay.includes(q)) return false;
        return (typeFilter === "all" && dateFilter === "all" && senderFilter === "all") || findMatch(c.history, q, pred) !== null;
      })
      .slice(0, 8)
      .map((c) => {
        const match = findMatch(c.history, q, pred);
        return { chat: c, snippet: match ? match.snippet : undefined, messageId: match ? match.messageId : null };
      });
  }, [chats, q, dateFilter, senderFilter, typeFilter]);

  const channelResults = useMemo(() => {
    if (!q) return [];
    if (typeFilter === "files" || typeFilter === "links") return [];
    const pred = (m: any) => (typeFilter !== "media" || isMediaMessage(m)) && senderMatches(m.sender, senderFilter) && inDateRange(m.date, dateFilter);
    return channels
      .filter((c) => {
        const hay = (c.name + " " + (c.message || "") + " " +
          (((c as any).history || []).flatMap((m: any) => [m.text, m.replyTo?.text, m.duration]).filter(Boolean).join(" "))).toLowerCase();
        if (!hay.includes(q)) return false;
        return (typeFilter === "all" && dateFilter === "all" && senderFilter === "all") || findMatch((c as any).history, q, pred) !== null;
      })
      .slice(0, 8)
      .map((c) => {
        const match = findMatch((c as any).history, q, pred);
        return { chat: c, snippet: match ? match.snippet : undefined, messageId: match ? match.messageId : null };
      });
  }, [channels, q, dateFilter, senderFilter, typeFilter]);

  const fileResults = useMemo(() => {
    if (!q) return [];
    if (typeFilter !== "all" && typeFilter !== "files") return [];
    const rows: Array<{ chat: any; fileName: string; messageId: number }> = [];
    for (const c of [...chats, ...channels]) {
      for (const m of (c.history || []) as any[]) {
        if (typeof m.fileName === "string" && m.fileName.toLowerCase().includes(q) && inDateRange(m.date, dateFilter) && senderMatches(m.sender, senderFilter)) {
          rows.push({ chat: c, fileName: m.fileName, messageId: m.id });
        }
      }
    }
    return rows.slice(0, 8);
  }, [chats, channels, q, dateFilter, senderFilter, typeFilter]);

  const linkResults = useMemo(() => {
    if (!q) return [];
    if (typeFilter !== "all" && typeFilter !== "links") return [];
    const rows: Array<{ chat: any; url: string; messageId: number }> = [];
    for (const c of [...chats, ...channels]) {
      for (const m of (c.history || []) as any[]) {
        if (typeof m.text !== "string") continue;
        const urls = m.text.match(/https?:\/\/[^\s]+/gi) || [];
        for (const url of urls) {
          if (url.toLowerCase().includes(q) && inDateRange(m.date, dateFilter) && senderMatches(m.sender, senderFilter)) rows.push({ chat: c, url, messageId: m.id });
        }
      }
    }
    return rows.slice(0, 8);
  }, [chats, channels, q, dateFilter, senderFilter, typeFilter]);

  const contactResults = useMemo(() => {
    if (!q) return [];
    if (typeFilter !== "all") return [];
    return contacts
      .filter((c) => (c.name || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [contacts, q, typeFilter]);

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

          {chatResults.length > 0 && (
            <Section icon={MessageCircle} title={t("search.chats", "Chats")}>
              {chatResults.map(({ chat, snippet, messageId }, i) => (
                <Row
                  key={chat.id}
                  color={chat.color}
                  title={chat.name}
                   subtitle={snippet || chat.message}
                   highlight={q}
                   badge={chat.unread}
                  isDark={isDark}
                  active={i === activeIndex}
                  innerRef={(el) => { rowRefs.current[i] = el; }}
                  onClick={() => selectChat(chat, messageId)}
                />
              ))}
            </Section>
          )}

          {groupResults.length > 0 && (
            <Section icon={Users} title={t("search.groups", "Groups")}>
              {groupResults.map(({ chat, snippet, messageId }, i) => (
                <Row
                  key={chat.id}
                  color={chat.color}
                  title={chat.name}
                   subtitle={snippet || chat.message}
                   highlight={q}
                   badge={chat.members ? chat.members.length : undefined}
                  isDark={isDark}
                  active={chatResults.length + i === activeIndex}
                  innerRef={(el) => { rowRefs.current[chatResults.length + i] = el; }}
                  onClick={() => selectChat(chat, messageId)}
                />
              ))}
            </Section>
          )}

          {channelResults.length > 0 && (
            <Section icon={Hash} title={t("search.channels", "Channels")}>
              {channelResults.map(({ chat, snippet, messageId }, i) => (
                <Row
                  key={chat.id}
                  color={chat.color}
                  title={chat.name}
                   subtitle={snippet || chat.message}
                   highlight={q}
                   isDark={isDark}
                  active={chatResults.length + groupResults.length + i === activeIndex}
                  innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + i] = el; }}
                  onClick={() => selectChannel(chat, messageId)}
                />
              ))}
            </Section>
          )}

          {fileResults.length > 0 && (
            <Section icon={FileText} title={t("search.files", "Files")}>
              {fileResults.map(({ chat, fileName, messageId }, i) => (
                <Row
                  key={`${chat.id}_${messageId}`}
                  color={chat.color}
                   title={fileName}
                   subtitle={chat.name}
                   highlight={q}
                  isDark={isDark}
                  active={chatResults.length + groupResults.length + channelResults.length + i === activeIndex}
                  innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + channelResults.length + i] = el; }}
                  onClick={() => selectChat(chat, messageId)}
                />
              ))}
            </Section>
          )}

          {linkResults.length > 0 && (
            <Section icon={Link2} title={t("search.links", "Links")}>
              {linkResults.map(({ chat, url, messageId }, i) => (
                <Row
                  key={`${chat.id}_${messageId}_${url}`}
                  color={chat.color}
                   title={url}
                   subtitle={chat.name}
                   highlight={q}
                  isDark={isDark}
                  active={chatResults.length + groupResults.length + channelResults.length + fileResults.length + i === activeIndex}
                  innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + channelResults.length + fileResults.length + i] = el; }}
                  onClick={() => selectChat(chat, messageId)}
                />
              ))}
            </Section>
          )}

          {contactResults.length > 0 && (
            <Section icon={Users} title={t("search.contacts", "Contacts")}>
              {contactResults.map((c, i) => (
                <Row
                  key={c.id}
                  color={c.color}
                  title={c.name}
                   subtitle={c.lastSeen ? t("search.contact", "Contact") : ""}
                   highlight={q}
                  isDark={isDark}
                    active={chatResults.length + groupResults.length + channelResults.length + fileResults.length + linkResults.length + i === activeIndex}
                    innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + channelResults.length + fileResults.length + linkResults.length + i] = el; }}
                    onClick={() => selectContact(c)}
                />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

function FilterChip({ label, active, isDark, onClick }: { label: string; active: boolean; isDark: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-95 ${
        active ? (isDark ? "bg-white/10" : "bg-black/10") : ""
      }`}
    >
      <span className={`flex items-center px-3 py-0.5 rounded-full text-[12px] font-semibold transition-colors border ${
        active
          ? `border-[var(--accent)] text-[var(--accent)]`
          : isDark ? "border-[var(--border-color)] text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:bg-white/10" : "border-[var(--border-color)] text-slate-600 group-hover:text-slate-800 group-hover:bg-black/10"
      }`}>
        {label}
      </span>
    </button>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
        <Icon size={12} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({
  color, title, subtitle, badge, isDark, onClick, active = false, innerRef, highlight,
}: {
  color: string;
  title: string;
  subtitle?: string;
  badge?: number;
  isDark: boolean;
  onClick: () => void;
  active?: boolean;
  innerRef?: (el: HTMLButtonElement | null) => void;
  highlight?: string;
}) {
  return (
    <button
      ref={innerRef}
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors min-h-11 cursor-pointer ${
        active
          ? isDark ? "bg-white/10" : "bg-black/10"
          : isDark ? "hover:bg-white/[0.05]" : "hover:bg-black/5"
      }`}
    >
      <div className={`shrink-0 avatar avatar-sm bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm`}>
        {title.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px] truncate">{highlight ? renderHighlighted(title, highlight) : title}</div>
        {subtitle && (
          <div className="text-xs truncate opacity-70">{highlight ? renderHighlighted(subtitle, highlight) : subtitle}</div>
        )}
      </div>
      {badge ? (
        <div className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] text-white text-xs font-bold flex items-center justify-center">
          {badge}
        </div>
      ) : (
        <CornerDownLeft size={14} className="shrink-0 opacity-40" />
      )}
    </button>
  );
}
