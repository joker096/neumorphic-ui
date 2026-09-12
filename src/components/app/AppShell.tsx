import React from "react";
import { AppSideList } from "./AppSideList";
import { AppMainContent } from "./AppMainContent";
import { BottomNav } from "../navigation";
import { EcoSidebarNav } from "../ecochat/EcoSidebarNav";
import { OfflineBanner } from "../status/OfflineBanner";
import { InstallAppBanner } from "../status/InstallAppBanner";
import type { Contact } from "../../types/contact";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { STORAGE_KEYS } from "../../constants/storage";

export interface AppShellProps {
  theme: "light" | "dark";
  isDark: boolean;
  fontSize: string;
  view: string;
  subView: string | null;
  setSubView: (v: string | null) => void;
  activeStory: { id: number | string; name: string; color: string } | null;
  setActiveStory: (story: { id: number | string; name: string; color: string } | null) => void;
  onComposeStory?: () => void;
  showStoryComposer?: boolean;
  onCloseComposer?: () => void;
  stealthMode: boolean;
  hideWhenOfficeOnly: boolean;
  chatsUnread: number;
  companyUnread: number;
  handleNavigate: (view: any) => void;
  isChatListRoute: boolean;
  activeChat: any;
  setActiveChat: (chat: any) => void;
  activeChatWorkspaceProps: any;
  activeFolder: string;
  setActiveFolder: (folder: string) => void;
  chatSearchQuery: string;
  setChatSearchQuery: (query: string) => void;
  filteredChats: any[];
  filteredChannels: any[];
  bots: any[];
  archivedUnreadCount: number;
  toggleArchive: (id: string | number) => void;
  contacts: Contact[];
  setContacts: (updater: any) => void;
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  setEditingContact: (contact: Contact | null) => void;
  chats: any[];
  setChats: (updater: any) => void;
  setView: (view: any) => void;
  setGlobalSelectedContact: (contact: any) => void;
  setShowCreateChannel: (show: boolean) => void;
  setShowCreateBot: (show: boolean) => void;
  setShowCreateGroup: (show: boolean) => void;
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: Record<string, boolean>;
  handlePreviewCall: (name: string, color?: string, callType?: "audio" | "video") => void;
  handlePreviewMessage: (name: string, color?: string) => void;
  onOpenChat?: (chat: any, opts?: { returnTo?: { view: string; subView?: string | null }; forceView?: string }) => void;
  onCloseChat?: () => void;
  setFontSize: (size: string) => void;
  t: (key: string, opts?: string) => string;
  showAddContactFromChat?: boolean;
  setShowAddContactFromChat?: (show: boolean) => void;
  onAddContactFromChat?: (name: string, id: string, color?: string, localFields?: any[]) => void;
  activeBotId?: string | null;
  setActiveBotId?: (id: string | null) => void;
  miniAppBotId?: string | null;
  setMiniAppBotId?: (id: string | null) => void;
  draftTextByChat?: Record<string, string>;
}

function AppShellImpl({
  theme,
  isDark,
  fontSize,
  view,
  subView,
  setSubView,
  activeStory,
  setActiveStory,
  onComposeStory,
  showStoryComposer,
  onCloseComposer,
  stealthMode,
  hideWhenOfficeOnly,
  chatsUnread,
  companyUnread,
  handleNavigate,
  isChatListRoute,
  activeChat,
  setActiveChat,
  activeChatWorkspaceProps,
  activeFolder,
  setActiveFolder,
  chatSearchQuery,
  setChatSearchQuery,
  filteredChats,
  filteredChannels,
  bots,
  archivedUnreadCount,
  toggleArchive,
  contacts,
  setContacts,
  showContactPicker,
  setShowContactPicker,
  setEditingContact,
  chats,
  setChats,
  setView,
  setGlobalSelectedContact,
  setShowCreateChannel,
  setShowCreateBot,
  setShowCreateGroup,
  setShowAdvancedFilterModal,
  advancedFilters,
  handlePreviewCall,
  handlePreviewMessage,
  onOpenChat,
  onCloseChat,
  setFontSize,
  t,
  showAddContactFromChat,
  setShowAddContactFromChat,
  onAddContactFromChat,
  activeBotId,
  setActiveBotId,
  miniAppBotId,
  setMiniAppBotId,
  draftTextByChat,
}: AppShellProps) {
  const isMobile = useIsMobile();
  const [sideWidth, setSideWidth] = useLocalStorage<number>(STORAGE_KEYS.SIDE_PANEL_WIDTH, 320);
  const clampSideWidth = (w: number) => Math.min(480, Math.max(240, w));
  const startSideResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = clampSideWidth(sideWidth);
    const onMove = (ev: MouseEvent) => setSideWidth(clampSideWidth(startW + ev.clientX - startX));
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const chatListCoreProps = {
    theme,
    view,
    onOpenChat,
    activeFolder,
    setActiveFolder,
    chatSearchQuery,
    setChatSearchQuery,
    filteredChats,
    filteredChannels,
    bots,
    archivedUnreadCount,
    toggleArchive,
    contacts,
    setGlobalSelectedContact,
    setActiveChat,
    setView,
    setActiveStory,
    onComposeStory,
    setShowCreateChannel,
    setShowCreateBot,
    setShowCreateGroup,
    setShowAdvancedFilterModal,
    advancedFilters,
    t,
    isDark,
    onCall: handlePreviewCall,
    onVideoCall: (name: string, color?: string) => handlePreviewCall(name, color, "video"),
    showAddContactFromChat,
    setShowAddContactFromChat,
    onAddContactFromChat,
    draftTextByChat,
    onOpenBot: (botId: string) => {
      setActiveBotId?.(botId);
      setView("bot");
    },
  };

  const mainContentProps = {
    theme,
    isDark,
    view,
    subView,
    setSubView,
    contacts,
    setContacts,
    showContactPicker,
    setShowContactPicker,
    setEditingContact,
    chats,
    setChats,
    setActiveChat,
    setView,
    handlePreviewCall,
    handlePreviewMessage,
    fontSize,
    setFontSize,
    activeStory,
    setActiveStory,
    showStoryComposer,
    onCloseComposer,
    stealthMode,
    activeChat,
    activeChatWorkspaceProps,
    onCloseChat,
    chatListProps: chatListCoreProps,
    activeBotId,
    setActiveBotId,
    miniAppBotId,
    setMiniAppBotId,
  };

  return (
    <div data-theme={theme} data-font-size={fontSize} className={`w-full h-[100dvh] flex flex-col font-sans select-none overflow-hidden relative ${"bg-[var(--bg-primary)] text-[var(--text-primary)]"}`}>
      <div id="sr-region" aria-live="polite" role="status" className="sr-only" />
      <OfflineBanner t={t} />
      <InstallAppBanner t={t} />
      <div className="flex-1 min-h-0 flex">

      {/* 3-column desktop layout: rail (76px) + resizable side list (240–480px) + main (flexible) */}
      {!isMobile && (
        <div
          className="hidden md:grid md:grid-rows-[minmax(0,1fr)] w-full h-full min-h-0 overflow-hidden"
          style={{ gridTemplateColumns: `76px ${clampSideWidth(sideWidth)}px 4px 1fr` }}
        >
          {/* Icon Rail */}
          <aside aria-label={t("a11y.navSidebar")} className="z-40">
            <EcoSidebarNav
              activeView={view}
              isDark={isDark}
              unreadCount={chatsUnread}
              companyUnreadCount={companyUnread}
              onNavigate={handleNavigate}
              hideCompany={hideWhenOfficeOnly}
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
              ...chatListCoreProps,
              activeChatId: activeChat?.id,
            }}
            contacts={contacts}
            setContacts={setContacts}
            handlePreviewCall={handlePreviewCall}
            handlePreviewMessage={handlePreviewMessage}
            setView={setView}
            onOpenPremium={() => { setSubView('premium'); setView('settings'); }}
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
      )}

      {/* Mobile layout: single column — rendered only below md */}
      {isMobile && <AppMainContent isMobile isChatListRoute={isChatListRoute} {...mainContentProps} />}
      </div>

      <footer aria-label={t("a11y.navMobile")} className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <BottomNav
          activeView={view}
          isDark={isDark}
          unreadCount={chatsUnread}
          companyUnreadCount={companyUnread}
          onNavigate={handleNavigate}
          t={t}
          hideCompany={hideWhenOfficeOnly}
        />
      </footer>
    </div>
  );
}

export const AppShell = React.memo(AppShellImpl);
AppShell.displayName = "AppShell";
