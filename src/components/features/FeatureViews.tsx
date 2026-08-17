import { lazy, Suspense, type ComponentType } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { ProfileView } from "../ProfileView";
import { BotProfileView } from "./bot/BotProfileView";
import { MiniApp } from "./bot/MiniAppView";
import { WorkplaceView } from "./workplace/WorkplaceView";

export const LazySettingsView = lazy(() => import("../SettingsView").then(m => ({ default: m.SettingsView })));
export const LazyContactsView = lazy(() => import("../ContactsView").then(m => ({ default: m.ContactsView })));
export const LazyCompanyContactsView = lazy(() => import("../CompanyContactsView").then(m => ({ default: m.CompanyContactsView })));
export const LazyRecordingsScreen = lazy(() => import("../RecordingsScreen").then(m => ({ default: m.RecordingsScreen })));
export const LazyMeshRadar = lazy(() => import("../MeshRadar").then(m => ({ default: m.MeshRadar })));
export const LazyCallLogView = lazy(() => import("../call/CallLogView").then(m => ({ default: m.CallLogView })));

type FeatureViewsProps = {
  view: string;
  subView?: string | null;
  setSubView?: (subView: string | null) => void;
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  showContactPicker: boolean;
  setShowContactPicker: (show: boolean) => void;
  setEditingContact: (contact: any | null) => void;
  chats: any[];
  setChats: (chats: any[]) => void;
  setActiveChat: (chat: any) => void;
  setView: (view: string) => void;
  goBack?: () => void;
  onNavigate?: (view: string) => void;
  onCall: (name: string, color?: string) => void;
  onVideoCall: (name: string, color?: string) => void;
  onMessage: (name: string, color?: string) => void;
  fontSize?: string;
  setFontSize?: (s: string) => void;
  activeBotId?: string | null;
  setActiveBotId?: (id: string | null) => void;
  miniAppBotId?: string | null;
  setMiniAppBotId?: (id: string | null) => void;
};

function Loader() {
  return (
    <div className="flex items-center justify-center h-[200px]">
      <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );
}

export const FeatureViews = ({
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
  goBack,
  onNavigate,
  onCall,
  onVideoCall,
  onMessage,
  fontSize,
  setFontSize,
  activeBotId,
  setActiveBotId,
  miniAppBotId,
  setMiniAppBotId,
}: FeatureViewsProps) => {
  const { theme, setTheme } = useTheme();

  switch (view) {
    case "profile":
      return (
        <Suspense fallback={<Loader />}>
          <ProfileView setView={setView} />
        </Suspense>
      );
    case "settings":
      if (subView === 'recordings') {
        return (
          <Suspense fallback={<Loader />}>
            <LazyRecordingsScreen isDark={theme === 'dark'} onBack={() => setSubView?.(null)} />
          </Suspense>
        );
      }
      if (subView === 'radar') {
        return (
          <Suspense fallback={<Loader />}>
            <LazyMeshRadar isDark={theme === 'dark'} onBack={() => setSubView?.(null)} />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<Loader />}>
            <LazySettingsView theme={theme} setTheme={setTheme} setSubView={setSubView} fontSize={fontSize} setFontSize={setFontSize} />
        </Suspense>
      );
    case "contacts":
      return (
        <Suspense fallback={<Loader />}>
          <LazyContactsView
            theme={theme}
            contacts={contacts}
            setContacts={setContacts}
            onCall={onCall}
            onVideoCall={(name, color) => onVideoCall(name, color)}
            onMessage={(name, color) => {
              onMessage(name, color);
              onNavigate?.("chats");
            }}
          />
        </Suspense>
      );
    case "calls":
      return (
        <Suspense fallback={<Loader />}>
          <LazyCallLogView isDark={theme === 'dark'} onBack={() => setSubView?.(null)} />
        </Suspense>
      );
    case "company":
      return (
        <Suspense fallback={<Loader />}>
          <LazyCompanyContactsView
            theme={theme}
            onCall={onCall}
            onVideoCall={onVideoCall}
            onMessage={onMessage}
          />
        </Suspense>
      );
    case "bot":
      return (
        <BotProfileView
          botId={activeBotId ?? ""}
          isDark={theme === "dark"}
          onBack={() => {
            setActiveBotId?.(null);
            setView("bots");
          }}
          onOpenMiniApp={(id) => {
            setMiniAppBotId?.(id);
            setView("miniApp");
          }}
        />
      );
    case "miniApp":
      return (
        <MiniApp
          botId={miniAppBotId ?? ""}
          isDark={theme === "dark"}
          onClose={() => setView("bot")}
        />
      );
    case "workplace":
      return <WorkplaceView isDark={theme === "dark"} />;
    default:
      return null;
  }
};




