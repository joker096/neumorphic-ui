import { useEffect } from "react";
import { motion } from "motion/react";
import { SearchInput } from "../ui/SearchInput";
import { SettingsSectionTitle, ToggleSwitch } from "../ui/SettingsRow";
import {
  Activity, Bell, BellOff, Bot, Building2, ChevronRight, Cloud,
  Globe, HardDrive, Lock, Mic, Network, Palette, Radar, Shield,
  ShieldAlert, Smartphone, User, FolderTree, Download, HelpCircle,
  CreditCard,
} from "lucide-react";
import { SettingsCard, SettingsDivider, SettingsNavItem } from "./SettingsMenuPrimitives";
import { BigMenuButton, NavGroup, NavItemDef } from "./SettingsMenuParts";
import { APP_INFO } from "../../config/settingsDefaults";

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
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (v: boolean) => void;
  language: string;
  proxyEnabled: boolean;
  spamFilterEnabled: boolean;
}

export function SettingsMainMenu({
  isDark, searchQuery, setSearchQuery, t, setActiveSection, setSubView,
  notificationsEnabled, setNotificationsEnabled, soundEnabled, setSoundEnabled,
  cloudSyncEnabled, setCloudSyncEnabled, language, proxyEnabled, spamFilterEnabled,
}: SettingsMainMenuProps) {
  useEffect(() => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [notificationsEnabled]);

  const appearanceItems: NavItemDef[] = [
    {
      icon: <Palette size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />,
      iconBg: isDark ? "bg-emerald-500/20" : "bg-emerald-100",
      title: t('settings.theme'),
      subtitle: t('settings.appearanceTheme'),
      onClick: () => setActiveSection('appearance'),
    },
    {
      icon: <Globe size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />,
      iconBg: isDark ? "bg-blue-500/10" : "bg-blue-100",
      title: t('settings.language'),
      subtitle: language,
      onClick: () => setActiveSection('language'),
    },
  ];

  const privacyItems: NavItemDef[] = [
    {
      icon: <Shield size={18} className={isDark ? "text-rose-400" : "text-rose-600"} />,
      iconBg: isDark ? "bg-rose-500/20" : "bg-rose-100",
      title: t('settings.security'),
      subtitle: t('settings.securitySubtitle'),
      onClick: () => setActiveSection('security'),
    },
    {
      icon: <Lock size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />,
      iconBg: isDark ? "bg-indigo-500/20" : "bg-indigo-100",
      title: t('settings.privacy'),
      subtitle: t('settings.privacySubtitle'),
      onClick: () => setActiveSection('privacy'),
    },
  ];

  const chatsItems: NavItemDef[] = [
    {
      icon: <FolderTree size={16} className={isDark ? "text-[var(--accent)]" : "text-[var(--accent)]"} />,
      iconBg: isDark ? "bg-[var(--accent-soft)]" : "bg-[var(--accent)]/10",
      title: t('settings.folders'),
      subtitle: t('settings.foldersSubtitle', 'Organize chats into filters'),
      onClick: () => setActiveSection('folders'),
    },
  ];

  const backupItems: NavItemDef[] = [
    {
      icon: <Download size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />,
      iconBg: isDark ? "bg-cyan-500/10" : "bg-cyan-100",
      title: t('settings.backupExport'),
      subtitle: t('settings.backupExportSubtitle', 'Backup, export and reset'),
      onClick: () => setActiveSection('backup'),
    },
  ];

  const servicesItems: NavItemDef[] = [
    {
      icon: <Bot size={16} className={isDark ? "text-fuchsia-400" : "text-fuchsia-600"} />,
      iconBg: isDark ? "bg-fuchsia-500/10" : "bg-fuchsia-100",
      title: t('settings.bots'),
      subtitle: t('settings.botsSubtitle'),
      onClick: () => setActiveSection('bots'),
    },
    {
      icon: <Mic size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />,
      iconBg: isDark ? "bg-amber-500/10" : "bg-amber-100",
      title: t('nav.recordings'),
      subtitle: t('hub.recordingsSubtitle'),
      onClick: () => setSubView?.('recordings'),
    },
    {
      icon: <Radar size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />,
      iconBg: isDark ? "bg-cyan-500/10" : "bg-cyan-100",
      title: t('nav.radar'),
      subtitle: t('hub.radarSubtitle'),
      onClick: () => setSubView?.('radar'),
    },
    {
      icon: <CreditCard size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />,
      iconBg: isDark ? "bg-emerald-500/10" : "bg-emerald-100",
      title: t('settings.payments'),
      subtitle: t('settings.paymentsSubtitle', 'Wallet, transfers and receipts'),
      onClick: () => setActiveSection('payments'),
    },
  ];

  const advancedItems: NavItemDef[] = [
    {
      icon: <Network size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />,
      iconBg: isDark ? "bg-blue-500/10" : "bg-blue-100",
      title: t('settings.network'),
      subtitle: proxyEnabled ? t('settings.networkEnabled') : t('settings.disabled'),
      onClick: () => setActiveSection('network'),
    },
    {
      icon: <ShieldAlert size={16} className={isDark ? "text-red-400" : "text-red-600"} />,
      iconBg: isDark ? "bg-red-500/10" : "bg-red-100",
      title: t('settings.spamProtection'),
      subtitle: spamFilterEnabled ? t('settings.spamActive') : t('settings.spamDisabled'),
      onClick: () => setActiveSection('spam'),
    },
    {
      icon: <Activity size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />,
      iconBg: isDark ? "bg-emerald-500/10" : "bg-emerald-100",
      title: t('settings.systemStatus'),
      subtitle: t('settings.systemStatusSubtitle'),
      onClick: () => setActiveSection('systemStatus'),
    },
    {
      icon: <HelpCircle size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />,
      iconBg: isDark ? "bg-amber-500/10" : "bg-amber-100",
      title: t('settings.helpSupport'),
      subtitle: t('settings.helpSupportSubtitle', 'FAQ, guides and contact'),
      onClick: () => setActiveSection('help'),
    },
  ];

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
        <BigMenuButton
          isDark={isDark}
          tone="emerald"
          icon={<User size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />}
          iconBg={isDark ? "bg-emerald-500/20" : "bg-emerald-100"}
          title={t('settings.profile', 'Profile & Accounts')}
          subtitle={t('settings.profileSubtitle', 'Your identity and accounts')}
          onClick={() => setActiveSection('profile')}
        />

        <NavGroup isDark={isDark} title={t('settings.appearanceSection')} items={appearanceItems} />

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.notificationsSection')} isDark={isDark} />
          <SettingsCard isDark={isDark} onClick={() => setActiveSection('notifications')}>
            <div className={`flex items-center justify-between px-4 py-3 ${notificationsEnabled ? (isDark ? "bg-emerald-500/5" : "bg-emerald-50/50") : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-red-500/10" : "bg-red-100"}`}>
                  <Bell size={16} className={isDark ? "text-red-400" : "text-red-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.notifications')}</div>
                  {t('settings.notificationsSubtitle') && <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.notificationsSubtitle')}</div>}
                </div>
              </div>
              <ToggleSwitch isOn={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} isDark={isDark} ariaLabel={t('settings.notifications')} />
            </div>
            <SettingsDivider isDark={isDark} />
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
            <SettingsDivider isDark={isDark} />
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/10" : "bg-blue-100"}`}>
                  <Cloud size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.cloudSyncOption')}</div>
                </div>
              </div>
              <ToggleSwitch isOn={cloudSyncEnabled} onToggle={() => setCloudSyncEnabled(!cloudSyncEnabled)} isDark={isDark} ariaLabel={t('settings.cloudSyncOption')} />
            </div>
            <SettingsDivider isDark={isDark} />
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-[var(--accent-soft)" : "bg-[var(--accent)]/10"}`}>
                <ChevronRight size={16} className="text-[var(--accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-medium ${isDark ? "text-[var(--accent)]" : "text-[var(--accent)]"}`}>{t('settings.manageNotifications', 'Manage notifications')}</div>
              </div>
            </div>
          </SettingsCard>
        </div>

        <NavGroup isDark={isDark} title={t('settings.privacySecuritySection')} items={privacyItems} />

        <NavGroup isDark={isDark} title={t('settings.chatsSection', 'Chats')} items={chatsItems} />

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.dataStorageSection')} isDark={isDark} />
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
          <BigMenuButton
            isDark={isDark}
            tone="amber"
            icon={<HardDrive size={18} className={isDark ? "text-amber-400" : "text-amber-600"} />}
            iconBg={isDark ? "bg-amber-500/20" : "bg-amber-100"}
            title={t('settings.dataStorage')}
            subtitle={t('settings.dataStorageSubtitle')}
            onClick={() => setActiveSection('storage')}
          />
        </div>

        <BigMenuButton
          isDark={isDark}
          tone="purple"
          icon={<Building2 size={18} className={isDark ? "text-purple-400" : "text-purple-600"} />}
          iconBg={isDark ? "bg-purple-500/20" : "bg-purple-100"}
          title={t('settings.company')}
          subtitle={t('settings.companySubtitle')}
          onClick={() => setActiveSection('company')}
        />

        <NavGroup isDark={isDark} title={t('settings.servicesSection')} items={servicesItems} />

        <NavGroup isDark={isDark} title={t('settings.advancedSection')} items={advancedItems} />

        <div className="w-full flex justify-center pb-8 pt-4 border-t border-[var(--border-color)]">
          <div className={`text-[10px] font-mono tracking-widest opacity-40 uppercase ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"} flex items-center gap-1`}>
            <Smartphone size={12} />
            {t('settings.lastBuild')}: {APP_INFO.BUILD_DATE}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
