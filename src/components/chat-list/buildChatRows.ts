export type ChatRow =
  | { kind: "header"; text: string; innerClass: string; wrapperClass: string }
  | { kind: "divider" }
  | { kind: "chat"; chat: any }
  | { kind: "channel"; chat: any };

type Translate = (key: string, options?: any) => string;

interface BuildChatRowsOptions {
  view: string;
  pinnedChats: any[];
  regularChats: any[];
  filteredChannels: any[];
  t: Translate;
}

const PINNED_HEADER = "text-xs sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--accent)]";
const CHAT_HEADER = "text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]";
const CHANNEL_HEADER = "text-xs sm:text-xs font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[var(--accent2)]";

/** Flat row model for the virtualized list: section headers, dividers and chat rows. */
export function buildChatRows({ view, pinnedChats, regularChats, filteredChannels, t }: BuildChatRowsOptions): ChatRow[] {
  const list: ChatRow[] = [];
  if (view === "chats") {
    if (pinnedChats.length > 0) {
      list.push({ kind: "header", text: t("chat.sectionPinned"), innerClass: PINNED_HEADER, wrapperClass: "pb-3 sm:pb-4" });
      pinnedChats.forEach((c: any) => list.push({ kind: "chat", chat: c }));
      list.push({ kind: "divider" });
    }
    list.push({ kind: "header", text: t("chat.sectionConversations"), innerClass: CHAT_HEADER, wrapperClass: "pb-4" });
    regularChats.forEach((c: any) => list.push({ kind: "chat", chat: c }));
  } else if (view === "channels") {
    list.push({ kind: "header", text: t("chat.sectionChannels"), innerClass: CHANNEL_HEADER, wrapperClass: "pb-3 sm:pb-4" });
    filteredChannels.forEach((c: any) => list.push({ kind: "channel", chat: c }));
  }
  return list;
}
