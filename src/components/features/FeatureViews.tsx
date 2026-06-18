import { ContactsView } from "../ContactsView";
import { Dialpad } from "../Dialpad";
import { MeshRadar } from "../MeshRadar";
import { RecordingsScreen } from "../RecordingsScreen";
import { SettingsView } from "../SettingsView";
import { SystemPulsePlayer } from "../SystemPulsePlayer";

type FeatureViewsProps = {
  view: string;
  theme: "light" | "dark";
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
  onMessage: (name: string, color?: string) => void;
};

export const FeatureViews = ({
  view,
  theme,
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
  onMessage,
}: FeatureViewsProps) => {
  switch (view) {
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
          onMessage={(name, color) => {
            onMessage(name, color);
            setView("chats");
          }}
        />
      );
    case "settings":
      return <SettingsView theme={theme} />;
    case "recordings":
      return <RecordingsScreen theme={theme} onBack={() => setView("hub")} />;
    case "contacts":
      return (
        <ContactsView
          theme={theme}
          contacts={contacts}
          setContacts={setContacts}
          onCall={onCall}
          onMessage={(name, color) => {
            onMessage(name, color);
            setView("chats");
          }}
        />
      );
    default:
      return null;
  }
};
