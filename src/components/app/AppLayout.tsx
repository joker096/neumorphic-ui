import { lazy, Suspense } from "react";

const LazyStoryViewer = lazy(() => import("../../features/stories/components/StoryViewer").then(m => ({ default: m.StoryViewer })));
import { AppOverlays } from "./AppOverlays";
import { AppShell } from "./AppShell";
import { AuthShell } from "./AuthShell";
import { PendingInviteGate } from "./PendingInviteGate";
import { ServicesProvider } from "../../services";
import { createLocalServices } from "../../services/localServices";

const LazyCallOverlay = lazy(() => import("./CallOverlay").then((m) => ({ default: m.CallOverlay })));

export interface AppLayoutProps {
  ui: any; theme: any; isDark: any; setTheme: (t: any) => void;
  connectionStatus: string; connectionError: string | null;
  fontSize: string; view: string; subView: string | null; setSubView: (v: any) => void;
  activeStory: any; setActiveStory: (s: any) => void;
  showStoryComposer: boolean; onComposeStory: () => void; onCloseComposer: () => void;
  stealthMode: boolean; hideWhenOfficeOnly: boolean;
  handleNavigate: any; isChatListRoute: boolean;
  activeChat: any; setActiveChat: (c: any) => void;
  activeChatWorkspaceProps: any;
  onOpenChat: (chat: any, opts?: any) => void; onCloseChat: () => void;
  setView: (v: any) => void; goBack: () => void; pushView: (v: any, sub?: any) => void;
  handlePreviewCall: any; handlePreviewMessage: any; setFontSize: (f: string) => void;
  t: (key: string, fallback?: string) => string;
  onAddContactFromChat: any; draftTextByChat: Record<string, string>;
  activeBotId: string | null; setActiveBotId: (id: string | null) => void;
  miniAppBotId: string | null; setMiniAppBotId: (id: string | null) => void;
  contacts: any[]; setContacts: any; chats: any[]; setChats: any;
  handleProfileCall: any; handleProfileVideoCall: any; handleProfileMessage: any;
  handleProfileDelete: any; handleProfileEdit: any; handleProfileBlock: any; handleProfileToggleFavorite: any;
  pendingInvite: string | null; onDismissPendingInvite: () => void;
}

export function AppLayout({
  ui, theme, isDark, setTheme, connectionStatus, connectionError, fontSize,
  view, subView, setSubView, activeStory, setActiveStory, showStoryComposer,
  onComposeStory, onCloseComposer, stealthMode, hideWhenOfficeOnly,
  handleNavigate, isChatListRoute, activeChat, setActiveChat,
  activeChatWorkspaceProps, onOpenChat, onCloseChat, setView, goBack, pushView,
  handlePreviewCall, handlePreviewMessage, setFontSize,
  t, onAddContactFromChat, draftTextByChat,
  activeBotId, setActiveBotId, miniAppBotId, setMiniAppBotId,
  contacts, setContacts, chats, setChats,
  handleProfileCall, handleProfileVideoCall, handleProfileMessage,
  handleProfileDelete, handleProfileEdit, handleProfileBlock, handleProfileToggleFavorite,
  pendingInvite, onDismissPendingInvite,
}: AppLayoutProps) {
  return (
    <ServicesProvider services={createLocalServices()}>
      <AuthShell
        theme={theme}
        isDark={isDark}
      >
        <AppShell
              {...ui}
              theme={theme}
              isDark={isDark}
              connectionStatus={connectionStatus}
              connectionError={connectionError}
              fontSize={fontSize}
              view={view}
              subView={subView}
              setSubView={setSubView}
              activeStory={activeStory}
              setActiveStory={setActiveStory}
              showStoryComposer={showStoryComposer}
              onComposeStory={onComposeStory}
              onCloseComposer={onCloseComposer}
              stealthMode={stealthMode}
              hideWhenOfficeOnly={hideWhenOfficeOnly}
              handleNavigate={handleNavigate}
              isChatListRoute={isChatListRoute}
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              activeChatWorkspaceProps={activeChatWorkspaceProps}
              onOpenChat={onOpenChat}
              onCloseChat={onCloseChat}
              setView={setView}
              goBack={goBack}
              pushView={pushView}
              handlePreviewCall={handlePreviewCall}
              handlePreviewMessage={handlePreviewMessage}
              setFontSize={setFontSize}
              t={t}
              onAddContactFromChat={onAddContactFromChat}
              draftTextByChat={draftTextByChat}
              activeBotId={activeBotId}
              setActiveBotId={setActiveBotId}
              miniAppBotId={miniAppBotId}
              setMiniAppBotId={setMiniAppBotId}
            />
            <AppOverlays
              {...ui}
              setAdvancedFilters={ui.setAdvancedFilters as any}
              isDark={isDark}
              view={view}
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              contacts={contacts}
              setContacts={setContacts as any}
              chats={chats}
              setChats={setChats as any}
              t={t}
              onProfileCall={handleProfileCall}
              onProfileVideoCall={handleProfileVideoCall}
              onProfileMessage={handleProfileMessage}
              onProfileDelete={handleProfileDelete}
              onProfileEdit={handleProfileEdit}
              onProfileBlock={handleProfileBlock}
              onProfileToggleFavorite={handleProfileToggleFavorite}
              onAddContactFromChat={onAddContactFromChat}
            />

        {pendingInvite && (
          <PendingInviteGate code={pendingInvite} t={t} onDismiss={onDismissPendingInvite} />
        )}
      </AuthShell>
      <Suspense fallback={null}><LazyCallOverlay /></Suspense>
      <Suspense fallback={null}><LazyStoryViewer /></Suspense>
    </ServicesProvider>
  );
}
