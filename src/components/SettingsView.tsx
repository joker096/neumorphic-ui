import React, { useState, Suspense } from 'react';
import { useAppStore } from '../store';
import { useI18n, detectBrowserLanguage } from '../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow, ToggleSwitch } from './ui/SettingsRow';
import { SubView } from './ui/SubView';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { DEFAULTS, KEYS } from '../config/settingsDefaults';
import { ChevronRight, Smartphone, Palette, Shield, Lock, Bot, ShieldAlert, ChevronLeft, Building2 } from 'lucide-react';
import { CompanySettingsView } from './settings/CompanySettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { LanguageSection } from './settings/LanguageSection';
import { PrivacySection } from './settings/PrivacySection';
import { AccountSection } from './settings/AccountSection';
import { SettingsMainMenu } from './settings/SettingsMainMenu';

const NetworkSection = React.lazy(() => import('./settings/NetworkSection').then(m => ({ default: m.NetworkSection })));
const SecuritySection = React.lazy(() => import('./settings/SecuritySection').then(m => ({ default: m.SecuritySection })));
const StorageSection = React.lazy(() => import('./settings/StorageSection').then(m => ({ default: m.StorageSection })));
const BotsSection = React.lazy(() => import('./settings/BotsSection').then(m => ({ default: m.BotsSection })));
const SpamSection = React.lazy(() => import('./settings/SpamSection').then(m => ({ default: m.SpamSection })));
const SystemStatusSection = React.lazy(() => import('./settings/SystemStatusSection').then(m => ({ default: m.SystemStatusSection })));

export const SettingsView = ({ theme, setTheme, setSubView, fontSize: fontSizeProp, setFontSize: setFontSizeProp }: { theme: 'light' | 'dark', setTheme?: (t: 'light' | 'dark') => void, setSubView?: (view: string | null) => void; fontSize?: string; setFontSize?: (s: string) => void }) => {
  const isDark = theme === 'dark';
  const { t, setLang } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('main');
  
  const [language, setLanguage] = useLocalStorage<string>(KEYS.LANGUAGE, detectBrowserLanguage());
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage(KEYS.NOTIFICATIONS, DEFAULTS.notifications);
  const soundEnabled = useAppStore(state => state.soundEnabled);
  const setSoundEnabled = useAppStore(state => state.setSoundEnabled);
  const [twoFactorEnabled, setTwoFactorEnabled] = useLocalStorage(KEYS.TWO_FACTOR, DEFAULTS.twoFactor);
  const [proxyEnabled, setProxyEnabled] = useLocalStorage(KEYS.PROXY, DEFAULTS.proxy);
  const [spamFilterEnabled, setSpamFilterEnabled] = useLocalStorage(KEYS.SPAM_FILTER, DEFAULTS.spamFilter);
  const [showPwaBanner, setShowPwaBanner] = useLocalStorage(KEYS.PWA_BANNER, DEFAULTS.pwaBanner);
  const [deadMansSwitch, setDeadMansSwitch] = useLocalStorage(KEYS.DEAD_MANS_SWITCH, DEFAULTS.deadMansSwitch);
  const [mediaAutoLoad, setMediaAutoLoad] = useLocalStorage(KEYS.MEDIA_AUTO_LOAD, DEFAULTS.mediaAutoLoad);
  const [selfDestructDefault, setSelfDestructDefault] = useLocalStorage(KEYS.SELF_DESTRUCT, DEFAULTS.selfDestructDefault);
  const [obfuscationMode, setObfuscationMode] = useLocalStorage(KEYS.OBFUSCATION_MODE, DEFAULTS.obfuscationMode);
  const [obfuscationEnabled, setObfuscationEnabled] = useLocalStorage(KEYS.OBFUSCATION_ENABLED, DEFAULTS.obfuscationEnabled);
  const [proxyUrl, setProxyUrl] = useLocalStorage(KEYS.PROXY_URL, DEFAULTS.proxyUrl);
  const [torBridge, setTorBridge] = useLocalStorage(KEYS.TOR_BRIDGE, DEFAULTS.torBridge);
  const [relayBackend, setRelayBackend] = useLocalStorage(KEYS.RELAY_BACKEND, DEFAULTS.relayBackend);
  const [autoReconnectEnabled, setAutoReconnectEnabled] = useLocalStorage(KEYS.AUTO_RECONNECT, DEFAULTS.autoReconnect);
  const [p2pMeshEnabled, setP2pMeshEnabled] = useLocalStorage(KEYS.P2P_MESH, DEFAULTS.p2pMesh);
  const [visNumber, setVisNumber] = useLocalStorage(KEYS.VIS_NUMBER, DEFAULTS.visNumber);
  const [visActivity, setVisActivity] = useLocalStorage(KEYS.VIS_ACTIVITY, DEFAULTS.visActivity);
  const [uiAnimations, setUiAnimations] = useLocalStorage(KEYS.UI_ANIMATIONS, DEFAULTS.uiAnimations);
  const [localFontSize, setLocalFontSize] = useLocalStorage(KEYS.FONT_SIZE, DEFAULTS.fontSize);
  const fontSize = fontSizeProp ?? localFontSize;
  const setFontSize = setFontSizeProp ?? setLocalFontSize;
  const [dndEnabled, setDndEnabled] = useLocalStorage(KEYS.DND_ENABLED, DEFAULTS.dndEnabled);
  const [dndFrom, setDndFrom] = useLocalStorage(KEYS.DND_FROM, DEFAULTS.dndFrom);
  const [dndTo, setDndTo] = useLocalStorage(KEYS.DND_TO, DEFAULTS.dndTo);
  const [priorityContacts, setPriorityContacts] = useLocalStorage(KEYS.PRIORITY_CONTACTS, DEFAULTS.priorityContacts);

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
    forwardAnonymization,
    onlineStatus,
    ghostViewMode,
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

  const renderMainSettings = () => (
    <SettingsMainMenu
      isDark={isDark}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      t={t}
      setActiveSection={setActiveSection}
      setSubView={setSubView}
      notificationsEnabled={notificationsEnabled}
      setNotificationsEnabled={setNotificationsEnabled}
      soundEnabled={soundEnabled}
      setSoundEnabled={setSoundEnabled}
      cloudSyncEnabled={cloudSync.enabled}
      setCloudSyncEnabled={setCloudSyncEnabled}
      language={language}
      proxyEnabled={proxyEnabled}
      spamFilterEnabled={spamFilterEnabled}
    />
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
      ghostViewMode={ghostViewMode}
      forwardAnonymization={forwardAnonymization}
      onlineStatus={onlineStatus}
      allowMetadata={allowMetadata}
      allowForwarding={allowForwarding}
      setAllowForwarding={(v) => updateSettings({ allowForwarding: v })}
      setAllowMetadata={(v) => updateSettings({ allowMetadata: v })}
      forwardCountLimit={forwardCountLimit}
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
      obfuscationEnabled={obfuscationEnabled}
      setObfuscationEnabled={setObfuscationEnabled}
      torBridge={torBridge}
      setTorBridge={setTorBridge}
      turnServerUrl={turnServerUrl}
      relayBackend={relayBackend}
      setRelayBackend={setRelayBackend}
      autoReconnectEnabled={autoReconnectEnabled}
      setAutoReconnectEnabled={setAutoReconnectEnabled}
      p2pMeshEnabled={p2pMeshEnabled}
      setP2pMeshEnabled={setP2pMeshEnabled}
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
    <div className={`w-full max-w-2xl lg:max-w-3xl flex-1 flex flex-col p-6 mb-8 h-full min-h-0 pb-28 sm:pb-8 ${isDark ? "bg-[#11141c]/50 border border-[var(--border-color)]" : "bg-[#eaeff4]/50 border border-[var(--border-color)] shadow-inner"}`}>
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
    </div>
  );
};