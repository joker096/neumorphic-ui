import { motion } from "motion/react";
import { SearchInput } from "../ui/SearchInput";
import { SettingsSectionTitle, ToggleSwitch } from "../ui/SettingsRow";
import {
  Activity, Bell, BellOff, Bot, Building2, ChevronRight, Cloud,
  Globe, HardDrive, Lock, Mic, Network, Palette, Radar, Shield,
  ShieldAlert, Smartphone, UserPlus,
} from "lucide-react";

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
  return (
    <motion.div
      key="main-settings"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex-1 flex flex-col min-h-0"
    >
      <div className="w-full mb-4">
        <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder={t('settings.searchPlaceholder')} isDark={isDark} />
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4 flex flex-col gap-5">
        <button onClick={() => setActiveSection('account')} className={`w-full rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-emerald-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/5" : "bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-100 hover:bg-emerald-50/50"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
              <UserPlus size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.account')}</div>
              <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.accountSubtitle')}</div>
            </div>
          </div>
        </button>
        <div className="w-full">
          <SettingsSectionTitle title={t('settings.appearanceSection')} isDark={isDark} />
          <div className={`rounded-xl ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"} overflow-hidden`}>
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:opacity-80" onClick={() => setActiveSection('appearance')}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
                <Palette size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.theme')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.appearanceTheme')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </div>
            <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:opacity-80" onClick={() => setActiveSection('language')}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-blue-500/10" : "bg-blue-100"}`}>
                <Globe size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.language')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{language}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </div>
          </div>
        </div>
        <div className="w-full">
          <SettingsSectionTitle title={t('settings.notificationsSection')} isDark={isDark} />
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
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
              <ToggleSwitch isOn={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} isDark={isDark} />
            </div>
            <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-orange-500/10" : "bg-orange-100"}`}>
                  {soundEnabled ? <Bell size={16} className={isDark ? "text-orange-400" : "text-orange-600"} /> : <BellOff size={16} className={isDark ? "text-gray-500" : "text-slate-400"} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.sound')}</div>
                </div>
              </div>
              <ToggleSwitch isOn={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} isDark={isDark} />
            </div>
            <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/10" : "bg-blue-100"}`}>
                  <Cloud size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.cloudSyncOption')}</div>
                </div>
              </div>
              <ToggleSwitch isOn={cloudSyncEnabled} onToggle={() => setCloudSyncEnabled(!cloudSyncEnabled)} isDark={isDark} />
            </div>
          </div>
        </div>
        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <SettingsSectionTitle title={t('settings.privacySecuritySection')} isDark={isDark} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button onClick={() => setActiveSection('security')} className={`rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-rose-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/5" : "bg-gradient-to-br from-rose-50 to-transparent border border-rose-100 hover:bg-rose-50/50"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}>
                <Shield size={18} className={isDark ? "text-rose-400" : "text-rose-600"} />
              </div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.security')}</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.securitySubtitle')}</div>
            </button>
            <button onClick={() => setActiveSection('privacy')} className={`rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-indigo-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/5" : "bg-gradient-to-br from-indigo-50 to-transparent border border-indigo-100 hover:bg-indigo-50/50"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"}`}>
                <Lock size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
              </div>
              <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.privacy')}</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.privacySubtitle')}</div>
            </button>
          </div>
        </div>
        <div className="w-full">
          <SettingsSectionTitle title={t('settings.dataStorageSection')} isDark={isDark} />
          <button onClick={() => setActiveSection('storage')} className={`w-full rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-amber-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/5" : "bg-gradient-to-br from-amber-50 to-transparent border border-amber-100 hover:bg-amber-50/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-500/20" : "bg-amber-100"}`}>
                <HardDrive size={18} className={isDark ? "text-amber-400" : "text-amber-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.dataStorage')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.dataStorageSubtitle')}</div>
              </div>
            </div>
          </button>
        </div>
        <div className="w-full mb-6">
          <SettingsSectionTitle title={t('settings.companySection')} isDark={isDark} />
          <button onClick={() => setActiveSection('company')} className={`w-full rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-purple-500/10 to-transparent border border-[var(--border-color)] hover:bg-white/5" : "bg-gradient-to-br from-purple-50 to-transparent border border-purple-100 hover:bg-purple-50/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                <Building2 size={18} className={isDark ? "text-purple-400" : "text-purple-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.company')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.companySubtitle')}</div>
              </div>
            </div>
          </button>
        </div>
        <div className="w-full mb-6">
          <SettingsSectionTitle title={t('settings.servicesSection')} isDark={isDark} />
          <div className="rounded-xl overflow-hidden">
            <button onClick={() => setActiveSection('bots')} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-fuchsia-500/10" : "bg-fuchsia-100"}`}>
                <Bot size={16} className={isDark ? "text-fuchsia-400" : "text-fuchsia-600"} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('settings.bots')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.botsSubtitle')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </button>
            <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
            <button onClick={() => setSubView?.("recordings")} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-amber-500/10" : "bg-amber-100"}`}>
                <Mic size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('nav.recordings')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('hub.recordingsSubtitle')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </button>
            <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
            <button onClick={() => setSubView?.("radar")} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-cyan-500/10" : "bg-cyan-100"}`}>
                <Radar size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-medium ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{t('nav.radar')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('hub.radarSubtitle')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </button>
          </div>
        </div>
        <div className="w-full mb-6">
          <SettingsSectionTitle title={t('settings.advancedSection')} isDark={isDark} />
          <div className="rounded-xl overflow-hidden">
            <div className={`rounded-xl ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
              <button onClick={() => setActiveSection('network')} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-blue-500/10" : "bg-blue-100"}`}>
                  <Network size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.network')}</div>
                  <div className={`text-[11px] ${isDark ? "text-gray-500" : "text-slate-500"}`}>{proxyEnabled ? t('settings.networkEnabled') : t('settings.disabled')}</div>
                </div>
              </button>
              <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
              <button onClick={() => setActiveSection('spam')} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-red-500/10" : "bg-red-100"}`}>
                  <ShieldAlert size={16} className={isDark ? "text-red-400" : "text-red-600"} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.spamProtection')}</div>
                  <div className={`text-[11px] ${isDark ? "text-gray-500" : "text-slate-500"}`}>{spamFilterEnabled ? t('settings.spamActive') : t('settings.spamDisabled')}</div>
                </div>
              </button>
              <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
              <button onClick={() => setActiveSection('systemStatus')} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/10" : "bg-emerald-100"}`}>
                  <Activity size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.systemStatus')}</div>
                  <div className={`text-[11px] ${isDark ? "text-gray-500" : "text-slate-500"}`}>{t('settings.systemStatusSubtitle')}</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div className="w-full flex justify-center pb-8 pt-4 border-t border-[var(--border-color)] dark:border-[var(--border-color)]">
          <div className={`text-[10px] font-mono tracking-widest opacity-40 uppercase ${isDark ? "text-[var(--text-primary)]" : "text-slate-800"} flex items-center gap-1`}>
            <Smartphone size={12} />
            {t('settings.lastBuild')}: 31.05.2026, 11:43
          </div>
        </div>
      </div>
    </motion.div>
  );
}




