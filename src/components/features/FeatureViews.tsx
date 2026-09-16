import { lazy, Suspense } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useI18n } from "../../lib/i18n";
import { useAppStore } from "../../store";
import { isCompanyAdmin } from "../../config/navigation";
import { DataState } from "../ui/DataState";

const LazyProfileView = lazy(() => import("../ProfileView").then(m => ({ default: m.ProfileView })));
const LazyBotProfileView = lazy(() => import("./bot/BotProfileView").then(m => ({ default: m.BotProfileView })));
const LazyMiniApp = lazy(() => import("./bot/MiniAppView").then(m => ({ default: m.MiniApp })));
const LazyWorkplaceView = lazy(() => import("./workplace/WorkplaceView").then(m => ({ default: m.WorkplaceView })));

export const LazySettingsView = lazy(() => import("../SettingsView").then(m => ({ default: m.SettingsView })));
export const LazyContactsView = lazy(() => import("../ContactsView").then(m => ({ default: m.ContactsView })));
export const LazyCrmView = lazy(() => import("../crm/CrmView").then(m => ({ default: m.CrmView })));
export const LazyRecordingsScreen = lazy(() => import("../RecordingsScreen").then(m => ({ default: m.RecordingsScreen })));
export const LazyMeshRadar = lazy(() => import("../MeshRadar").then(m => ({ default: m.MeshRadar })));
export const LazyCallLogView = lazy(() => import("../call/CallLogView").then(m => ({ default: m.CallLogView })));
export const LazyPremiumSection = lazy(() => import("../settings/PremiumSection").then(m => ({ default: m.PremiumSection })));

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
  pushView?: (view: string, subView?: string | null) => void;
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
  pushView,
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
  const { t } = useI18n();
  const userProfile = useAppStore((s) => s.userProfile);
  const companyMembers = useAppStore((s) => s.companyMembers);
  const adminOnlyAccessible = isCompanyAdmin(companyMembers, userProfile.id);

  switch (view) {
    case "profile":
      return (
        <Suspense fallback={<Loader />}>
          <LazyProfileView setView={setView} />
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
      if (subView === 'callLog') {
        return (
          <Suspense fallback={<Loader />}>
            <LazyCallLogView isDark={theme === 'dark'} onBack={() => setSubView?.(null)} onOpenContacts={() => { setSubView?.(null); onNavigate?.('contacts'); }} />
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
      if (subView === 'premium') {
        return (
          <Suspense fallback={<Loader />}>
            <LazyPremiumSection isDark={theme === 'dark'} onBack={() => { if (goBack) goBack(); else setSubView?.(null); }} />
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
          <LazyCallLogView isDark={theme === 'dark'} onBack={() => setSubView?.(null)} onOpenContacts={() => onNavigate?.('contacts')} />
        </Suspense>
      );
    case "company":
      return (
        <Suspense fallback={<Loader />}>
          <LazyCrmView
            theme={theme === 'dark' ? 'dark' : 'light'}
            onCall={onCall}
            onVideoCall={(name, color) => onVideoCall(name, color)}
            onMessage={(name, color) => {
              onMessage(name, color);
              onNavigate?.("chats");
            }}
            onOpenPremium={() => {
              if (pushView) pushView("settings", "premium");
              else { setSubView?.("premium"); setView("settings"); }
            }}
          />
        </Suspense>
      );
    case "bot":
      return (
        <Suspense fallback={<Loader />}>
          <LazyBotProfileView
            botId={activeBotId ?? ""}
            isDark={theme === "dark"}
            onBack={() => {
              setActiveBotId?.(null);
              if (goBack) goBack(); else setView("bots");
            }}
            onOpenMiniApp={(id) => {
              setMiniAppBotId?.(id);
              if (pushView) pushView("miniApp"); else setView("miniApp");
            }}
            onStart={(botName) => {
              onMessage(botName);
              setActiveBotId?.(null);
              setView("chats");
            }}
          />
        </Suspense>
      );
    case "miniApp":
      return (
        <Suspense fallback={<Loader />}>
          <LazyMiniApp
            botId={miniAppBotId ?? ""}
            isDark={theme === "dark"}
            onClose={() => { if (goBack) goBack(); else setView("bot") }}
          />
        </Suspense>
      );
    case "workplace":
      if (!adminOnlyAccessible) {
        return (
          <DataState
            status="error"
            isDark={theme === "dark"}
            title={t("workplace.adminOnlyTitle", "Admin access required")}
            description={t("workplace.adminOnlyBody", "The workspace is restricted to company administrators.")}
          />
        );
      }
      return (
        <Suspense fallback={<Loader />}>
          <LazyWorkplaceView isDark={theme === "dark"} />
        </Suspense>
      );
    default:
      return null;
  }
};




