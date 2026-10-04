import React from "react";
import { AppMainContent } from "./AppMainContent";
import { AppShellDesktop } from "./AppShellDesktop";
import { BottomNav } from "../navigation";
import { OfflineBanner } from "../status/OfflineBanner";
import type { Contact } from "../../types/contact";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useChatListData } from "../../hooks/useChatListData";

export interface AppShellProps {
  theme: "light" | "dark";
  isDark: boolean;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "blocked" | "error";
  connectionError?: string | null;
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
  handleNavigate: (view: any) => void;
  isChatListRoute: boolean;
  activeChat: any;
  setActiveChat: (chat: any) => void;
  activeChatWorkspaceProps: any;
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  setEditingContact: (contact: Contact | null) => void;
  setView: (view: any) => void;
  goBack?: () => void;
  pushView?: (view: string, subView?: string | null) => void;
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
  connectionStatus = "disconnected",
  connectionError = null,
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
  handleNavigate,
  isChatListRoute,
  activeChat,
  setActiveChat,
  activeChatWorkspaceProps,
  showContactPicker,
  setShowContactPicker,
  setEditingContact,
  setView,
  goBack,
  pushView,
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

  const {
    chatsUnread,
    companyUnread,
    activeFolder,
    setActiveFolder,
    chatSearchQuery,
    setChatSearchQuery,
    chatSortBy,
    setChatSortBy,
    filteredChats,
    filteredChannels,
    bots,
    archivedUnreadCount,
    toggleArchive,
    contacts,
    setContacts,
    chats,
    setChats,
  } = useChatListData();

  const handleOpenPremium = () => {
    if (pushView) pushView("settings", "premium");
    else { setSubView('premium'); setView('settings'); }
  };

  const chatListCoreProps = {
    theme,
    view,
    onOpenChat,
    activeFolder,
    setActiveFolder,
    chatSearchQuery,
    setChatSearchQuery,
    chatSortBy,
    setChatSortBy,
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
      if (pushView) pushView("bot");
      else setView("bot");
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
    goBack,
    pushView,
  };

  return (
    // Edge-to-edge (Android 15+ / viewport-fit=cover): the app draws behind the status bar
    // and, in landscape, behind the display cutout — so keep the shell clear of those insets.
    // Box-sizing is border-box, so h-[100dvh] shrinks by the insets and the fixed bottom nav
    // (which adds its own bottom inset) stays flush with the navigation bar.
    <div data-theme={theme} data-font-size={fontSize} className={`w-full h-[100dvh] flex flex-col font-sans select-none overflow-hidden relative pt-[env(safe-area-inset-top,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] ${"bg-[var(--bg-primary)] text-[var(--text-primary)]"}`}>
      <div id="sr-region" aria-live="polite" role="status" className="sr-only" />
      <OfflineBanner t={t} />
      <div className="flex-1 min-h-0 flex">

      {/* 3-column desktop layout: rail (76px) + resizable side list (240–480px) + main (flexible) */}
      {!isMobile && (
        <AppShellDesktop
          theme={theme}
          isDark={isDark}
          view={view}
          isChatListRoute={isChatListRoute}
          activeChatId={activeChat?.id}
          chatsUnread={chatsUnread}
          companyUnread={companyUnread}
          hideWhenOfficeOnly={hideWhenOfficeOnly}
          connectionStatus={connectionStatus}
          connectionError={connectionError}
          onNavigate={handleNavigate}
          setView={setView}
          contacts={contacts}
          setContacts={setContacts}
          handlePreviewCall={handlePreviewCall}
          handlePreviewMessage={handlePreviewMessage}
          chatListProps={chatListCoreProps}
          mainContentProps={mainContentProps}
          onOpenPremium={handleOpenPremium}
          t={t}
        />
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
          connectionStatus={connectionStatus}
          connectionError={connectionError}
        />
      </footer>
    </div>
  );
}

export const AppShell = React.memo(AppShellImpl);
AppShell.displayName = "AppShell";
