import { useEffect } from "react";
import { motion } from "motion/react";
import { SearchInput } from "../ui/SearchInput";
import { SettingsSectionTitle } from "../ui/SettingsRow";
import { Building2, Download, Globe, HardDrive, Smartphone, User } from "lucide-react";
import { SettingsCard, SettingsNavItem } from "./SettingsMenuPrimitives";
import { BigMenuButton, NavGroup, NavItemDef } from "./SettingsMenuParts";
import { MenuCards } from "./menuCards";
import { buildSettingsMenuItems } from "./settingsMenuItems";
import { DataState } from "../ui/DataState";
import { APP_INFO } from "../../config/settingsDefaults";
import { useAppStore } from "../../store";
import type { CloudSyncState } from "../../store/types";

interface SettingsMainMenuProps {
  isDark: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  t: (key: string, options?: any) => string;
  setActiveSection: (section: string) => void;
  setSubView: (view: string | null) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (v: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (v: boolean) => void;
  soundVolume: number;
  setSoundVolume: (v: number) => void;
  cloudSync: CloudSyncState;
  setCloudSyncEnabled: (v: boolean) => void;
  language: string;
  /** UI language for the last-sync stamp; defaults to the host runtime. */
  lang?: string;
  themeMode?: "light" | "dark" | "system";
  setThemeMode?: (mode: "light" | "dark" | "system") => void;
  setTheme?: (mode: "light" | "dark") => void;
  onSelectLanguage?: (code: string) => void;
  dndEnabled?: boolean;
  setDndEnabled?: (v: boolean) => void;
  connectionStatus?: "disconnected" | "connecting" | "connected" | "blocked" | "error";
  transportBackend?: string;
  latencyMs?: number;
}

export function SettingsMainMenu({
  isDark, searchQuery, setSearchQuery, t, setActiveSection, setSubView,
  notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled, soundVolume, setSoundVolume,
  cloudSync, setCloudSyncEnabled, language, lang,
  themeMode, setThemeMode, setTheme, onSelectLanguage,
  dndEnabled, setDndEnabled,
  connectionStatus = "disconnected", transportBackend = "direct", latencyMs = 0,
}: SettingsMainMenuProps) {
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [notificationsEnabled]);

  const premiumActive = useAppStore((s) => s.premiumEntitlement.premium);
  const { appearanceItems, privacyItems, chatsItems, callsItems, servicesItems, advancedItems } =
    buildSettingsMenuItems({ t, setActiveSection, setSubView, premiumActive });

  const q = searchQuery.trim().toLowerCase();
  const matches = (title: string, subtitle?: string) =>
    !q || title.toLowerCase().includes(q) || (subtitle ?? "").toLowerCase().includes(q);
  const filterItems = (items: NavItemDef[]) => (q ? items.filter((item) => matches(item.title, item.subtitle)) : items);

  const filteredAppearanceItems = filterItems(appearanceItems);
  const filteredPrivacyItems = filterItems(privacyItems);
  const filteredChatsItems = filterItems(chatsItems);
  const filteredCallsItems = filterItems(callsItems);
  const filteredServicesItems = filterItems(servicesItems);
  const filteredAdvancedItems = filterItems(advancedItems);

  const profileMatches = matches(t('settings.profile', 'Profile & Accounts'), t('settings.profileSubtitle', 'Your identity and accounts'));
  const quickMatches =
    matches(t('settings.quickSection', 'Quick controls')) ||
    matches(t('settings.darkTheme')) ||
    matches(t('settings.language')) ||
    matches(t('settings.dnd'));
  const quickRowTheme = matches(t('settings.darkTheme'));
  const quickRowLang = matches(t('settings.language'));
  const quickRowDnd = matches(t('settings.dnd'));
  const notifMatches = matches(t('settings.notifications'), t('settings.notificationsSubtitle'));
  const soundMatches = matches(t('settings.sound'));
  const volumeMatches = matches(t('settings.soundVolume', 'Volume'));
  const cloudSyncMatches = matches(t('settings.cloudSyncOption'));
  const notificationsCardMatches = notifMatches || soundMatches || volumeMatches || cloudSyncMatches;
  const backupMatches = matches(t('settings.backupExport'), t('settings.backupExportSubtitle', 'Backup, export and reset'));
  const storageMatches = matches(t('settings.dataStorage'), t('settings.dataStorageSubtitle'));
  const storageSectionMatches = backupMatches || storageMatches;
  const companyMatches = matches(t('settings.company'), t('settings.companySubtitle'));
  const siteEmbedMatches = matches(t('settings.siteEmbed', 'Website Embed'), t('settings.siteEmbedSubtitle', 'Embed chat on any site'));
  const connMatches =
    matches(t('settings.connectionStatus', 'Connection')) ||
    matches(t('settings.transportBackend', 'Transport')) ||
    matches(t('settings.latency', 'Latency')) ||
    matches(t('settings.systemStatus'));

  const hasResults =
    profileMatches ||
    quickMatches ||
    filteredAppearanceItems.length > 0 ||
    notificationsCardMatches ||
    filteredPrivacyItems.length > 0 ||
    filteredChatsItems.length > 0 ||
    filteredCallsItems.length > 0 ||
    storageSectionMatches ||
    companyMatches ||
    siteEmbedMatches ||
    connMatches ||
    filteredServicesItems.length > 0 ||
    filteredAdvancedItems.length > 0;

  return (
    <motion.div
      key="main-settings"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex flex-col"
    >
      <div className="w-full mb-4">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t('settings.searchPlaceholder')} />
      </div>
      {/* Scrolling is handled by the SettingsView root (now an overflow-y-auto container). */}
      <div className="overflow-x-hidden pr-1 pb-4 flex flex-col gap-6">
        {profileMatches && (
          <BigMenuButton
            isDark={isDark}
            tone="emerald"
            icon={<User size={18} className="text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-100 dark:bg-emerald-500/20"
            title={t('settings.profile', 'Profile & Accounts')}
            subtitle={t('settings.profileSubtitle', 'Your identity and accounts')}
            onClick={() => setActiveSection('profile')}
          />
        )}

        {filteredAppearanceItems.length > 0 && (
          <NavGroup title={t('settings.appearanceSection')} items={filteredAppearanceItems} />
        )}

        <MenuCards
          t={t}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          setTheme={setTheme}
          onSelectLanguage={onSelectLanguage}
          language={language}
          dndEnabled={dndEnabled}
          setDndEnabled={setDndEnabled}
          notificationsEnabled={notificationsEnabled}
          setNotificationsEnabled={setNotificationsEnabled}
          soundEnabled={soundEnabled}
          setSoundEnabled={setSoundEnabled}
          soundVolume={soundVolume}
          setSoundVolume={setSoundVolume}
          cloudSync={cloudSync}
          setCloudSyncEnabled={setCloudSyncEnabled}
          lang={lang}
          connectionStatus={connectionStatus}
          transportBackend={transportBackend}
          latencyMs={latencyMs}
          onOpenNotifications={() => setActiveSection('notifications')}
          visible={{
            quick: quickMatches,
            // The accounts row needs store-backed account handlers this menu
            // does not own — hidden rather than rendered dead.
            quickRows: { theme: quickRowTheme, lang: quickRowLang, dnd: quickRowDnd, accounts: false },
            notif: notificationsCardMatches,
            notifRows: { notif: notifMatches, sound: soundMatches, volume: volumeMatches, cloudSync: cloudSyncMatches },
            conn: connMatches,
          }}
        />

        {filteredPrivacyItems.length > 0 && (
          <NavGroup title={t('settings.privacySecuritySection')} items={filteredPrivacyItems} />
        )}

        {filteredChatsItems.length > 0 && (
          <NavGroup title={t('settings.chatsSection', 'Chats')} items={filteredChatsItems} />
        )}

        {filteredCallsItems.length > 0 && (
          <NavGroup title={t('settings.callsSection', 'Calls')} items={filteredCallsItems} />
        )}

        {storageSectionMatches && (
          <div className="w-full">
            <SettingsSectionTitle title={t('settings.dataStorageSection')} />
            {backupMatches && (
              <SettingsCard >
                <SettingsNavItem
                  icon={<Download size={16} className="text-cyan-600 dark:text-cyan-400" />}
                  iconBg="bg-cyan-100 dark:bg-cyan-500/10"
                  title={t('settings.backupExport')}
                  subtitle={t('settings.backupExportSubtitle', 'Backup, export and reset')}
                  onClick={() => setActiveSection('backup')}
                />
              </SettingsCard>
            )}
            {storageMatches && (
              <BigMenuButton
                isDark={isDark}
                tone="amber"
                icon={<HardDrive size={18} className="text-amber-600 dark:text-amber-400" />}
                iconBg="bg-amber-100 dark:bg-amber-500/20"
                title={t('settings.dataStorage')}
                subtitle={t('settings.dataStorageSubtitle')}
                onClick={() => setActiveSection('storage')}
              />
            )}
          </div>
        )}

        {companyMatches && (
          <BigMenuButton
            isDark={isDark}
            tone="purple"
            icon={<Building2 size={18} className="text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-100 dark:bg-purple-500/20"
            title={t('settings.company')}
            subtitle={t('settings.companySubtitle')}
            onClick={() => setActiveSection('company')}
          />
        )}

        {siteEmbedMatches && (
          <BigMenuButton
            isDark={isDark}
            tone="purple"
            icon={<Globe size={18} className="text-cyan-600 dark:text-cyan-400" />}
            iconBg="bg-cyan-100 dark:bg-cyan-500/20"
            title={t('settings.siteEmbed', 'Website Embed')}
            subtitle={t('settings.siteEmbedSubtitle', 'Embed chat on any site')}
            onClick={() => setActiveSection('siteembed')}
          />
        )}

        {filteredServicesItems.length > 0 && (
          <NavGroup title={t('settings.servicesSection')} items={filteredServicesItems} />
        )}

        {filteredAdvancedItems.length > 0 && (
          <NavGroup title={t('settings.advancedSection')} items={filteredAdvancedItems} />
        )}

        {q && !hasResults && (
          <DataState status="empty" emptyIcon="search" title={t('settings.noSearchResults')} />
        )}

        <div className="w-full flex justify-center pb-8 pt-4 border-t border-[var(--border-color)]">
          <div className="text-xs font-mono tracking-widest uppercase text-[var(--text-secondary)] flex items-center gap-1">
            <Smartphone size={12} />
            {t('settings.lastBuild')}: {APP_INFO.BUILD_DATE}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
