import { useCallback, type ReactElement } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChatListItem } from "../chat-preview";
import type { ChatRow } from "./buildChatRows";

type Translate = (key: string, options?: any) => string;

interface RowRendererDeps {
  theme: "light" | "dark";
  t: Translate;
  activeChatId?: string | number | null;
  activeFolder: string;
  selectMode: boolean;
  selectedIds: Set<string | number>;
  contacts: any[];
  draftTextByChat?: Record<string, string>;
  handleChatOpen: (chat: any) => void;
  onOpenChat?: (chat: any) => void;
  toggleArchive: (id: string | number) => void;
  handleMenuMute: (target: { id: string | number }) => void;
  handleMenuDelete: (target: { id: number }) => void;
  onCall: (name: string, color?: string) => void;
  onVideoCall: (name: string, color?: string) => void;
  handleToggleSelect: (id: string | number) => void;
  openMenu: (chat: any, anchor: { x: number; y: number } | null, anchorRect?: any) => void;
  setGlobalSelectedContact: (contact: any) => void;
}

/** Builds one <ChatListItem> per chat/channel row with all list-level wiring resolved. */
export function useChatListRowRenderer(deps: RowRendererDeps) {
  const {
    theme, t, activeChatId, activeFolder, selectMode, selectedIds, contacts, draftTextByChat,
    handleChatOpen, onOpenChat, toggleArchive, handleMenuMute, handleMenuDelete, onCall,
    onVideoCall, handleToggleSelect, openMenu, setGlobalSelectedContact,
  } = deps;

  return useCallback((chat: any, type: "chat" | "channel") => (
    <ChatListItem
      chat={chat}
      theme={theme}
      type={type}
      active={activeChatId === chat.id}
      onClick={() => {
        handleChatOpen(chat);
        onOpenChat?.(chat);
      }}
      onArchive={() => toggleArchive(chat.id)}
      onMute={type === "chat" ? () => handleMenuMute({ id: chat.id }) : undefined}
      onDelete={type === "chat" ? () => handleMenuDelete({ id: chat.id }) : undefined}
      archiveLabel={activeFolder === "archived" ? t("chat.unarchive") : t("chat.archive")}
      onCall={() => onCall(chat.name, chat.color)}
      onVideoCall={() => onVideoCall(chat.name, chat.color)}
      t={t}
      pinned={type === "chat" ? chat.pinned : undefined}
      selectMode={type === "chat" ? selectMode : undefined}
      selected={type === "chat" ? selectedIds.has(chat.id) : undefined}
      onToggleSelect={type === "chat" ? () => handleToggleSelect(chat.id) : undefined}
      onMenuRequest={type === "chat" ? openMenu : undefined}
      draftText={draftTextByChat?.[String(chat.id)]}
      onAvatarClick={
        type === "chat"
          ? () => {
              const profileContact = contacts.find(ct => ct.name === chat.name);
              setGlobalSelectedContact({
                id: profileContact?.id ?? chat.id,
                name: chat.name,
                color: chat.color,
                // Real liveness only: useChatPresence stamps chat.lastSeen on peer
                // disconnect and real contacts carry it from creation/import.
                // 0 = unknown, which ContactProfileModal renders as "—".
                lastSeen: chat.online ? 0 : (chat.lastSeen ?? profileContact?.lastSeen ?? 0),
                online: chat.online,
                isFavorite: chat.isFavorite,
                localFields: profileContact?.localFields
              });
            }
          : undefined
      }
    />
  ), [theme, t, activeChatId, activeFolder, selectMode, selectedIds, contacts, draftTextByChat, handleChatOpen, onOpenChat, toggleArchive, handleMenuMute, handleMenuDelete, onCall, onVideoCall, handleToggleSelect, openMenu, setGlobalSelectedContact]);
}

interface ChatListVirtualRowsProps {
  rows: ChatRow[];
  isDark: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  renderRow: (chat: any, type: "chat" | "channel") => ReactElement;
}

/** Absolutely-positioned virtualized rows over a spacer sized to the virtualizer total. */
export function ChatListVirtualRows({ rows, isDark, scrollRef, renderRow }: ChatListVirtualRowsProps) {
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 76,
    overscan: 5,
  });

  const measureElement = useCallback((el: HTMLElement | null) => {
    if (el) {
      virtualizer.measureElement(el);
    }
  }, [virtualizer]);

  if (rows.length === 0) return null;

  return (
    <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
      {virtualizer.getVirtualItems().map((vi) => {
        const row = rows[vi.index];
        return (
          <div
            key={vi.key}
            ref={measureElement}
            data-index={vi.index}
            className={
              row.kind === "header"
                ? row.wrapperClass
                : row.kind === "divider"
                  ? "py-4"
                  : vi.index === rows.length - 1
                    ? undefined
                    : "pb-1"
            }
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${vi.start}px)`,
            }}
          >
            {row.kind === "header" ? (
              <div className={row.innerClass}>{row.text}</div>
            ) : row.kind === "divider" ? (
              <div className={`h-px w-full ${isDark ? "bg-white/5" : "bg-black/5"}`} />
            ) : (
              renderRow(row.chat, row.kind)
            )}
          </div>
        );
      })}
    </div>
  );
}
