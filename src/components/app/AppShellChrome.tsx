import { Suspense, lazy } from "react";
import { BottomNav } from "../navigation";

const GlobalSearchLazy = lazy(() => import("../GlobalSearch").then((m) => ({ default: m.GlobalSearch })));

interface ShellMobileNavProps {
  view: string;
  isDark: boolean;
  chatsUnread: number;
  companyUnread: number;
  hideWhenOfficeOnly: boolean;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "blocked" | "error";
  connectionError?: string | null;
  onNavigate: (view: any) => void;
  t: (key: string, opts?: string) => string;
}

/** Mobile bottom navigation — one navigation surface per viewport. */
export function ShellMobileNav({
  view,
  isDark,
  chatsUnread,
  companyUnread,
  hideWhenOfficeOnly,
  connectionStatus,
  connectionError,
  onNavigate,
  t,
}: ShellMobileNavProps) {
  return (
    <footer aria-label={t("a11y.navMobile")} className="fixed bottom-0 left-0 right-0 z-50">
      <BottomNav
        activeView={view}
        isDark={isDark}
        unreadCount={chatsUnread}
        companyUnreadCount={companyUnread}
        hideCompany={hideWhenOfficeOnly}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
        onNavigate={onNavigate}
        t={t}
      />
    </footer>
  );
}

interface ShellGlobalSearchProps {
  isDark: boolean;
  chats: any[];
  channels: any[];
  contacts: any[];
  onClose: () => void;
  onOpenChat?: (chat: any, opts?: any) => void;
  onOpenContact: (contact: any) => void;
  t: (key: string, opts?: string) => string;
}

/** Lazy global search dialog, mounted only while open. */
export function ShellGlobalSearch({
  isDark,
  chats,
  channels,
  contacts,
  onClose,
  onOpenChat,
  onOpenContact,
  t,
}: ShellGlobalSearchProps) {
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
