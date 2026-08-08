import React from "react";
import { AnimatePresence } from "motion/react";
import { ChatListView } from "../ChatListView";
import { ContentView } from "./ContentView";
import { BottomNav, SidebarNav } from "../navigation";
import { SafeRender } from "../resilience";
import { FeatureViews } from "../../lib/lazyViews";
import { ActiveChatWorkspace } from "../chat/ActiveChatWorkspace";
import type { Contact } from "../../types/contact";

export interface AppShellProps {
  theme: "light" | "dark";
  isDark: boolean;
  fontSize: string;
  view: string;
  subView: string | null;
  setSubView: (v: string | null) => void;
  activeStory: { id: number; name: string; color: string } | null;
  setActiveStory: (story: { id: number; name: string; color: string } | null) => void;
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
  t: (key: string, opts?: any) => string;
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
}: AppShellProps) {
  return (
    <div data-theme={theme} data-font-size={fontSize} className={`w-full h-[100dvh] flex font-sans select-none overflow-hidden relative ${isDark ? "bg-[var(--bg-primary)] text-[var(--text-primary)]" : "bg-[var(--bg-primary)] text-[var(--text-primary)]"}`}>
      <div id="sr-region" aria-live="polite" role="status" className="sr-only" />

      <aside aria-label="Navigation sidebar" className="z-40 md:z-40">
        <SidebarNav
          activeView={view}
          isDark={isDark}
          unreadCount={chatsUnread}
          companyUnreadCount={companyUnread}
          onNavigate={handleNavigate}
          t={t}
          hideCompany={hideWhenOfficeOnly}
        />
      </aside>

      <main id="main-content" role="main" aria-label="Main content" className="flex-1 flex flex-col min-w-0 pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:pb-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col" style={{ minHeight: 0 }}>
          <AnimatePresence mode="wait">
            <ContentView
              isDark={isDark}
              onCloseStory={() => setActiveStory(null)}
              activeStory={activeStory}
              isStealthMode={stealthMode}
            >
              {isChatListRoute && (
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
                  />
                </SafeRender>
              )}
              {activeChat && (
                <SafeRender>
                  <ActiveChatWorkspace {...activeChatWorkspaceProps} />
                </SafeRender>
              )}
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
                />
              </SafeRender>
            </ContentView>
          </AnimatePresence>
        </div>
      </main>

      <footer aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 md:hidden z-50">
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
