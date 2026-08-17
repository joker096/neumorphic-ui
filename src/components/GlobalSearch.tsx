import React, { useMemo, useState, useRef, useEffect } from "react";
import { Search, X, MessageCircle, Users, Hash, CornerDownLeft } from "lucide-react";
import { DataState } from "./ui/DataState";

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

function findSnippet(history: any[], query: string): string | null {
  if (!history) return null;
  const q = query.toLowerCase();
  for (const m of history) {
    const text = (m.text || m.replyTo?.text || m.duration || "").toString();
    if (text.toLowerCase().includes(q)) {
      return text.length > 80 ? text.slice(0, 80) + "…" : text;
    }
  }
  return null;
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
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const q = query.toLowerCase().trim();

  const chatResults = useMemo(() => {
    if (!q) return [];
    return chats
      .filter((c) => {
        const hay = (c.name + " " + (c.message || "") + " " +
          ((c.history || []).flatMap((m: any) => [m.text, m.replyTo?.text]).filter(Boolean).join(" "))).toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12)
      .map((c) => ({ chat: c, snippet: findSnippet(c.history, q) }));
  }, [chats, q]);

  const channelResults = useMemo(() => {
    if (!q) return [];
    return channels
      .filter((c) => {
        const hay = (c.name + " " + (c.message || "") + " " +
          (((c as any).history || []).flatMap((m: any) => [m.text, m.replyTo?.text]).filter(Boolean).join(" "))).toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 8);
  }, [channels, q]);

  const contactResults = useMemo(() => {
    if (!q) return [];
    return contacts
      .filter((c) => (c.name || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [contacts, q]);

  const hasQuery = q.length > 0;
  const isEmpty = hasQuery && !chatResults.length && !channelResults.length && !contactResults.length;

  return (
    <div className="fixed inset-0 z-[250] flex items-start justify-center p-3 sm:p-6 pt-[8vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-label={t("search.title", "Search")}
        className={`relative w-full max-w-[560px] rounded-2xl border shadow-2xl flex flex-col max-h-[80vh] ${
          isDark
            ? "bg-[var(--bg-primary)] border-[var(--border-color)]"
            : "bg-white border-[var(--border-color)]"
        }`}
      >
        <div className={`flex items-center gap-2 px-4 py-3 border-b ${isDark ? "border-[var(--border-color)]" : "border-black/10"}`}>
          <Search size={18} className={isDark ? "text-[var(--text-tertiary)]" : "text-slate-400"} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("search.placeholder", "Search chats, messages, contacts…")}
            className={`flex-1 bg-transparent outline-none text-[15px] py-1 ${
              isDark ? "text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]" : "text-slate-800 placeholder:text-slate-400"
            }`}
          />
          {query && (
            <button
              type="button"
              aria-label={t("search.clear", "Clear")}
              onClick={() => setQuery("")}
              className="p-1 rounded-full hover:bg-black/10 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {!hasQuery && (
            <div className={`flex flex-col items-center justify-center py-12 opacity-60 text-[13px] ${isDark ? "text-[var(--text-tertiary)]" : "text-slate-400"}`}>
              <Search size={28} className="mb-3" />
              {t("search.hint", "Search across all chats, channels and contacts")}
            </div>
          )}

          {isEmpty && (
            <DataState
              status="empty"
              isDark={isDark}
              title={t("search.noResults", "Nothing found")}
              description={t("search.noResultsHint", "Try a different keyword")}
            />
          )}

          {chatResults.length > 0 && (
            <Section icon={MessageCircle} title={t("search.chats", "Chats")}>
              {chatResults.map(({ chat, snippet }) => (
                <Row
                  key={chat.id}
                  color={chat.color}
                  title={chat.name}
                  subtitle={snippet || chat.message}
                  badge={chat.unread}
                  isDark={isDark}
                  onClick={() => { onOpenChat(chat); onClose(); }}
                />
              ))}
            </Section>
          )}

          {channelResults.length > 0 && (
            <Section icon={Hash} title={t("search.channels", "Channels")}>
              {channelResults.map((c) => (
                <Row
                  key={c.id}
                  color={c.color}
                  title={c.name}
                  subtitle={c.message}
                  isDark={isDark}
                  onClick={() => { onOpenChat(c); onClose(); }}
                />
              ))}
            </Section>
          )}

          {contactResults.length > 0 && (
            <Section icon={Users} title={t("search.contacts", "Contacts")}>
              {contactResults.map((c) => (
                <Row
                  key={c.id}
                  color={c.color}
                  title={c.name}
                  subtitle={c.lastSeen ? t("search.contact", "Contact") : ""}
                  isDark={isDark}
                  onClick={() => { onOpenContact(c); onClose(); }}
                />
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
};

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--accent)]">
        <Icon size={12} />
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({
  color, title, subtitle, badge, isDark, onClick,
}: {
  color: string;
  title: string;
  subtitle?: string;
  badge?: number;
  isDark: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors min-h-[48px] cursor-pointer ${
        isDark ? "hover:bg-white/[0.05]" : "hover:bg-black/5"
      }`}
    >
      <div className={`shrink-0 w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm`}>
        {title.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px] truncate">{title}</div>
        {subtitle && (
          <div className="text-[11px] truncate opacity-70">{subtitle}</div>
        )}
      </div>
      {badge ? (
        <div className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-gradient-to-tr from-[#6f7fff] to-[#965dff] text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </div>
      ) : (
        <CornerDownLeft size={14} className="shrink-0 opacity-40" />
      )}
    </button>
  );
}
