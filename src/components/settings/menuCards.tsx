import { SettingsSectionTitle } from "../ui/SettingsRow";
import { QuickControlsCard } from "./quickControlsCard";
import { SystemStatusCard } from "./systemStatusCard";
import { NotificationsCard } from "./notificationsCard";
import type { CloudSyncState } from "../../store/types";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="w-full">
    <SettingsSectionTitle title={title} />
    {children}
  </div>
);

export interface MenuCardVisible {
  quick: boolean;
  quickRows: { theme: boolean; lang: boolean; dnd: boolean };
  notif: boolean;
  notifRows: { notif: boolean; sound: boolean; volume: boolean; cloudSync: boolean };
  conn: boolean;
}

interface MenuCardsProps {
  t: (key: string, options?: any) => string;
  themeMode?: "light" | "dark" | "system";
  setThemeMode?: (mode: "light" | "dark" | "system") => void;
  setTheme?: (t: "light" | "dark") => void;
  onSelectLanguage?: (code: string) => void;
  language: string;
  dndEnabled?: boolean;
  setDndEnabled?: (v: boolean) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
  cloudSync: CloudSyncState;
  setCloudSyncEnabled: (v: boolean) => void;
  lang?: string;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "blocked" | "error";
  transportBackend?: string;
  latencyMs?: number;
  onOpenNotifications?: () => void;
  visible: MenuCardVisible;
}

export function MenuCards({
  t,
  themeMode, setThemeMode, setTheme, onSelectLanguage, language,
  dndEnabled, setDndEnabled,
  notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled, soundVolume, setSoundVolume,
  cloudSync, setCloudSyncEnabled, lang,
  connectionStatus = "disconnected", transportBackend = "direct", latencyMs = 0,
  onOpenNotifications,
  visible,
}: MenuCardsProps) {
  return (
    <>
      {visible.quick && (
        <Section title={t("settings.quickSection", "Quick controls")}>
          <QuickControlsCard
            t={t}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            setTheme={setTheme}
            onSelectLanguage={onSelectLanguage}
            language={language}
            dndEnabled={dndEnabled}
            setDndEnabled={setDndEnabled}
            visible={visible.quickRows}
          />
        </Section>
      )}
      {visible.notif && (
        <Section title={t("settings.notificationsSection")}>
          <NotificationsCard
            t={t}
            notificationsEnabled={notificationsEnabled}
            setNotificationsEnabled={setNotificationsEnabled}
            soundEnabled={soundEnabled}
            setSoundEnabled={setSoundEnabled}
            soundVolume={soundVolume}
            setSoundVolume={setSoundVolume}
            cloudSync={cloudSync}
            setCloudSyncEnabled={setCloudSyncEnabled}
            lang={lang}
            onOpen={onOpenNotifications}
            visible={visible.notifRows}
          />
        </Section>
      )}
      {/* Headerless on purpose: the advanced menu keeps its own "System Status"
          entry, so a second title here would duplicate the label. */}
      {visible.conn && (
        <SystemStatusCard
          t={t}
          connectionStatus={connectionStatus}
          transportBackend={transportBackend}
          latencyMs={latencyMs}
        />
      )}
    </>
  );
}
