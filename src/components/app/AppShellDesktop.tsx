import { useState, type MouseEvent as ReactMouseEvent } from "react";
import { AppSideList } from "./AppSideList";
import { AppMainContent } from "./AppMainContent";
import { EcoSidebarNav } from "../ecochat/EcoSidebarNav";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../constants/storage";
import type { Contact } from "../../types/contact";

interface AppShellDesktopProps {
  theme: "light" | "dark";
  isDark: boolean;
  view: string;
  isChatListRoute: boolean;
  activeChatId?: string | number;
  chatsUnread: number;
  companyUnread: number;
  hideWhenOfficeOnly: boolean;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "blocked" | "error";
  connectionError?: string | null;
  onNavigate: (view: any) => void;
  setView: (view: any) => void;
  contacts: Contact[];
  setContacts: (updater: any) => void;
  handlePreviewCall: (name: string, color?: string, callType?: "audio" | "video") => void;
  handlePreviewMessage: (name: string, color?: string) => void;
  chatListProps: any;
  mainContentProps: any;
  onOpenPremium: () => void;
  t: (key: string, fallback?: string) => string;
}

export function AppShellDesktop({
  theme,
  isDark,
  view,
  isChatListRoute,
  activeChatId,
  chatsUnread,
  companyUnread,
  hideWhenOfficeOnly,
  connectionStatus,
  connectionError,
  onNavigate,
  setView,
  contacts,
  setContacts,
  handlePreviewCall,
  handlePreviewMessage,
  chatListProps,
  mainContentProps,
  onOpenPremium,
  t,
}: AppShellDesktopProps) {
  const [sideWidth, setSideWidth] = useLocalStorage<number>(STORAGE_KEYS.SIDE_PANEL_WIDTH, 320);
  const clampSideWidth = (w: number) => Math.min(480, Math.max(240, w));
  const startSideResize = (e: ReactMouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = clampSideWidth(sideWidth);
    const onMove = (ev: globalThis.MouseEvent) => setSideWidth(clampSideWidth(startW + ev.clientX - startX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      className="ds-shell hidden md:grid md:grid-rows-[minmax(0,1fr)] w-full h-full min-h-0 overflow-hidden"
      style={{ gridTemplateColumns: `76px ${clampSideWidth(sideWidth)}px 4px 1fr` }}
    >
      {/* Icon Rail */}
      <aside aria-label={t("a11y.navSidebar")} className="z-40">
        <EcoSidebarNav
          activeView={view}
          isDark={isDark}
          unreadCount={chatsUnread}
          companyUnreadCount={companyUnread}
          onNavigate={onNavigate}
          hideCompany={hideWhenOfficeOnly}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          t={t}
        />
      </aside>

      {/* Side List — persistent across views (Telegram Desktop keeps the list visible) */}
      <AppSideList
        view={view}
        isChatListRoute={isChatListRoute}
        theme={theme}
        isDark={isDark}
        chatListProps={{
          ...chatListProps,
          activeChatId,
        }}
        contacts={contacts}
        setContacts={setContacts}
        handlePreviewCall={handlePreviewCall}
        handlePreviewMessage={handlePreviewMessage}
        setView={setView}
        onOpenPremium={onOpenPremium}
      />

      {/* Drag to resize the side list; double-click resets to 320px */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={t("desktop.resizePanel", "Drag to resize panel")}
        title={t("desktop.resizePanel", "Drag to resize panel")}
        className="cursor-col-resize hover:bg-[var(--accent)]/40"
        onMouseDown={startSideResize}
        onDoubleClick={() => setSideWidth(320)}
      />

      {/* Main Content (desktop only) — open chat stays; full-panel features override */}
      <AppMainContent isMobile={false} isChatListRoute={isChatListRoute} {...mainContentProps} />
    </div>
  );
}
