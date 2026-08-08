import { lazy, Suspense, type ComponentType } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const SettingsView = lazy(() => import("../SettingsView").then(m => ({ default: m.SettingsView })));
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
  fontSize?: string;
  setFontSize?: (s: string) => void;
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
}: FeatureViewsProps) => {
  const { theme, setTheme } = useTheme();

  switch (view) {
    case "settings":
      return (
        <Suspense fallback={<Loader />}>
          <SettingsView theme={theme} setTheme={setTheme} setSubView={setSubView} fontSize={fontSize} setFontSize={setFontSize} />
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




