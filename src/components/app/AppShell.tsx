import React from "react";
import { AnimatePresence } from "motion/react";
import { ChatListView } from "../ChatListView";
import { ContentView } from "./ContentView";
import { BottomNav, SidebarNav } from "../navigation";
import { SafeRender } from "../resilience";
import { FeatureViews } from "../../lib/lazyViews";
import { ActiveChatWorkspace } from "../chat/ActiveChatWorkspace";
import type { Contact } from "../../types/contact";
import { EcoSidebarNav } from "../ecochat/EcoSidebarNav";
import { LazyContactsView, LazyCompanyContactsView, LazyCallLogView } from "../features/FeatureViews";
import { useIsMobile } from "../../hooks/useMediaQuery";

export interface AppShellProps {
  theme: "light" | "dark";
  isDark: boolean;
  fontSize: string;
  view: string;
  subView: string | null;
  setSubView: (v: string | null) => void;
  activeStory: { id: number; name: string; color: string } | null;
  setActiveStory: (story: { id: number; name: string; color: string } | null) => void;
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
  chatListWorkspaceProps: any;
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
  setShowAdvancedFilterModal: (show: boolean) => void;
  advancedFilters: Record<string, boolean>;
  handlePreviewCall: (name: string, color?: string, callType?: "audio" | "video") => void;
  handlePreviewMessage: (name: string, color?: string) => void;
  setFontSize: (size: string) => void;
  t: (key: string, opts?: string) => string;
  showAddContactFromChat?: boolean;
  setShowAddContactFromChat?: (show: boolean) => void;
  onAddContactFromChat?: (name: string, id: string, color?: string, localFields?: any[]) => void;
  activeBotId?: string | null;
  setActiveBotId?: (id: string | null) => void;
  miniAppBotId?: string | null;
  setMiniAppBotId?: (id: string | null) => void;
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
  chatListWorkspaceProps,
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
  setShowAdvancedFilterModal,
  advancedFilters,
  handlePreviewCall,
  handlePreviewMessage,
  setFontSize,
  t,
  showAddContactFromChat,
  setShowAddContactFromChat,
  onAddContactFromChat,
  activeBotId,
  setActiveBotId,
  miniAppBotId,
  setMiniAppBotId,
}: AppShellProps) {
  const isMobile = useIsMobile();
  return (
    <div data-theme={theme} data-font-size={fontSize} className={`w-full h-[100dvh] flex font-sans select-none overflow-hidden relative ${isDark ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-[var(--text-primary)]"}`}>
      <div id="sr-region" aria-live="polite" role="status" className="sr-only" />

      {/* 3-column desktop layout: rail (76px) + side list (320px) + main (flexible) — rendered only on md+ */}
      {!isMobile && (
        <div className="hidden md:grid md:grid-cols-[76px_320px_1fr] md:grid-rows-[minmax(0,1fr)] w-full h-full min-h-0 overflow-hidden">
        {/* Icon Rail */}
        <aside aria-label="Navigation sidebar" className="z-40">
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
        <aside aria-label="Side list" className="z-30 border-r border-[var(--border-color)] min-w-0">
          {isChatListRoute ? (
            <SafeRender>
              <ChatListView
                theme={theme}
                view={view}
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
                chatSearchQuery={chatSearchQuery}
                setChatSearchQuery={setChatSearchQuery}
                filteredChats={filteredChats}
                filteredChannels={filteredChannels}
                bots={bots}
                archivedUnreadCount={archivedUnreadCount}
                toggleArchive={toggleArchive}
                contacts={contacts}
                setGlobalSelectedContact={setGlobalSelectedContact}
                setActiveChat={setActiveChat}
                activeChatId={activeChat?.id}
                setView={setView}
                setActiveStory={setActiveStory}
                onComposeStory={onComposeStory}
                setShowCreateChannel={setShowCreateChannel}
                setShowCreateBot={setShowCreateBot}
                setShowAdvancedFilterModal={setShowAdvancedFilterModal}
                advancedFilters={advancedFilters}
                t={t}
                isDark={isDark}
                onCall={handlePreviewCall}
                onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                showAddContactFromChat={showAddContactFromChat}
                setShowAddContactFromChat={setShowAddContactFromChat}
                onAddContactFromChat={onAddContactFromChat}
              />
            </SafeRender>
          ) : view === "contacts" ? (
            <SafeRender>
              <LazyContactsView
                theme={theme}
                contacts={contacts}
                setContacts={setContacts}
                onCall={handlePreviewCall}
                onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                onMessage={handlePreviewMessage}
              />
            </SafeRender>
          ) : view === "company" ? (
            <SafeRender>
              <LazyCompanyContactsView
                theme={theme}
                onCall={handlePreviewCall}
                onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                onMessage={handlePreviewMessage}
              />
            </SafeRender>
          ) : view === "calls" ? (
            <SafeRender>
              <LazyCallLogView isDark={isDark} onBack={() => setView("chats")} />
            </SafeRender>
          ) : null}
        </aside>

        {/* Main Content (desktop only) — open chat stays; full-panel features (settings/profile/...) override */}
        <main id="main-content" role="main" aria-label="Main content" className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col" style={{ minHeight: 0 }}>
            <AnimatePresence mode="wait">
              <ContentView
                isDark={isDark}
                onCloseStory={() => setActiveStory(null)}
                activeStory={activeStory}
                isStealthMode={stealthMode}
                showStoryComposer={showStoryComposer}
                onCloseComposer={onCloseComposer}
              >
                {(["settings", "profile", "recordings", "radar", "workplace", "bot", "miniApp"].includes(view)) ? (
                  <SafeRender>
                    <FeatureViews
                      view={view}
                      subView={subView}
                      setSubView={setSubView}
                      contacts={contacts}
                      setContacts={setContacts}
                      showContactPicker={showContactPicker}
                      setShowContactPicker={setShowContactPicker}
                      setEditingContact={setEditingContact}
                      chats={chats}
                      setChats={setChats}
                      setActiveChat={setActiveChat}
                      setView={setView as any}
                      onCall={handlePreviewCall}
                      onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                      onMessage={handlePreviewMessage}
                      fontSize={fontSize}
                      setFontSize={setFontSize}
                      activeBotId={activeBotId}
                      setActiveBotId={setActiveBotId}
                      miniAppBotId={miniAppBotId}
                      setMiniAppBotId={setMiniAppBotId}
                    />
                  </SafeRender>
                ) : activeChat ? (
                  <SafeRender>
                    <ActiveChatWorkspace {...activeChatWorkspaceProps} />
                  </SafeRender>
                ) : null}
              </ContentView>
            </AnimatePresence>
          </div>
        </main>
      </div>
      )}

      {/* Mobile layout: single column — rendered only below md */}
      {isMobile && (
      <main id="main-content" role="main" aria-label="Main content" className="flex-1 flex flex-col min-w-0 pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait">
              <ContentView
                isDark={isDark}
                onCloseStory={() => setActiveStory(null)}
                activeStory={activeStory}
                isStealthMode={stealthMode}
                showStoryComposer={showStoryComposer}
                onCloseComposer={onCloseComposer}
              >
                {isChatListRoute ? (
                activeChat ? (
                  <SafeRender>
                    <ActiveChatWorkspace {...activeChatWorkspaceProps} />
                  </SafeRender>
                ) : (
                  <SafeRender>
                    <ChatListView
                      theme={theme}
                      view={view}
                      activeFolder={activeFolder}
                      setActiveFolder={setActiveFolder}
                      chatSearchQuery={chatSearchQuery}
                      setChatSearchQuery={setChatSearchQuery}
                      filteredChats={filteredChats}
                      filteredChannels={filteredChannels}
                      bots={bots}
                      archivedUnreadCount={archivedUnreadCount}
                      toggleArchive={toggleArchive}
                      contacts={contacts}
                      setGlobalSelectedContact={setGlobalSelectedContact}
                      setActiveChat={setActiveChat}
                      setView={setView}
                      setActiveStory={setActiveStory}
                      setShowCreateChannel={setShowCreateChannel}
                      setShowCreateBot={setShowCreateBot}
                      setShowAdvancedFilterModal={setShowAdvancedFilterModal}
                      advancedFilters={advancedFilters}
                      t={t}
                      isDark={isDark}
                      onCall={handlePreviewCall}
                      onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                      showAddContactFromChat={showAddContactFromChat}
                      setShowAddContactFromChat={setShowAddContactFromChat}
                      onAddContactFromChat={onAddContactFromChat}
                    />
                  </SafeRender>
                )
              ) : (
                <SafeRender>
                  <FeatureViews
                    view={view}
                    subView={subView}
                    setSubView={setSubView}
                    contacts={contacts}
                    setContacts={setContacts}
                    showContactPicker={showContactPicker}
                    setShowContactPicker={setShowContactPicker}
                    setEditingContact={setEditingContact}
                    chats={chats}
                    setChats={setChats}
                    setActiveChat={setActiveChat}
                    setView={setView as any}
                    onCall={handlePreviewCall}
                    onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
                    onMessage={handlePreviewMessage}
                    fontSize={fontSize}
                    setFontSize={setFontSize}
                    activeBotId={activeBotId}
                    setActiveBotId={setActiveBotId}
                    miniAppBotId={miniAppBotId}
                    setMiniAppBotId={setMiniAppBotId}
                  />
                </SafeRender>
              )}
            </ContentView>
          </AnimatePresence>
        </div>
      </main>
      )}

      <footer aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
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
