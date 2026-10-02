import { Suspense } from 'react';
import { CompanySettingsView } from './CompanySettingsView';
import { AnimatePresence } from 'motion/react';
import { AppearanceSettings } from './AppearanceSettings';
import { LanguageSection } from './LanguageSection';
import { PrivacySection } from './PrivacySection';
import { ProfileSection } from './ProfileSection';
import { SettingsMainMenu } from './SettingsMainMenu';
import { useSettingsSectionData } from './useSettingsSectionData';

import { NetworkSection, DevicesSection, SecuritySection, BotsSection, SystemStatusSection, StorageSection, NotificationsSection, FoldersSection, BackupExportSection, HelpSupportSection, CompanyGuideSection, PaymentsSection, PaymentRequestsSection, CallsSection, PremiumSection, MeshSection } from './lazySections';

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
    soundVolume,
    setSoundVolume,
    mediaAutoLoad,
    setMediaAutoLoad,
    selfDestructDefault,
    setSelfDestructDefault,
    obfuscationEnabled,
    setObfuscationEnabled,
    turnServerUrl,
    turnServerUser,
    turnServerPass,
    relayBackend,
    setRelayBackend,
    autoReconnectEnabled,
    setAutoReconnectEnabled,
    uiAnimations,
    setUiAnimations,
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    chatBackground,
    setChatBackground,
    density,
    setDensity,
    messageRadius,
    setMessageRadius,
    animationIntensity,
    setAnimationIntensity,
    dndEnabled,
    setDndEnabled,
    dndFrom,
    setDndFrom,
    dndTo,
    setDndTo,
    priorityContacts,
    setPriorityContacts,
    stealthMode,
    readReceipts,
    deliveryReceipts,
    typingIndicators,
    ghostViewMode,
    forwardAnonymization,
    onlineStatus,
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
    customChatBackground,
    setCustomChatBackground,
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
      soundVolume={soundVolume}
      setSoundVolume={setSoundVolume}
      cloudSync={cloudSync}
      setCloudSyncEnabled={setCloudSyncEnabled}
      language={language}
      lang={lang}
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
      themeMode={themeMode}
      setThemeMode={setThemeMode}
      accentColor={accentColor}
      setAccentColor={setAccentColor}
      chatBackground={chatBackground}
      setChatBackground={setChatBackground}
      premium={premiumEntitlement.premium}
      customChatBackground={customChatBackground}
      setCustomChatBackground={setCustomChatBackground}
      density={density}
      setDensity={setDensity}
      messageRadius={messageRadius}
      setMessageRadius={setMessageRadius}
      animationIntensity={animationIntensity}
      setAnimationIntensity={setAnimationIntensity}
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
      onOpenPremium={() => setActiveSection('premium')}
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
      dndEnabled={dndEnabled}
      setDndEnabled={setDndEnabled}
      dndFrom={dndFrom}
      setDndFrom={setDndFrom}
      dndTo={dndTo}
      setDndTo={setDndTo}
      priorityContacts={priorityContacts}
      setPriorityContacts={setPriorityContacts}
      stealthMode={stealthMode}
      deliveryReceipts={deliveryReceipts}
      readReceipts={readReceipts}
      typingIndicators={typingIndicators}
      ghostViewMode={ghostViewMode}
      forwardAnonymization={forwardAnonymization}
      setForwardAnonymization={(v) => updateSettings({ forwardAnonymization: v })}
      onlineStatus={onlineStatus}
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
      obfuscationEnabled={obfuscationEnabled}
      setObfuscationEnabled={setObfuscationEnabled}
      turnServerUrl={turnServerUrl}
      turnServerUser={turnServerUser}
      turnServerPass={turnServerPass}
      relayBackend={relayBackend}
      setRelayBackend={setRelayBackend}
      autoReconnectEnabled={autoReconnectEnabled}
      setAutoReconnectEnabled={setAutoReconnectEnabled}
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
      {activeSection === 'devices' && <Suspense fallback={fallback}><DevicesSection isDark={isDark} onBack={() => setActiveSection('main')} t={t} /></Suspense>}
      {activeSection === 'privacy' && renderPrivacySettings()}
      {activeSection === 'network' && <Suspense fallback={fallback}>{renderNetworkSettings()}</Suspense>}
      {activeSection === 'bots' && <Suspense fallback={fallback}>{renderBotsSettings()}</Suspense>}
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
      {activeSection === 'calls' && <Suspense fallback={fallback}><CallsSection isDark={isDark} onBack={() => setActiveSection('main')} setSubView={setSubView} /></Suspense>}
      {activeSection === 'premium' && <Suspense fallback={fallback}><PremiumSection isDark={isDark} onBack={() => setActiveSection('main')} /></Suspense>}
      {activeSection === 'mesh' && <Suspense fallback={fallback}><MeshSection isDark={isDark} onBack={() => setActiveSection('main')} t={t} /></Suspense>}
    </AnimatePresence>
  );
};
