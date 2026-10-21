import React from "react";
import { CornerDownLeft, MessageCircle, Users, Hash, FileText, Link2 } from "lucide-react";

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

export function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`group min-h-11 min-w-11 p-1 flex items-center justify-center rounded-full cursor-pointer transition-transform active:scale-95 ${
        active ? "bg-black/10 dark:bg-white/10" : ""
      }`}
    >
      <span className={`flex items-center px-3 py-0.5 rounded-full text-xs font-semibold transition-colors border ${
        active
          ? `border-[var(--accent)] text-[var(--accent)]`
          : "border-[var(--border-color)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:bg-black/10 dark:group-hover:bg-white/10"
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
  color, title, subtitle, badge, onClick, active = false, innerRef, highlight,
}: {
  color: string;
  title: string;
  subtitle?: string;
  badge?: number;
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
          ? "bg-black/10 dark:bg-white/10"
          : "hover:bg-black/5 dark:hover:bg-white/[0.05]"
      }`}
    >
      <div className={`shrink-0 avatar avatar-sm bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm`}>
        {title.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{highlight ? renderHighlighted(title, highlight) : title}</div>
        {subtitle && (
          <div className="text-xs truncate opacity-70">{highlight ? renderHighlighted(subtitle, highlight) : subtitle}</div>
        )}
      </div>
      {badge ? (
        <div className="shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full bg-gradient-to-tr from-[var(--accent)] to-[var(--accent2)] text-[var(--ink-on-saturate)] text-xs font-bold flex items-center justify-center">
          {badge}
        </div>
      ) : (
        <CornerDownLeft size={14} className="shrink-0 opacity-40" />
      )}
    </button>
  );
}

interface SearchResultSectionsProps {
  results: {
    chatResults: any[];
    groupResults: any[];
    channelResults: any[];
    fileResults: any[];
    linkResults: any[];
    contactResults: any[];
  };
  q: string;
  activeIndex: number;
  rowRefs: React.RefObject<Array<HTMLButtonElement | null>>;
  t: (key: string, fallback?: string) => string;
  onSelectChat: (chat: any, messageId?: number | null) => void;
  onSelectChannel: (chat: any, messageId?: number | null) => void;
  onSelectContact: (contact: any) => void;
}

export function SearchResultSections({ results, q, activeIndex, rowRefs, t, onSelectChat, onSelectChannel, onSelectContact }: SearchResultSectionsProps) {
  const { chatResults, groupResults, channelResults, fileResults, linkResults, contactResults } = results;
  return (
    <>
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
            active={i === activeIndex}
        innerRef={(el) => { rowRefs.current[i] = el; }}
        onClick={() => onSelectChat(chat, messageId)}
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
            active={chatResults.length + i === activeIndex}
        innerRef={(el) => { rowRefs.current[chatResults.length + i] = el; }}
        onClick={() => onSelectChat(chat, messageId)}
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
             active={chatResults.length + groupResults.length + i === activeIndex}
        innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + i] = el; }}
        onClick={() => onSelectChannel(chat, messageId)}
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
            active={chatResults.length + groupResults.length + channelResults.length + i === activeIndex}
        innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + channelResults.length + i] = el; }}
        onClick={() => onSelectChat(chat, messageId)}
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
            active={chatResults.length + groupResults.length + channelResults.length + fileResults.length + i === activeIndex}
        innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + channelResults.length + fileResults.length + i] = el; }}
        onClick={() => onSelectChat(chat, messageId)}
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
              active={chatResults.length + groupResults.length + channelResults.length + fileResults.length + linkResults.length + i === activeIndex}
          innerRef={(el) => { rowRefs.current[chatResults.length + groupResults.length + channelResults.length + fileResults.length + linkResults.length + i] = el; }}
          onClick={() => onSelectContact(c)}
      />
    ))}
  </Section>
)}
    </>
  );
}
