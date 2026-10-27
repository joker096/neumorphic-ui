import { useCallback, useEffect, useState } from "react";

type NavRow = { kind: "chat" | "channel"; chat: { id: string | number } };

interface UseChatListKeyboardNavOptions {
  /** Rows as produced by buildChatRows (header/divider/chat/channel). */
  rows: { kind: string; chat?: { id: string | number } }[];
  /** Whether navigation is active (view is chats/channels and no overlay is open). */
  enabled: boolean;
  /** Scroll container of the virtualized list. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Called with the resolved row when Enter is pressed. */
  openChat: (chat: { id: string | number }) => void;
}

const ROW_HEIGHT = 76;
const HEADER_HEIGHT = 28;
const DIVIDER_HEIGHT = 32;
const SCROLL_OFFSET = 80;

function totalOffset(rows: { kind: string }[], index: number): number {
  let offset = 0;
  for (let i = 0; i <= index; i += 1) {
    const kind = rows[i]?.kind;
    if (kind === "header") offset += HEADER_HEIGHT;
    else if (kind === "divider") offset += DIVIDER_HEIGHT;
    else offset += ROW_HEIGHT;
  }
  return offset;
}

/**
 * Arrow-key navigation over the chat/channel list rows. Returns the index of
 * the focused row (into the navigable subset). Esc is intentionally not handled
 * here — panels already close via existing Escape handlers.
 */
export function useChatListKeyboardNav({
  rows,
  enabled,
  scrollRef,
  openChat,
}: UseChatListKeyboardNavOptions): number {
  const navigable = rows.filter(
    (r): r is NavRow => r.kind === "chat" || r.kind === "channel",
  );

  const [focusedIndex, setFocusedIndex] = useState(-1);

  const scrollToRow = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const row = navigable[index];
      if (!row) return;
      // The row's index within the full rows array.
      const fullIndex = rows.indexOf(row as { kind: string });
      const offset = totalOffset(rows, fullIndex);
      const top = Math.max(0, offset - SCROLL_OFFSET);
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top, behavior: "smooth" });
      } else {
        el.scrollTop = top;
      }
    },
    [navigable, rows, scrollRef],
  );

  useEffect(() => {
    if (!enabled) {
      setFocusedIndex(-1);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const editable =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (editable) return;
      // Don't intercept activation keys on native controls.
      if (
        (e.key === "Enter" && ["BUTTON", "A", "SELECT"].includes(target.tagName)) ||
        (e.key === "ArrowDown" && ["BUTTON", "A", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next = navigable.length === 0 ? -1 : (prev + 1) % navigable.length;
            scrollToRow(next);
            return next;
          });
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          setFocusedIndex((prev) => {
            const next =
              navigable.length === 0
                ? -1
                : prev <= 0
                  ? navigable.length - 1
                  : prev - 1;
            scrollToRow(next);
            return next;
          });
          break;
        }
        case "Home": {
          if (navigable.length === 0) break;
          e.preventDefault();
          setFocusedIndex(0);
          scrollToRow(0);
          break;
        }
        case "End": {
          if (navigable.length === 0) break;
          e.preventDefault();
          const last = navigable.length - 1;
          setFocusedIndex(last);
          scrollToRow(last);
          break;
        }
        case "Enter": {
          if (focusedIndex < 0 || focusedIndex >= navigable.length) break;
          e.preventDefault();
          openChat(navigable[focusedIndex].chat);
          setFocusedIndex(-1);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, navigable, focusedIndex, openChat, scrollToRow]);

  return focusedIndex;
}

interface UseChatListKeyboardNavBindingOptions {
  /** Rows as produced by buildChatRows. */
  rows: { kind: string; chat?: { id: string | number } }[];
  /** Current list view. */
  view: string;
  /** True while the global search overlay is open. */
  globalSearchOpen: boolean;
  /** True while the folder manager modal is open. */
  folderManagerOpen: boolean;
  /** True while a row context menu is open. */
  menu: boolean;
  /** True while a delete confirmation dialog is open. */
  deleteConfirm: boolean;
  /** True while bulk selection mode is active. */
  selectMode: boolean;
  /** Opens the chat through the standard list flow. */
  handleChatOpen: (chat: { id: string | number }) => void;
  /** Optional external open callback (e.g. mobile overlay). */
  onOpenChat?: (chat: { id: string | number }) => void;
  /** Scroll container of the virtualized list. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** Optional override for the open action. */
  openChat?: (chat: { id: string | number }) => void;
}

/**
 * Convenience binding for ChatListView: computes `enabled` from the list view
 * and overlay state, wires the open action, and delegates to the core hook.
 */
export function useChatListKeyboardNavBinding({
  rows,
  view,
  globalSearchOpen,
  folderManagerOpen,
  menu,
  deleteConfirm,
  selectMode,
  scrollRef,
  handleChatOpen,
  onOpenChat,
  openChat,
}: UseChatListKeyboardNavBindingOptions): number {
  const navEnabled =
    (view === "chats" || view === "channels") &&
    !globalSearchOpen &&
    !folderManagerOpen &&
    !menu &&
    !deleteConfirm &&
    !selectMode;
  const openChatFromNav = useCallback(
    (chat: { id: string | number }) => {
      handleChatOpen(chat);
      onOpenChat?.(chat);
    },
    [handleChatOpen, onOpenChat],
  );
  return useChatListKeyboardNav({
    rows,
    enabled: navEnabled,
    scrollRef,
    openChat: openChat ?? openChatFromNav,
  });
}
