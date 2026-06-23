import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { useI18n, detectBrowserLanguage } from '../lib/i18n';
import { toast } from 'sonner';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow, ToggleSwitch } from './ui/SettingsRow';
import { SubView } from './ui/SubView';
import { BatteryStatus } from './ui/BatteryStatus';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { exportBackup, exportBackupHtml } from '../lib/backup';
import { ChevronRight, Smartphone, Download, Palette, Globe, Bell, Shield, Lock, HardDrive, Bot, Network, ShieldAlert, Activity, ChevronLeft, UserPlus, Cloud, MapPin, RefreshCw, Key, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { LanguageSection } from './settings/LanguageSection';
import { PrivacySection } from './settings/PrivacySection';
import { NetworkSection } from './settings/NetworkSection';
import { SecuritySection } from './settings/SecuritySection';

export const SettingsView = ({ theme, setTheme }: { theme: 'light' | 'dark', setTheme?: (t: 'light' | 'dark') => void }) => {
  const isDark = theme === 'dark';
  const { t, setLang } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('main');
  const [importStatus, setImportStatus] = useState<string>('');
  
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
    removeLocationShare
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
      const phrase = await RecoveryManager.generateRecoveryPhrase();
      setRecoveryPhrase(phrase);
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
        <AnimatePresence>
          {showPwaBanner && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
              className={`w-full rounded-2xl border p-5 mb-2 shadow-lg relative overflow-hidden ${isDark ? "bg-[#1a1d24] border-white/10" : "bg-white border-blue-100"}`}
            >
              <div className="flex items-center gap-3 mb-2 relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-600"}`}>
                  <Download size={16} />
                </div>
                <div className={`text-sm font-bold leading-tight ${isDark ? "text-white" : "text-slate-800"}`}>{t('settings.installApp', { app: 'Mess&Anger' })}</div>
              </div>
              <div className={`text-xs mb-4 leading-5 relative z-10 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                <ul className="space-y-1">
                  <li>{t('settings.pwaWorksOffline')}</li>
                  <li>{t('settings.pwaFasterLoading')}</li>
                  <li>{t('settings.pwaAddToHomeScreen')}</li>
                </ul>
              </div>
              <div className="flex gap-2 relative z-10">
                <button onClick={() => setShowPwaBanner(false)} className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${isDark ? "border-white/10 hover:bg-white/10 text-gray-300" : "border-black/10 hover:bg-black/5 text-slate-600"}`}>
                  {t('settings.installDismiss')}
                </button>
                <button onClick={() => { setShowPwaBanner(false); }} className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-500 active:scale-95 transition-transform text-white shadow-sm hover:bg-emerald-600">
                  {t('settings.installBtn')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.accountSection')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsRow
              icon={<div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-md">J</div>}
              title="Joker"
              subtitle="@joker"
              isDark={isDark}
            />
            <SettingsRow
              icon={<div className="w-8 h-8 rounded-full border border-current border-dashed flex items-center justify-center shrink-0 opacity-70"><UserPlus size={14} className={isDark ? "text-emerald-400" : "text-emerald-600"} /></div>}
              title={t('settings.addAccount')}
              isDark={isDark}
              onClick={() => {
                toast.info(t('settings.accountManagement'), { description: t('settings.accountRequiresAuth') });
              }}
            />
          </SettingsGroup>
        </div>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.appearanceSection')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsRow
              icon={<Palette size={16} />}
              iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
              iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
              title={t('settings.theme')}
              subtitle={t('settings.appearanceTheme')}
              isDark={isDark}
              onClick={() => setActiveSection('appearance')}
            />
            <SettingsRow
              icon={<Globe size={16} />}
              iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
              iconColor={isDark ? "text-blue-400" : "text-blue-600"}
              title={t('settings.language')}
              subtitle={language}
              value={language}
              isDark={isDark}
              onClick={() => setActiveSection('language')}
            />
          </SettingsGroup>
        </div>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.quickOptions')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsToggleRow
              icon={<Bell size={16} />}
              iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
              iconColor={isDark ? "text-red-400" : "text-red-600"}
              title={t('settings.notificationsOption')}
              isOn={notificationsEnabled}
              isDark={isDark}
              onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <SettingsToggleRow
              title={t('settings.soundOption')}
              isOn={soundEnabled}
              isDark={isDark}
              onToggle={() => setSoundEnabled(!soundEnabled)}
            />
            <SettingsToggleRow
              icon={<Cloud size={16} />}
              iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
              iconColor={isDark ? "text-blue-400" : "text-blue-600"}
              title={t('settings.cloudSyncOption')}
              isOn={cloudSync.enabled}
              isDark={isDark}
              onToggle={() => setCloudSyncEnabled(!cloudSync.enabled)}
            />
          </SettingsGroup>
        </div>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.notificationsSection')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsToggleRow
              icon={<Bell size={16} />}
              iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
              iconColor={isDark ? "text-red-400" : "text-red-600"}
              title={t('settings.notifications')}
              subtitle={t('settings.notificationsSubtitle')}
              isOn={notificationsEnabled}
              isDark={isDark}
              onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
            />
            <SettingsToggleRow
              title={t('settings.sound')}
              isOn={soundEnabled}
              isDark={isDark}
              onToggle={() => setSoundEnabled(!soundEnabled)}
            />
          </SettingsGroup>
        </div>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.privacySecuritySection')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsRow
              icon={<Shield size={16} />}
              iconBg={isDark ? "bg-rose-500/10" : "bg-rose-100"}
              iconColor={isDark ? "text-rose-400" : "text-rose-600"}
              title={t('settings.security')}
              subtitle={t('settings.securitySubtitle')}
              isDark={isDark}
              onClick={() => setActiveSection('security')}
            />
            <SettingsRow
              icon={<Lock size={16} />}
              iconBg={isDark ? "bg-indigo-500/10" : "bg-indigo-100"}
              iconColor={isDark ? "text-indigo-400" : "text-indigo-600"}
              title={t('settings.privacy')}
              subtitle={t('settings.privacySubtitle')}
              isDark={isDark}
              onClick={() => setActiveSection('privacy')}
            />
          </SettingsGroup>
        </div>

        <div className="w-full">
          <SettingsSectionTitle title={t('settings.dataStorageSection')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsRow
              icon={<HardDrive size={16} />}
              iconBg={isDark ? "bg-amber-500/10" : "bg-amber-100"}
              iconColor={isDark ? "text-amber-400" : "text-amber-600"}
              title={t('settings.dataStorage')}
              subtitle={t('settings.dataStorageSubtitle')}
              isDark={isDark}
              onClick={() => setActiveSection('storage')}
            />
          </SettingsGroup>
        </div>

        <div className="w-full mb-6">
          <SettingsSectionTitle title={t('settings.servicesSection')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsRow
              icon={<Bot size={16} />}
              iconBg={isDark ? "bg-fuchsia-500/10" : "bg-fuchsia-100"}
              iconColor={isDark ? "text-fuchsia-400" : "text-fuchsia-600"}
              title={t('settings.bots')}
              subtitle={t('settings.botsSubtitle')}
              isDark={isDark}
              onClick={() => setActiveSection('bots')}
            />
          </SettingsGroup>
        </div>

        <div className="w-full mb-6">
          <SettingsSectionTitle title={t('settings.advancedSection')} isDark={isDark} />
          <SettingsGroup isDark={isDark}>
            <SettingsRow
              icon={<Network size={16} />}
              iconBg={isDark ? "bg-blue-500/10" : "bg-blue-100"}
              iconColor={isDark ? "text-blue-400" : "text-blue-600"}
              title={t('settings.network')}
              subtitle={proxyEnabled ? t('settings.networkEnabled') : t('settings.disabled')}
              isDark={isDark}
              onClick={() => setActiveSection('network')}
            />
            <SettingsRow
              icon={<ShieldAlert size={16} />}
              iconBg={isDark ? "bg-red-500/10" : "bg-red-100"}
              iconColor={isDark ? "text-red-400" : "text-red-600"}
              title={t('settings.spamProtection')}
              subtitle={spamFilterEnabled ? t('settings.spamActive') : t('settings.spamDisabled')}
              isDark={isDark}
              onClick={() => setActiveSection('spam')}
            />
            <SettingsRow
              icon={<Activity size={16} />}
              iconBg={isDark ? "bg-emerald-500/10" : "bg-emerald-100"}
              iconColor={isDark ? "text-emerald-400" : "text-emerald-600"}
              title={t('settings.systemStatus')}
              subtitle={t('settings.systemStatusSubtitle')}
              isDark={isDark}
              onClick={() => setActiveSection('systemStatus')}
            />
          </SettingsGroup>
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

  const renderSecuritySettings = () => (
    <SecuritySection
      isDark={isDark}
      onBack={() => setActiveSection('main')}
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
      stealthMode={stealthMode}
      anonymousMode={anonymousMode}
      deliveryReceipts={deliveryReceipts}
      readReceipts={readReceipts}
      typingIndicators={typingIndicators}
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
      torBridge={torBridge}
      setTorBridge={setTorBridge}
      turnServerUrl={turnServerUrl}
      onUpdateSettings={updateSettings}
      onBack={() => setActiveSection('main')}
      t={t}
    />
  );

  return (
    <div className={`w-full max-w-[400px] flex-1 flex flex-col rounded-[32px] p-6 mb-8 h-full min-h-0 ${isDark ? "bg-[#11141c]/50 border border-white/5 scrollbar-dark" : "bg-[#eaeff4]/50 border border-black/5 shadow-inner scrollbar-light"}`}>
      <AnimatePresence mode="wait">
        {activeSection === 'main' && renderMainSettings()}
        {activeSection === 'appearance' && renderAppearanceSettings()}
        {activeSection === 'language' && renderLanguageSettings()}
        {activeSection === 'security' && renderSecuritySettings()}
        {activeSection === 'privacy' && renderPrivacySettings()}
        {activeSection === 'network' && renderNetworkSettings()}
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