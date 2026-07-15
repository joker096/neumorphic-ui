import { lazy, Suspense, type ComponentType } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const LandingPage = lazy(() => import("../landing/LandingPage").then(m => ({ default: m.LandingPage })));
const SystemPulsePlayer = lazy(() => import("../SystemPulsePlayer/SystemPulsePlayer").then(m => ({ default: m.SystemPulsePlayer })));
const MeshRadar = lazy(() => import("../MeshRadar").then(m => ({ default: m.MeshRadar })));
const CallLogView = lazy(() => import("../call/CallLogView").then(m => ({ default: m.CallLogView })));
const Dialpad = lazy(() => import("../Dialpad").then(m => ({ default: m.Dialpad })));
const SettingsView = lazy(() => import("../SettingsView").then(m => ({ default: m.SettingsView })));
const RecordingsScreen = lazy(() => import("../RecordingsScreen").then(m => ({ default: m.RecordingsScreen })));
const ContactsView = lazy(() => import("../ContactsView").then(m => ({ default: m.ContactsView })));
const CompanyContactsView = lazy(() => import("../CompanyContactsView").then(m => ({ default: m.CompanyContactsView })));

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
}: FeatureViewsProps) => {
  const { theme, setTheme } = useTheme();

  switch (view) {
    case "hub":
      return (
        <Suspense fallback={<Loader />}>
          <LandingPage isDark={theme === 'dark'} onGetStarted={() => setView('chats')} />
        </Suspense>
      );
    case "pulse":
      return (
        <Suspense fallback={<Loader />}>
          <SystemPulsePlayer theme={theme} />
        </Suspense>
      );
    case "radar":
      return (
        <Suspense fallback={<Loader />}>
          <MeshRadar theme={theme} />
        </Suspense>
      );
    case "calls":
      return (
        <Suspense fallback={<Loader />}>
          <div className="w-full flex-1 flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1a1d24] min-h-0">
              <CallLogView theme={theme} onCall={(name) => onCall(name)} />
            </div>
            <div className="shrink-0 md:w-[320px] lg:w-[360px] border-t md:border-t-0 md:border-l border-white/5 bg-[#1a1d24] rounded-2xl overflow-hidden h-full">
              <Dialpad
                theme={theme}
                contacts={contacts}
                showContactPicker={showContactPicker}
                setShowContactPicker={setShowContactPicker}
                setEditingContact={setEditingContact}
                onCall={onCall}
                onVideoCall={onVideoCall}
                onMessage={(name, color) => {
                  onMessage(name, color);
                  onNavigate?.("chats");
                }}
              />
            </div>
          </div>
        </Suspense>
      );
    case "settings":
      if (subView === "recordings") {
        return (
          <Suspense fallback={<Loader />}>
            <RecordingsScreen theme={theme} onBack={() => setSubView?.(null)} />
          </Suspense>
        );
      }
      if (subView === "radar") {
        return (
          <Suspense fallback={<Loader />}>
            <MeshRadar theme={theme} />
          </Suspense>
        );
      }
      return (
        <Suspense fallback={<Loader />}>
          <SettingsView theme={theme} setTheme={setTheme} setSubView={setSubView} />
        </Suspense>
      );
    case "recordings":
      return (
        <Suspense fallback={<Loader />}>
          <RecordingsScreen theme={theme} onBack={() => goBack?.()} />
        </Suspense>
      );
    case "contacts":
      return (
        <Suspense fallback={<Loader />}>
          <ContactsView
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
    case "company":
      return (
        <Suspense fallback={<Loader />}>
          <CompanyContactsView
            theme={theme}
            onCall={onCall}
            onVideoCall={onVideoCall}
            onMessage={onMessage}
          />
        </Suspense>
      );
    default:
      return null;
  }
};
