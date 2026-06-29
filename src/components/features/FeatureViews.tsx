import { ContactsView } from "../ContactsView";
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
            setView("chats");
          }}
        />
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
      return <RecordingsScreen theme={theme} onBack={() => setView("settings")} />;
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
            setView("chats");
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
