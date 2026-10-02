import { useEffect } from "react";
import { motion } from "motion/react";
import { SearchInput } from "../ui/SearchInput";
import { SettingsSectionTitle, ToggleSwitch } from "../ui/SettingsRow";
import {
  Bell, BellOff, Building2, Cloud, Download, HardDrive, Smartphone, User,
} from "lucide-react";
import { SettingsCard, SettingsDivider, SettingsNavItem } from "./SettingsMenuPrimitives";
import { BigMenuButton, NavGroup, NavItemDef } from "./SettingsMenuParts";
import { buildSettingsMenuItems } from "./settingsMenuItems";
import { DataState } from "../ui/DataState";
import { formatClockTime } from "../../utils/chatUtils";
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
}

export function SettingsMainMenu({
  isDark, searchQuery, setSearchQuery, t, setActiveSection, setSubView,
  notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled, soundVolume, setSoundVolume,
  cloudSync, setCloudSyncEnabled, language, lang,
}: SettingsMainMenuProps) {
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [notificationsEnabled]);

  const premiumActive = useAppStore((s) => s.premiumEntitlement.premium);
  const { appearanceItems, privacyItems, chatsItems, callsItems, servicesItems, advancedItems } =
    buildSettingsMenuItems({ isDark, t, language, setActiveSection, setSubView, premiumActive });

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
  const notifMatches = matches(t('settings.notifications'), t('settings.notificationsSubtitle'));
  const soundMatches = matches(t('settings.sound'));
  const volumeMatches = matches(t('settings.soundVolume', 'Volume'));
  const cloudSyncMatches = matches(t('settings.cloudSyncOption'));
  const notificationsCardMatches = notifMatches || soundMatches || volumeMatches || cloudSyncMatches;
  const backupMatches = matches(t('settings.backupExport'), t('settings.backupExportSubtitle', 'Backup, export and reset'));
  const storageMatches = matches(t('settings.dataStorage'), t('settings.dataStorageSubtitle'));
  const storageSectionMatches = backupMatches || storageMatches;
  const companyMatches = matches(t('settings.company'), t('settings.companySubtitle'));

  const hasResults =
    profileMatches ||
    filteredAppearanceItems.length > 0 ||
    notificationsCardMatches ||
    filteredPrivacyItems.length > 0 ||
    filteredChatsItems.length > 0 ||
    filteredCallsItems.length > 0 ||
    storageSectionMatches ||
    companyMatches ||
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
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t('settings.searchPlaceholder')} isDark={isDark} />
      </div>
      {/* Scrolling is handled by the SettingsView root (now an overflow-y-auto container). */}
      <div className="overflow-x-hidden pr-1 pb-4 flex flex-col gap-6">
        {profileMatches && (
          <BigMenuButton
            isDark={isDark}
            tone="emerald"
            icon={<User size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />}
            iconBg={isDark ? "bg-emerald-500/20" : "bg-emerald-100"}
            title={t('settings.profile', 'Profile & Accounts')}
            subtitle={t('settings.profileSubtitle', 'Your identity and accounts')}
            onClick={() => setActiveSection('profile')}
          />
        )}

        {filteredAppearanceItems.length > 0 && (
          <NavGroup isDark={isDark} title={t('settings.appearanceSection')} items={filteredAppearanceItems} />
        )}

        {notificationsCardMatches && (
          <div className="w-full">
            <SettingsSectionTitle title={t('settings.notificationsSection')} isDark={isDark} />
            <SettingsCard isDark={isDark} onClick={() => setActiveSection('notifications')}>
              {notifMatches && (
                <>
                  <div className={`flex items-center justify-between px-4 py-3 ${notificationsEnabled ? (isDark ? "bg-emerald-500/5" : "bg-emerald-50/50") : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-red-500/10" : "bg-red-100"}`}>
                        <Bell size={16} className={isDark ? "text-red-400" : "text-red-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.notifications')}</div>
                        {t('settings.notificationsSubtitle') && <div className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.notificationsSubtitle')}</div>}
                      </div>
                    </div>
                    <ToggleSwitch isOn={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} isDark={isDark} ariaLabel={t('settings.notifications')} />
                  </div>
                  {(soundMatches || volumeMatches || cloudSyncMatches) && <SettingsDivider isDark={isDark} />}
                </>
              )}
              {soundMatches && (
                <>
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
                        {soundEnabled ? <Bell size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} /> : <BellOff size={16} className={isDark ? "text-gray-500" : "text-slate-400"} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.sound')}</div>
                      </div>
                    </div>
                    <ToggleSwitch isOn={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} isDark={isDark} ariaLabel={t('settings.sound')} />
                  </div>
                  {(volumeMatches || cloudSyncMatches) && <SettingsDivider isDark={isDark} />}
                </>
              )}
              {volumeMatches && (
                <>
                  <div className="flex items-center justify-between px-4 py-3 min-h-11">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-amber-500/10" : "bg-amber-100"}`}>
                        <Bell size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.soundVolume', 'Volume')}</div>
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={soundVolume}
                      onChange={(e) => setSoundVolume(Number(e.target.value))}
                      aria-label={t('settings.soundVolume', 'Volume')}
                      className="w-32 accent-[var(--accent)]"
                    />
                  </div>
                  {cloudSyncMatches && <SettingsDivider isDark={isDark} />}
                </>
              )}
              {cloudSyncMatches && (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--accent-soft)]`}>
                      <Cloud size={16} className="t-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.cloudSyncOption')}</div>
                      {cloudSync.enabled && (
                        <div className={`text-xs truncate ${cloudSync.status === "error" ? (isDark ? "text-red-400" : "text-red-600") : (isDark ? "text-gray-400" : "text-slate-500")}`}>
                          {cloudSync.status === "error"
                            ? t('settings.cloudSyncError', 'Sync failed')
                            : cloudSync.status === "syncing"
                              ? t('settings.cloudSyncSyncing', 'Syncing…')
                              : cloudSync.pendingChanges > 0
                                ? t('settings.cloudSyncPending', { count: cloudSync.pendingChanges })
                                : cloudSync.lastSync
                                  ? t('settings.cloudSyncLastSync', { time: formatClockTime(cloudSync.lastSync, lang) })
                                  : t('settings.cloudSyncSubtitle')}
                        </div>
                      )}
                    </div>
                  </div>
                  <ToggleSwitch isOn={cloudSync.enabled} onToggle={() => setCloudSyncEnabled(!cloudSync.enabled)} isDark={isDark} ariaLabel={t('settings.cloudSyncOption')} />
                </div>
              )}
            </SettingsCard>
          </div>
        )}

        {filteredPrivacyItems.length > 0 && (
          <NavGroup isDark={isDark} title={t('settings.privacySecuritySection')} items={filteredPrivacyItems} />
        )}

        {filteredChatsItems.length > 0 && (
          <NavGroup isDark={isDark} title={t('settings.chatsSection', 'Chats')} items={filteredChatsItems} />
        )}

        {filteredCallsItems.length > 0 && (
          <NavGroup isDark={isDark} title={t('settings.callsSection', 'Calls')} items={filteredCallsItems} />
        )}

        {storageSectionMatches && (
          <div className="w-full">
            <SettingsSectionTitle title={t('settings.dataStorageSection')} isDark={isDark} />
            {backupMatches && (
              <SettingsCard isDark={isDark}>
                <SettingsNavItem
                  icon={<Download size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />}
                  iconBg={isDark ? "bg-cyan-500/10" : "bg-cyan-100"}
                  title={t('settings.backupExport')}
                  subtitle={t('settings.backupExportSubtitle', 'Backup, export and reset')}
                  isDark={isDark}
                  onClick={() => setActiveSection('backup')}
                />
              </SettingsCard>
            )}
            {storageMatches && (
              <BigMenuButton
                isDark={isDark}
                tone="amber"
                icon={<HardDrive size={18} className={isDark ? "text-amber-400" : "text-amber-600"} />}
                iconBg={isDark ? "bg-amber-500/20" : "bg-amber-100"}
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
            icon={<Building2 size={18} className={isDark ? "text-purple-400" : "text-purple-600"} />}
            iconBg={isDark ? "bg-purple-500/20" : "bg-purple-100"}
            title={t('settings.company')}
            subtitle={t('settings.companySubtitle')}
            onClick={() => setActiveSection('company')}
          />
        )}

        {filteredServicesItems.length > 0 && (
          <NavGroup isDark={isDark} title={t('settings.servicesSection')} items={filteredServicesItems} />
        )}

        {filteredAdvancedItems.length > 0 && (
          <NavGroup isDark={isDark} title={t('settings.advancedSection')} items={filteredAdvancedItems} />
        )}

        {q && !hasResults && (
          <DataState status="empty" isDark={isDark} emptyIcon="search" title={t('settings.noSearchResults')} />
        )}

        <div className="w-full flex justify-center pb-8 pt-4 border-t border-[var(--border-color)]">
          <div className={`text-xs font-mono tracking-widest uppercase ${isDark ? "text-[var(--text-secondary)]" : "text-slate-600"} flex items-center gap-1`}>
            <Smartphone size={12} />
            {t('settings.lastBuild')}: {APP_INFO.BUILD_DATE}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
