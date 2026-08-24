import React, { Suspense } from 'react';
import { CompanySettingsView } from './CompanySettingsView';
import { AnimatePresence } from 'motion/react';
import { AppearanceSettings } from './AppearanceSettings';
import { LanguageSection } from './LanguageSection';
import { PrivacySection } from './PrivacySection';
import { ProfileSection } from './ProfileSection';
import { SettingsMainMenu } from './SettingsMainMenu';
import { useSettingsSectionData } from './useSettingsSectionData';

const NetworkSection = React.lazy(() => import('./NetworkSection').then(m => ({ default: m.NetworkSection })));
const SecuritySection = React.lazy(() => import('./SecuritySection').then(m => ({ default: m.SecuritySection })));
const BotsSection = React.lazy(() => import('./BotsSection').then(m => ({ default: m.BotsSection })));
const SpamSection = React.lazy(() => import('./SpamSection').then(m => ({ default: m.SpamSection })));
const SystemStatusSection = React.lazy(() => import('./SystemStatusSection').then(m => ({ default: m.SystemStatusSection })));
const StorageSection = React.lazy(() => import('./StorageSection').then(m => ({ default: m.StorageSection })));
const NotificationsSection = React.lazy(() => import('./NotificationsSection').then(m => ({ default: m.NotificationsSection })));
const FoldersSection = React.lazy(() => import('./FoldersSection').then(m => ({ default: m.FoldersSection })));
const BackupExportSection = React.lazy(() => import('./BackupExportSection').then(m => ({ default: m.BackupExportSection })));
const HelpSupportSection = React.lazy(() => import('./HelpSupportSection').then(m => ({ default: m.HelpSupportSection })));
const CompanyGuideSection = React.lazy(() => import('./CompanyGuideSection').then(m => ({ default: m.CompanyGuideSection })));
const PaymentsSection = React.lazy(() => import('./PaymentsSection').then(m => ({ default: m.PaymentsSection })));
const PaymentRequestsSection = React.lazy(() => import('./PaymentRequestsSection').then(m => ({ default: m.PaymentRequestsSection })));
const CallRecordingsSection = React.lazy(() => import('./CallRecordingsSection').then(m => ({ default: m.CallRecordingsSection })));
const PremiumSection = React.lazy(() => import('./PremiumSection').then(m => ({ default: m.PremiumSection })));

export type SettingsSectionContentProps = {
  theme: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
  setSubView?: (view: string | null) => void;
  fontSize?: string;
  setFontSize?: (s: string) => void;
  language?: string;
  setLanguage?: (l: string) => void;
};

export const SettingsSectionContent = ({ theme, setTheme, setSubView, fontSize: fontSizeProp, setFontSize: setFontSizeProp, language: languageProp, setLanguage: setLanguageProp }: SettingsSectionContentProps) => {
  const {
    t,
    setLang,
    lang,
    searchQuery,
    setSearchQuery,
    activeSection,
    setActiveSection,
    notificationsEnabled,
    setNotificationsEnabled,
    soundEnabled,
    setSoundEnabled,
    proxyEnabled,
    setProxyEnabled,
    spamFilterEnabled,
    setSpamFilterEnabled,
    showPwaBanner,
    setShowPwaBanner,
    mediaAutoLoad,
    setMediaAutoLoad,
    selfDestructDefault,
    setSelfDestructDefault,
    obfuscationMode,
    setObfuscationMode,
    obfuscationEnabled,
    setObfuscationEnabled,
    proxyUrl,
    setProxyUrl,
    torBridge,
    setTorBridge,
    turnServerUrl,
    relayBackend,
    setRelayBackend,
    autoReconnectEnabled,
    setAutoReconnectEnabled,
    p2pMeshEnabled,
    setP2pMeshEnabled,
    visNumber,
    setVisNumber,
    visActivity,
    setVisActivity,
    uiAnimations,
    setUiAnimations,
    dndEnabled,
    setDndEnabled,
    dndFrom,
    setDndFrom,
    dndTo,
    setDndTo,
    priorityContacts,
    setPriorityContacts,
    stealthMode,
    anonymousMode,
    readReceipts,
    deliveryReceipts,
    typingIndicators,
    ghostViewMode,
    forwardAnonymization,
    onlineStatus,
    allowForwarding,
    allowMetadata,
    forwardCountLimit,
    cloudSync,
    setCloudSyncEnabled,
    updateSettings,
    bots,
    setBots,
    connectionStatus,
    transportBackend,
    latencyMs,
    blockedBackends,
    regionBlocked,
    premiumEntitlement,
  } = useSettingsSectionData();

  const isDark = theme === 'dark';
  const language = languageProp ?? lang;
  const setLanguage = setLanguageProp ?? setLang;
  const fontSize = fontSizeProp ?? 'Medium';
  const setFontSize = setFontSizeProp ?? (() => {});

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
      cloudSync={cloudSync}
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

  const renderProfileSettings = () => (
    <ProfileSection
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
        premium={premiumEntitlement.premium}
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
      onOpenGuide={() => setActiveSection('companyGuide')}
    />
  );

  const renderCompanyGuideSettings = () => (
    <CompanyGuideSection
      isDark={isDark}
      onBack={() => setActiveSection('company')}
      onCreateCompany={() => setActiveSection('company')}
    />
  );

  const fallback = <div className={`text-center py-8 text-sm ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('common.loading')}</div>;

  return (
    <AnimatePresence mode="wait">
      {activeSection === 'main' && renderMainSettings()}
      {activeSection === 'profile' && renderProfileSettings()}
      {activeSection === 'appearance' && renderAppearanceSettings()}
      {activeSection === 'language' && renderLanguageSettings()}
      {activeSection === 'security' && <Suspense fallback={fallback}>{renderSecuritySettings()}</Suspense>}
      {activeSection === 'privacy' && renderPrivacySettings()}
      {activeSection === 'network' && <Suspense fallback={fallback}>{renderNetworkSettings()}</Suspense>}
      {activeSection === 'bots' && <Suspense fallback={fallback}>{renderBotsSettings()}</Suspense>}
      {activeSection === 'spam' && <Suspense fallback={fallback}>{renderSpamSettings()}</Suspense>}
      {activeSection === 'systemStatus' && <Suspense fallback={fallback}>{renderSystemStatusSettings()}</Suspense>}
      {activeSection === 'company' && <Suspense fallback={fallback}>{renderCompanySettings()}</Suspense>}
      {activeSection === 'companyGuide' && <Suspense fallback={fallback}>{renderCompanyGuideSettings()}</Suspense>}
      {activeSection === 'storage' && <Suspense fallback={fallback}><StorageSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'notifications' && <Suspense fallback={fallback}><NotificationsSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'folders' && <Suspense fallback={fallback}><FoldersSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'backup' && <Suspense fallback={fallback}><BackupExportSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'help' && <Suspense fallback={fallback}><HelpSupportSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'payments' && <Suspense fallback={fallback}><PaymentsSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'paymentRequests' && <Suspense fallback={fallback}><PaymentRequestsSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'callRecordings' && <Suspense fallback={fallback}><CallRecordingsSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'premium' && <Suspense fallback={fallback}><PremiumSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
    </AnimatePresence>
  );
};
