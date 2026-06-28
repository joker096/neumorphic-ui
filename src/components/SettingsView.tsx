import React, { useState, useEffect, Suspense } from 'react';
import { useAppStore } from '../store';
import { useI18n, detectBrowserLanguage } from '../lib/i18n';
import { toast } from 'sonner';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow, ToggleSwitch } from './ui/SettingsRow';
import { SubView } from './ui/SubView';
import { BatteryStatus } from './ui/BatteryStatus';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useDebounce } from '../hooks/useDebounce';
import { exportBackup } from '../lib/backup';
import { ChevronRight, Smartphone, Palette, Globe, Bell, BellOff, Shield, Lock, HardDrive, Bot, Network, ShieldAlert, Activity, ChevronLeft, UserPlus, Cloud, MapPin, RefreshCw, Key, Search, Building2, Mic, Radar } from 'lucide-react';
import { CompanySettingsView } from './settings/CompanySettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { LanguageSection } from './settings/LanguageSection';
import { PrivacySection } from './settings/PrivacySection';
import { AccountSection } from './settings/AccountSection';

const NetworkSection = React.lazy(() => import('./settings/NetworkSection').then(m => ({ default: m.NetworkSection })));
const SecuritySection = React.lazy(() => import('./settings/SecuritySection').then(m => ({ default: m.SecuritySection })));
const StorageSection = React.lazy(() => import('./settings/StorageSection').then(m => ({ default: m.StorageSection })));
const BotsSection = React.lazy(() => import('./settings/BotsSection').then(m => ({ default: m.BotsSection })));
const SpamSection = React.lazy(() => import('./settings/SpamSection').then(m => ({ default: m.SpamSection })));
const SystemStatusSection = React.lazy(() => import('./settings/SystemStatusSection').then(m => ({ default: m.SystemStatusSection })));

export const SettingsView = ({ theme, setTheme, setSubView }: { theme: 'light' | 'dark', setTheme?: (t: 'light' | 'dark') => void, setSubView?: (view: string | null) => void }) => {
  const isDark = theme === 'dark';
  const { t, setLang } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('main');
  
  const [language, setLanguage] = useLocalStorage<string>("app_language", detectBrowserLanguage());
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage("app_notifications", true);
  const soundEnabled = useAppStore(state => state.soundEnabled);
  const setSoundEnabled = useAppStore(state => state.setSoundEnabled);
  const [twoFactorEnabled, setTwoFactorEnabled] = useLocalStorage("app_2fa", false);
  const [proxyEnabled, setProxyEnabled] = useLocalStorage("app_proxy", false);
  const [spamFilterEnabled, setSpamFilterEnabled] = useLocalStorage("app_spam_filter", true);
  const [showPwaBanner, setShowPwaBanner] = useLocalStorage("app_pwa_banner", true);
  const [deadMansSwitch, setDeadMansSwitch] = useLocalStorage("app_dead_mans_switch", "6 months");
  const [mediaAutoLoad, setMediaAutoLoad] = useLocalStorage("app_media_autoload", "Wi-Fi");
  const [selfDestructDefault, setSelfDestructDefault] = useLocalStorage("app_self_destruct", "Off");
  const [obfuscationMode, setObfuscationMode] = useLocalStorage("app_obfuscation", "Auto");
  const [proxyUrl, setProxyUrl] = useLocalStorage("app_proxy_url", "");
  const [torBridge, setTorBridge] = useLocalStorage("app_tor_bridge", "None");
  const [visNumber, setVisNumber] = useLocalStorage("app_vis_number", "Nobody");
  const [visActivity, setVisActivity] = useLocalStorage("app_vis_activity", "My contacts");
  const [uiAnimations, setUiAnimations] = useLocalStorage("app_ui_animations", true);
  const [fontSize, setFontSize] = useLocalStorage("app_font_size", "Medium");
  const [dndEnabled, setDndEnabled] = useLocalStorage("app_dnd_enabled", false);
  const [dndFrom, setDndFrom] = useLocalStorage("app_dnd_from", "22:00");
  const [dndTo, setDndTo] = useLocalStorage("app_dnd_to", "08:00");
  const [priorityContacts, setPriorityContacts] = useLocalStorage("app_priority_contacts", "Joker,Design Team");

  const { 
    stealthMode, 
    anonymousMode, 
    readReceipts,
    deliveryReceipts,
    typingIndicators,
    turnServerUrl,
    allowForwarding,
    allowMetadata,
    forwardCountLimit,
    contactReadReceipts,
    devices,
    currentSession,
    cloudSync,
    locationShares,
    addDevice,
    removeDevice,
    updateSettings,
    toggleContactReadReceipt,
    setCloudSyncEnabled,
    triggerCloudSync,
    stopLiveLocation,
    removeLocationShare,
    bots,
    setBots,
    connectionStatus,
    transportBackend,
    latencyMs,
    blockedBackends,
    regionBlocked,
  } = useAppStore();

  const [confirmAction, setConfirmAction] = useState<{ type: 'wipe' } | { type: 'removeDevice'; id: string; name: string } | null>(null);
  
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [backupPassword, setBackupPassword] = useState("");
  
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [showPhraseInput, setShowPhraseInput] = useState(false);

  const handleGenerateRecoveryPhrase = async () => {
    try {
      const { RecoveryManager } = await import('../lib/recovery/RecoveryManager');
      const result = await RecoveryManager.generateRecoveryPhrase();
      setRecoveryPhrase(result.phrase);
      setShowRecoveryModal(true);
    } catch (error) {
      console.error('Failed to generate recovery phrase:', error);
      toast.error(t('settings.failedGenerateRecovery'));
    }
  };

  const handleRestoreFromPhrase = async () => {
    if (!recoveryInput.trim()) {
      setRecoveryStatus('error');
      return;
    }
    setRecoveryStatus('loading');
    try {
      const { RecoveryManager } = await import('../lib/recovery/RecoveryManager');
      const success = await RecoveryManager.restoreFromPhrase(recoveryInput);
      if (success) {
        setRecoveryStatus('success');
        setRecoveryInput("");
        setTimeout(() => {
          setShowRecoveryModal(false);
          setShowPhraseInput(false);
          setRecoveryStatus('idle');
          toast.success(t('settings.recoverySuccessful'), { description: t('settings.dataRestored') });
        }, 1500);
      } else {
        setRecoveryStatus('error');
        toast.error(t('settings.recoveryFailed'), { description: t('settings.invalidPhrase') });
      }
    } catch (error) {
      setRecoveryStatus('error');
      toast.error(t('settings.recoveryFailed'), { description: t('settings.recoveryError') });
    }
  };

  const handleWipeData = async () => {
    await import('../lib/crypto/cryptoCore').then(m => m.cryptoCore.secureWipe());
    setConfirmAction(null);
  };

  const renderMainSettings = () => (
    <motion.div 
      key="main-settings"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full flex-1 flex flex-col min-h-0"
    >
      <div className="w-full shrink-0 mb-4">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-slate-400"}`} />
          <input 
            placeholder={t('settings.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${
              isDark 
                ? "bg-[#1a1d24] border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50" 
                : "bg-white border-black/10 text-slate-800 placeholder:text-slate-400 focus:border-blue-500/50"
            }`}
            type="text"
          />
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden pr-1 pb-4 flex flex-col gap-5 ${isDark ? "scrollbar-dark" : "scrollbar-light"}`}>
        <button onClick={() => setActiveSection('account')} className={`w-full rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-emerald-500/10 to-transparent border border-white/5 hover:bg-white/5" : "bg-gradient-to-br from-emerald-50 to-transparent border border-emerald-100 hover:bg-emerald-50/50"}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
              <UserPlus size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.account')}</div>
              <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.accountSubtitle')}</div>
            </div>
          </div>
        </button>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.appearanceSection')} isDark={isDark} />
          <div className={`rounded-xl ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"} overflow-hidden`}>
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:opacity-80" onClick={() => setActiveSection('appearance')}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
                <Palette size={18} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.theme')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.appearanceTheme')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </div>
            <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"}`} />
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
          <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
            <div className={`flex items-center justify-between px-4 py-3 ${notificationsEnabled ? (isDark ? "bg-emerald-500/5" : "bg-emerald-50/50") : ""}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-red-500/10" : "bg-red-100"}`}>
                  <Bell size={16} className={isDark ? "text-red-400" : "text-red-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.notifications')}</div>
                  {t('settings.notificationsSubtitle') && <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.notificationsSubtitle')}</div>}
                </div>
              </div>
              <ToggleSwitch isOn={notificationsEnabled} onToggle={() => setNotificationsEnabled(!notificationsEnabled)} isDark={isDark} />
            </div>
            <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"}`} />
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
            <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"}`} />
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? "bg-blue-500/10" : "bg-blue-100"}`}>
                  <Cloud size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.cloudSyncOption')}</div>
                </div>
              </div>
              <ToggleSwitch isOn={cloudSync.enabled} onToggle={() => setCloudSyncEnabled(!cloudSync.enabled)} isDark={isDark} />
            </div>
          </div>
        </div>

        <div className="w-full">
          <div className="mb-2 flex items-center justify-between">
            <SettingsSectionTitle title={t('settings.privacySecuritySection')} isDark={isDark} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setActiveSection('security')} className={`rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-rose-500/10 to-transparent border border-white/5 hover:bg-white/5" : "bg-gradient-to-br from-rose-50 to-transparent border border-rose-100 hover:bg-rose-50/50"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${isDark ? "bg-rose-500/20" : "bg-rose-100"}`}>
                <Shield size={18} className={isDark ? "text-rose-400" : "text-rose-600"} />
              </div>
              <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.security')}</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.securitySubtitle')}</div>
            </button>
            <button onClick={() => setActiveSection('privacy')} className={`rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-indigo-500/10 to-transparent border border-white/5 hover:bg-white/5" : "bg-gradient-to-br from-indigo-50 to-transparent border border-indigo-100 hover:bg-indigo-50/50"}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${isDark ? "bg-indigo-500/20" : "bg-indigo-100"}`}>
                <Lock size={18} className={isDark ? "text-indigo-400" : "text-indigo-600"} />
              </div>
              <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.privacy')}</div>
              <div className={`text-[11px] mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.privacySubtitle')}</div>
            </button>
          </div>
        </div>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.dataStorageSection')} isDark={isDark} />
          <button onClick={() => setActiveSection('storage')} className={`w-full rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-amber-500/10 to-transparent border border-white/5 hover:bg-white/5" : "bg-gradient-to-br from-amber-50 to-transparent border border-amber-100 hover:bg-amber-50/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-amber-500/20" : "bg-amber-100"}`}>
                <HardDrive size={18} className={isDark ? "text-amber-400" : "text-amber-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.dataStorage')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.dataStorageSubtitle')}</div>
              </div>
            </div>
          </button>
        </div>

        <div className="w-full mb-6">
          <SettingsSectionTitle title={t('settings.companySection')} isDark={isDark} />
          <button onClick={() => setActiveSection('company')} className={`w-full rounded-xl p-4 text-left transition-colors ${isDark ? "bg-gradient-to-br from-purple-500/10 to-transparent border border-white/5 hover:bg-white/5" : "bg-gradient-to-br from-purple-50 to-transparent border border-purple-100 hover:bg-purple-50/50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-purple-500/20" : "bg-purple-100"}`}>
                <Building2 size={18} className={isDark ? "text-purple-400" : "text-purple-600"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.company')}</div>
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
                <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{t('settings.bots')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.botsSubtitle')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </button>
            <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"}`} />
            <button onClick={() => setSubView?.("recordings")} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-amber-500/10" : "bg-amber-100"}`}>
                <Mic size={16} className={isDark ? "text-amber-400" : "text-amber-600"} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{t('nav.recordings')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.botsSubtitle')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </button>
            <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"}`} />
            <button onClick={() => setSubView?.("radar")} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-cyan-500/10" : "bg-cyan-100"}`}>
                <Radar size={16} className={isDark ? "text-cyan-400" : "text-cyan-600"} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{t('nav.radar')}</div>
                <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{t('settings.botsSubtitle')}</div>
              </div>
              <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
            </button>
          </div>
        </div>

        <div className="w-full mb-6">
          <SettingsSectionTitle title={t('settings.advancedSection')} isDark={isDark} />
          <div className="rounded-xl overflow-hidden">
            <div className={`rounded-xl ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"}`}>
              <button onClick={() => setActiveSection('network')} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-blue-500/10" : "bg-blue-100"}`}>
                  <Network size={16} className={isDark ? "text-blue-400" : "text-blue-600"} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.network')}</div>
                  <div className={`text-[11px] ${isDark ? "text-gray-500" : "text-slate-500"}`}>{proxyEnabled ? t('settings.networkEnabled') : t('settings.disabled')}</div>
                </div>
              </button>
              <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"}`} />
              <button onClick={() => setActiveSection('spam')} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-red-500/10" : "bg-red-100"}`}>
                  <ShieldAlert size={16} className={isDark ? "text-red-400" : "text-red-600"} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={`text-sm ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('settings.spamProtection')}</div>
                  <div className={`text-[11px] ${isDark ? "text-gray-500" : "text-slate-500"}`}>{spamFilterEnabled ? t('settings.spamActive') : t('settings.spamDisabled')}</div>
                </div>
              </button>
              <div className={`border-t ${isDark ? "border-white/5" : "border-black/5"}`} />
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

        <div className="w-full flex justify-center pb-8 pt-4 border-t border-black/5 dark:border-white/5">
          <div className={`text-[10px] font-mono tracking-widest opacity-40 uppercase ${isDark ? "text-white" : "text-slate-800"} flex items-center gap-1`}>
            <Smartphone size={12} />
            {t('settings.lastBuild')}: 31.05.2026, 11:43
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderAppearanceSettings = () => (
    <AppearanceSettings
      isDark={isDark}
      theme={theme}
      setTheme={setTheme || (() => {})}
      fontSize={fontSize}
      setFontSize={setFontSize}
      uiAnimations={uiAnimations}
      setUiAnimations={setUiAnimations}
      showPwaBanner={showPwaBanner}
      setShowPwaBanner={setShowPwaBanner}
      onBack={() => setActiveSection('main')}
    />
  );

  const renderLanguageSettings = () => (
    <LanguageSection
      isDark={isDark}
      language={language}
      setLanguage={setLanguage}
      setLang={setLang}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderAccountSettings = () => (
    <AccountSection
      isDark={isDark}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderSecuritySettings = () => (
    <SecuritySection
      isDark={isDark}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderPrivacySettings = () => (
    <PrivacySection
      isDark={isDark}
      visNumber={visNumber}
      setVisNumber={setVisNumber}
      visActivity={visActivity}
      setVisActivity={setVisActivity}
      dndEnabled={dndEnabled}
      setDndEnabled={setDndEnabled}
      dndFrom={dndFrom}
      setDndFrom={setDndFrom}
      dndTo={dndTo}
      setDndTo={setDndTo}
      priorityContacts={priorityContacts}
      setPriorityContacts={setPriorityContacts}
      stealthMode={stealthMode}
      anonymousMode={anonymousMode}
      deliveryReceipts={deliveryReceipts}
      readReceipts={readReceipts}
      typingIndicators={typingIndicators}
      ghostViewMode={useAppStore.getState().ghostViewMode}
      forwardAnonymization={useAppStore.getState().forwardAnonymization}
      onlineStatus={useAppStore.getState().onlineStatus}
      allowForwarding={useAppStore.getState().allowForwarding}
      setAllowForwarding={(v) => updateSettings({ allowForwarding: v })}
      setAllowMetadata={(v) => updateSettings({ allowMetadata: v })}
      forwardCountLimit={useAppStore.getState().forwardCountLimit}
      setForwardCountLimit={(v) => updateSettings({ forwardCountLimit: v })}
      onUpdateSettings={updateSettings}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderNetworkSettings = () => (
    <NetworkSection
      isDark={isDark}
      proxyEnabled={proxyEnabled}
      setProxyEnabled={setProxyEnabled}
      proxyUrl={proxyUrl}
      setProxyUrl={setProxyUrl}
      obfuscationMode={obfuscationMode}
      setObfuscationMode={setObfuscationMode}
      obfuscationEnabled={true}
      setObfuscationEnabled={(v) => {}}
      torBridge={torBridge}
      setTorBridge={setTorBridge}
      turnServerUrl={turnServerUrl}
      onUpdateSettings={updateSettings}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderStorageSettings = () => (
    <StorageSection
      isDark={isDark}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderBotsSettings = () => (
    <BotsSection
      isDark={isDark}
      bots={bots}
      setBots={setBots}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderSpamSettings = () => (
    <SpamSection
      isDark={isDark}
      spamFilterEnabled={spamFilterEnabled}
      setSpamFilterEnabled={setSpamFilterEnabled}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderSystemStatusSettings = () => (
    <SystemStatusSection
      isDark={isDark}
      connectionStatus={connectionStatus}
      transportBackend={transportBackend}
      latencyMs={latencyMs}
      blockedBackends={blockedBackends}
      regionBlocked={regionBlocked}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  const renderCompanySettings = () => (
    <CompanySettingsView
      isDark={isDark}
      onBack={() => setActiveSection('main')}
    />
  );

  const fallback = <div className={`text-center py-8 text-sm ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('common.loading')}</div>;

  return (
    <div className={`w-full max-w-2xl lg:max-w-3xl flex-1 flex flex-col rounded-[32px] p-6 mb-8 h-full min-h-0 pb-28 sm:pb-8 ${isDark ? "bg-[#11141c]/50 border border-white/5 scrollbar-dark" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner scrollbar-light"}`}>
      <AnimatePresence mode="wait">
        {activeSection === 'main' && renderMainSettings()}
        {activeSection === 'appearance' && renderAppearanceSettings()}
        {activeSection === 'language' && renderLanguageSettings()}
        {activeSection === 'account' && renderAccountSettings()}
        {activeSection === 'security' && <Suspense fallback={fallback}>{renderSecuritySettings()}</Suspense>}
        {activeSection === 'privacy' && renderPrivacySettings()}
        {activeSection === 'network' && <Suspense fallback={fallback}>{renderNetworkSettings()}</Suspense>}
        {activeSection === 'storage' && <Suspense fallback={fallback}>{renderStorageSettings()}</Suspense>}
        {activeSection === 'bots' && <Suspense fallback={fallback}>{renderBotsSettings()}</Suspense>}
        {activeSection === 'spam' && <Suspense fallback={fallback}>{renderSpamSettings()}</Suspense>}
        {activeSection === 'systemStatus' && <Suspense fallback={fallback}>{renderSystemStatusSettings()}</Suspense>}
        {activeSection === 'company' && <Suspense fallback={fallback}>{renderCompanySettings()}</Suspense>}
      </AnimatePresence>
      
      {confirmAction?.type === 'wipe' && (
        <ConfirmDialog
          isOpen={true}
          title={t('settings.wipeAllData')}
          message={t('settings.confirmWipe')}
          confirmLabel={t('settings.wipeAllData')}
          cancelLabel={t('common.delete')}
          variant="danger"
          theme={isDark ? 'dark' : 'light'}
          onConfirm={handleWipeData}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};