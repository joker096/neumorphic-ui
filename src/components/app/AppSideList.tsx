import { SafeRender } from "../resilience";
import { LazyContactsView, LazyCrmView, LazyCallLogView } from "../features/FeatureViews";
import { ChatListView } from "../ChatListView";
import { useI18n } from "../../lib/i18n";

interface AppSideListProps {
  view: string;
  isChatListRoute: boolean;
  theme: "light" | "dark";
  isDark: boolean;
  chatListProps: any;
  contacts: any[];
  setContacts: (updater: any) => void;
  handlePreviewCall: (name: string, color?: string, callType?: "audio" | "video") => void;
  handlePreviewMessage: (name: string, color?: string) => void;
  setView: (view: any) => void;
  onOpenPremium?: () => void;
}

export function AppSideList({
  view, isChatListRoute, theme, isDark,
  chatListProps, contacts, setContacts,
  handlePreviewCall, handlePreviewMessage, setView, onOpenPremium,
}: AppSideListProps) {
  const { t } = useI18n();
  return (
    <aside aria-label={t("a11y.sideList")} className="z-30 border-r border-[var(--border-color)] min-w-0 min-h-0 flex flex-col">
      {isChatListRoute ? (
        <SafeRender>
          <ChatListView {...chatListProps} />
        </SafeRender>
      ) : view === "contacts" ? (
        <SafeRender>
          <LazyContactsView
            theme={theme}
            contacts={contacts}
            setContacts={setContacts}
            onCall={handlePreviewCall}
            onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
            onMessage={handlePreviewMessage}
          />
        </SafeRender>
      ) : view === "company" ? (
        <SafeRender>
          <LazyCrmView
            theme={theme}
            onCall={handlePreviewCall}
            onVideoCall={(name: string, color?: string) => handlePreviewCall(name, color, 'video')}
            onMessage={handlePreviewMessage}
            onOpenPremium={onOpenPremium}
          />
        </SafeRender>
      ) : view === "calls" ? (
        <SafeRender>
          <LazyCallLogView isDark={isDark} onBack={() => setView("chats")} onOpenContacts={() => setView('contacts')} />
        </SafeRender>
      ) : null}
    </aside>
  );
}
