import { useMemo } from "react";

export type DateFilter = "all" | "today" | "yesterday" | "week";

export const DATE_FILTERS: Array<{ value: DateFilter; key: string; fallback: string }> = [
  { value: "all", key: "search.dateFilters.all", fallback: "All" },
  { value: "today", key: "search.dateFilters.today", fallback: "Today" },
  { value: "yesterday", key: "search.dateFilters.yesterday", fallback: "Yesterday" },
  { value: "week", key: "search.dateFilters.week", fallback: "Last 7 days" },
];

export type SenderFilter = "all" | "me" | "others";

export const SENDER_FILTERS: Array<{ value: SenderFilter; key: string; fallback: string }> = [
  { value: "all", key: "search.senderFilters.all", fallback: "All" },
  { value: "me", key: "search.senderFilters.me", fallback: "Me" },
  { value: "others", key: "search.senderFilters.others", fallback: "Others" },
];

export type TypeFilter = "all" | "media" | "files" | "links";

export const TYPE_FILTERS: Array<{ value: TypeFilter; key: string; fallback: string }> = [
  { value: "all", key: "search.typeFilters.all", fallback: "All" },
  { value: "media", key: "search.typeFilters.media", fallback: "Media" },
  { value: "files", key: "search.typeFilters.files", fallback: "Files" },
  { value: "links", key: "search.typeFilters.links", fallback: "Links" },
];

interface SearchFilters {
  dateFilter: DateFilter;
  senderFilter: SenderFilter;
  typeFilter: TypeFilter;
}

function inDateRange(date: string | undefined, filter: DateFilter): boolean {
  if (filter === "all") return true;
  if (!date) return false;
  const today = new Date().toISOString().slice(0, 10);
  const days = Math.round((Date.parse(today) - Date.parse(date)) / 86400000);
  if (filter === "today") return days === 0;
  if (filter === "yesterday") return days === 1;
  return days >= 0 && days <= 7;
}

function senderMatches(sender: string | undefined, filter: SenderFilter): boolean {
  if (filter === "all") return true;
  const me = sender === "me";
  return filter === "me" ? me : !me;
}

function isMediaMessage(m: any): boolean {
  return m.type === "image" || m.type === "video";
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

/** Runs the six result queries the dialog renders, in the order the keyboard cursor walks them. */
export function useSearchResults(
  chats: any[],
  channels: any[],
  contacts: any[],
  q: string,
  { dateFilter, senderFilter, typeFilter }: SearchFilters,
) {
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

  return { chatResults, groupResults, channelResults, fileResults, linkResults, contactResults };
}