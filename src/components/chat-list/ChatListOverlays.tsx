import { Suspense, lazy, useEffect, useState } from "react";

const GlobalSearchLazy = lazy(() => import("../GlobalSearch").then((m) => ({ default: m.GlobalSearch })));

type Translate = (key: string, options?: any) => string;

/** Ctrl/Cmd+K toggles the global search overlay (desktop shortcut). */
export function useGlobalSearchToggle(): [boolean, (open: boolean) => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return [open, setOpen];
}

interface ChatListOverlaysProps {
  isDark: boolean;
  chats: any[];
  channels: any[];
  contacts: any[];
  onClose: () => void;
  onOpenChat: (chat: any) => void;
  onOpenContact: (contact: any) => void;
  t: Translate;
}

/** Full-list search overlay, lazily loaded and mounted only while open. */
export function ChatListOverlays({ isDark, chats, channels, contacts, onClose, onOpenChat, onOpenContact, t }: ChatListOverlaysProps) {
  return (
    <Suspense fallback={null}>
      <GlobalSearchLazy
        isDark={isDark}
        chats={chats}
        channels={channels}
        contacts={contacts}
        onClose={onClose}
        onOpenChat={onOpenChat}
        onOpenContact={onOpenContact}
        t={t}
      />
    </Suspense>
  );
}
