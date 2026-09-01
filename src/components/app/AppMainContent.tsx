import { AnimatePresence } from "motion/react";
import { useRef } from "react";
import type { ReactNode } from "react";
import { useKeyboardScroll } from "../../hooks";
import { ContentView } from "./ContentView";
import { SafeRender } from "../resilience";
import { FeatureViews } from "../../lib/lazyViews";
import { ChatListView } from "../ChatListView";
import { ActiveChatWorkspace } from "../chat/ActiveChatWorkspace";
import type { Contact } from "../../types/contact";
import { useI18n } from "../../lib/i18n";

export interface AppMainContentProps {
  isMobile: boolean;
  isChatListRoute: boolean;
  theme: "light" | "dark";
  isDark: boolean;
  view: string;
  subView: string | null;
  setSubView: (v: string | null) => void;
  contacts: Contact[];
  setContacts: (updater: any) => void;
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  setEditingContact: (contact: Contact | null) => void;
  chats: any[];
  setChats: (updater: any) => void;
  setActiveChat: (chat: any) => void;
  setView: (view: any) => void;
  handlePreviewCall: (name: string, color?: string, callType?: "audio" | "video") => void;
  handlePreviewMessage: (name: string, color?: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  activeStory: { id: number; name: string; color: string } | null;
  setActiveStory: (story: { id: number; name: string; color: string } | null) => void;
  showStoryComposer?: boolean;
  onCloseComposer?: () => void;
  stealthMode: boolean;
  activeChat: any;
  activeChatWorkspaceProps: any;
  onCloseChat?: () => void;
  chatListProps: any;
  activeBotId?: string | null;
  setActiveBotId?: (id: string | null) => void;
  miniAppBotId?: string | null;
  setMiniAppBotId?: (id: string | null) => void;
}

export function AppMainContent({
  isMobile,
  isChatListRoute,
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
  chatListProps,
  activeBotId,
  setActiveBotId,
  miniAppBotId,
  setMiniAppBotId,
}: AppMainContentProps) {
  const { t } = useI18n();
  const mainScrollRef = useRef<HTMLDivElement>(null);
  useKeyboardScroll(mainScrollRef);

  const featureView = isMobile
    ? !isChatListRoute
    : ["settings", "profile", "recordings", "radar", "workplace", "bot", "miniApp"].includes(view);

  let content: ReactNode = null;
  if (featureView) {
    content = (
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
          onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, "video")}
          onMessage={handlePreviewMessage}
          fontSize={fontSize}
          setFontSize={setFontSize}
          activeBotId={activeBotId}
          setActiveBotId={setActiveBotId}
          miniAppBotId={miniAppBotId}
          setMiniAppBotId={setMiniAppBotId}
        />
      </SafeRender>
    );
  } else if (activeChat) {
    content = (
      <SafeRender>
        <ActiveChatWorkspace {...activeChatWorkspaceProps} onCloseChat={onCloseChat} />
      </SafeRender>
    );
  } else if (isMobile && isChatListRoute) {
    content = (
      <SafeRender>
        <ChatListView {...chatListProps} />
      </SafeRender>
    );
  }

  return (
    <main
      id="main-content"
      role="main"
      aria-label={t("a11y.mainContent")}
      className={isMobile
        ? "flex-1 flex flex-col min-w-0 pb-[calc(56px+env(safe-area-inset-bottom,0px))] md:hidden"
        : "flex-1 flex flex-col min-w-0 min-h-0"}
    >
      <div ref={mainScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col" style={{ minHeight: 0 }}>
        <AnimatePresence mode="wait">
          <ContentView
            isDark={isDark}
            onCloseStory={() => setActiveStory(null)}
            activeStory={activeStory}
            isStealthMode={stealthMode}
            showStoryComposer={showStoryComposer}
            onCloseComposer={onCloseComposer}
          >
            {content}
          </ContentView>
        </AnimatePresence>
      </div>
    </main>
  );
}
