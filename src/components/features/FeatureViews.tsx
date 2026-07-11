import { ContactsView } from "../ContactsView";
import { CallLogView } from "../call/CallLogView";
import { Dialpad } from "../Dialpad";
import { LandingPage } from "../landing/LandingPage";
import { MeshRadar } from "../MeshRadar";
import { RecordingsScreen } from "../RecordingsScreen";
import { SettingsView } from "../SettingsView";
import { SystemPulsePlayer } from "../SystemPulsePlayer/SystemPulsePlayer";
import { CompanyContactsView } from "../CompanyContactsView";
import { useTheme } from "../../contexts/ThemeContext";

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
      return <LandingPage isDark={theme === 'dark'} onGetStarted={() => setView('chats')} />;
    case "pulse":
      return <SystemPulsePlayer theme={theme} />;
    case "radar":
      return <MeshRadar theme={theme} />;
    case "calls":
      return (
        <div className="w-full flex-1 flex flex-col md:flex-row gap-0 md:gap-4 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#1a1d24] min-h-0">
            <CallLogView theme={theme} onCall={(name) => onCall(name)} />
          </div>
          <div className="shrink-0 md:w-[320px] lg:w-[360px] border-t md:border-t-0 md:border-l border-white/5 bg-[#1a1d24] rounded-2xl overflow-hidden">
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
      );
    case "settings":
      if (subView === "recordings") {
        return <RecordingsScreen theme={theme} onBack={() => setSubView?.(null)} />;
      }
      if (subView === "radar") {
        return <MeshRadar theme={theme} />;
      }
      return <SettingsView theme={theme} setTheme={setTheme} setSubView={setSubView} />;
    case "recordings":
      return <RecordingsScreen theme={theme} onBack={() => goBack?.()} />;
    case "contacts":
      return (
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
      );
    case "company":
      return (
        <CompanyContactsView
          theme={theme}
          onCall={onCall}
          onVideoCall={onVideoCall}
          onMessage={onMessage}
        />
      );
    default:
      return null;
  }
};
