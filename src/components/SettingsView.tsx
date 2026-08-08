import React, { useState, Suspense } from 'react';
import { useAppStore } from '../store';
import { useI18n } from '../lib/i18n';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow, ToggleSwitch } from './ui/SettingsRow';
import { SubView } from './ui/SubView';
import { ChevronRight, Smartphone, Palette, Shield, Lock, Bot, ShieldAlert, ChevronLeft, Building2 } from 'lucide-react';
import { CompanySettingsView } from './settings/CompanySettingsView';
import { motion, AnimatePresence } from 'motion/react';
import { AppearanceSettings } from './settings/AppearanceSettings';
import { LanguageSection } from './settings/LanguageSection';
import { PrivacySection } from './settings/PrivacySection';
import { AccountSection } from './settings/AccountSection';
import { SettingsMainMenu } from './settings/SettingsMainMenu';
import { MyProfileSection } from './settings/MyProfileSection';

const NetworkSection = React.lazy(() => import('./settings/NetworkSection').then(m => ({ default: m.NetworkSection })));
const SecuritySection = React.lazy(() => import('./settings/SecuritySection').then(m => ({ default: m.SecuritySection })));
const StorageSection = React.lazy(() => import('./settings/StorageSection').then(m => ({ default: m.StorageSection })));
const BotsSection = React.lazy(() => import('./settings/BotsSection').then(m => ({ default: m.BotsSection })));
const SpamSection = React.lazy(() => import('./settings/SpamSection').then(m => ({ default: m.SpamSection })));
const SystemStatusSection = React.lazy(() => import('./settings/SystemStatusSection').then(m => ({ default: m.SystemStatusSection })));

export const SettingsView = ({ theme, setTheme, setSubView, fontSize: fontSizeProp, setFontSize: setFontSizeProp, language: languageProp, setLanguage: setLanguageProp }: { theme: 'light' | 'dark', setTheme?: (t: 'light' | 'dark') => void, setSubView?: (view: string | null) => void; fontSize?: string; setFontSize?: (s: string) => void; language?: string; setLanguage?: (l: string) => void }) => {
  const isDark = theme === 'dark';
  const { t, setLang, lang } = useI18n();
  const language = languageProp ?? lang;
  const setLanguage = setLanguageProp ?? setLang;
  const fontSize = fontSizeProp ?? 'Medium';
  const setFontSize = setFontSizeProp ?? (() => {});

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('main');

  const notificationsEnabled = useAppStore(state => state.notifications);
  const setNotificationsEnabled = useAppStore(state => state.setNotifications);
  const soundEnabled = useAppStore(state => state.soundEnabled);
  const setSoundEnabled = useAppStore(state => state.setSoundEnabled);
  const twoFactorEnabled = useAppStore(state => state.twoFactor);
  const setTwoFactorEnabled = useAppStore(state => state.setTwoFactor);
  const proxyEnabled = useAppStore(state => state.proxyEnabled);
  const setProxyEnabled = useAppStore(state => state.setProxyEnabled);
  const spamFilterEnabled = useAppStore(state => state.spamFilter);
  const setSpamFilterEnabled = useAppStore(state => state.setSpamFilter);
  const showPwaBanner = useAppStore(state => state.pwaBanner);
  const setShowPwaBanner = useAppStore(state => state.setPwaBanner);
  const deadMansSwitch = useAppStore(state => state.deadMansSwitch);
  const setDeadMansSwitch = useAppStore(state => state.setDeadMansSwitch);
  const mediaAutoLoad = useAppStore(state => state.mediaAutoLoad);
  const setMediaAutoLoad = useAppStore(state => state.setMediaAutoLoad);
  const selfDestructDefault = useAppStore(state => state.selfDestructDefault);
  const setSelfDestructDefault = useAppStore(state => state.setSelfDestructDefault);
  const obfuscationMode = useAppStore(state => state.obfuscationMode);
  const setObfuscationMode = useAppStore(state => state.setObfuscationMode);
  const obfuscationEnabled = useAppStore(state => state.obfuscationEnabled);
  const setObfuscationEnabled = useAppStore(state => state.setObfuscationEnabled);
  const proxyUrl = useAppStore(state => state.proxyUrl);
  const setProxyUrl = useAppStore(state => state.setProxyUrl);
  const torBridge = useAppStore(state => state.torBridge);
  const setTorBridge = useAppStore(state => state.setTorBridge);
  const relayBackend = useAppStore(state => state.relayBackend);
  const setRelayBackend = useAppStore(state => state.setRelayBackend);
  const autoReconnectEnabled = useAppStore(state => state.autoReconnect);
  const setAutoReconnectEnabled = useAppStore(state => state.setAutoReconnect);
  const p2pMeshEnabled = useAppStore(state => state.p2pMesh);
  const setP2pMeshEnabled = useAppStore(state => state.setP2pMesh);
  const visNumber = useAppStore(state => state.visNumber);
  const setVisNumber = useAppStore(state => state.setVisNumber);
  const visActivity = useAppStore(state => state.visActivity);
  const setVisActivity = useAppStore(state => state.setVisActivity);
  const uiAnimations = useAppStore(state => state.uiAnimations);
  const setUiAnimations = useAppStore(state => state.setUiAnimations);
  const dndEnabled = useAppStore(state => state.dndEnabled);
  const setDndEnabled = useAppStore(state => state.setDndEnabled);
  const dndFrom = useAppStore(state => state.dndFrom);
  const setDndFrom = useAppStore(state => state.setDndFrom);
  const dndTo = useAppStore(state => state.dndTo);
  const setDndTo = useAppStore(state => state.setDndTo);
  const priorityContacts = useAppStore(state => state.priorityContacts);
  const setPriorityContacts = useAppStore(state => state.setPriorityContacts);

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

  const renderMyProfileSettings = () => (
    <MyProfileSection
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
      allowForwarding={allowForwarding}
      setAllowForwarding={(v) => updateSettings({ allowForwarding: v })}
      allowMetadata={allowMetadata}
      setAllowMetadata={(v) => updateSettings({ allowMetadata: v })}
      forwardCountLimit={forwardCountLimit}
      setForwardCountLimit={(v) => updateSettings({ forwardCountLimit: v })}
      mediaAutoLoad={mediaAutoLoad}
      setMediaAutoLoad={setMediaAutoLoad}
      selfDestructDefault={selfDestructDefault}
      setSelfDestructDefault={setSelfDestructDefault}
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
    <div className={`w-full max-w-none md:max-w-[640px] flex-1 flex flex-col p-4 sm:p-6 mb-8 h-full min-h-0 pb-28 sm:pb-8 ${isDark ? "bg-[var(--bg-primary)]/50 border border-[var(--border-color)]" : "bg-[var(--bg-secondary)]/50 border border-[var(--border-color)] shadow-inner"}`}>
      <AnimatePresence mode="wait">
        {activeSection === 'main' && renderMainSettings()}
        {activeSection === 'myProfile' && renderMyProfileSettings()}
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
