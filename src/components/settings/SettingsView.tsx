import React, { useState, Suspense, lazy, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { toast } from 'sonner';
import { SettingsRow, SettingsGroup, SettingsSectionTitle, SettingsToggleRow } from '../ui/SettingsRow';
import { ToggleSwitch } from '../ui/ToggleSwitch';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { DEFAULTS, KEYS } from '../../config/settingsDefaults';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronRight, User, Palette, Globe, Bell, Shield, Eye, HardDrive, Bot, Wifi, Activity, Smartphone } from 'lucide-react';

const AppearanceSettings = lazy(() => import('./AppearanceSettings').then(m => ({ default: m.AppearanceSettings })));
const LanguageSection = lazy(() => import('./LanguageSection').then(m => ({ default: m.LanguageSection })));
const PrivacySection = lazy(() => import('./PrivacySection').then(m => ({ default: m.PrivacySection })));
const AccountSection = lazy(() => import('./AccountSection').then(m => ({ default: m.AccountSection })));
const SecuritySection = lazy(() => import('./SecuritySection').then(m => ({ default: m.SecuritySection })));
const NetworkSection = lazy(() => import('./NetworkSection').then(m => ({ default: m.NetworkSection })));
const StorageSection = lazy(() => import('./StorageSection').then(m => ({ default: m.StorageSection })));
const BotsSection = lazy(() => import('./BotsSection').then(m => ({ default: m.BotsSection })));
const SystemStatusSection = lazy(() => import('./SystemStatusSection').then(m => ({ default: m.SystemStatusSection })));
const ConnectionSettings = lazy(() => import('./ConnectionSettings').then(m => ({ default: m.ConnectionSettings })));
const MyProfileSection = lazy(() => import('./MyProfileSection').then(m => ({ default: m.MyProfileSection })));
const NotificationsSection = lazy(() => import('./NotificationsSection').then(m => ({ default: m.NotificationsSection })));

const SEARCH_MAP: Record<string, string[]> = {
  security: ['security', 'lock', 'pin', 'wipe', 'защита', 'безопасность'],
  privacy: ['privacy', 'stealth', 'anonymous', 'ghost', 'online', 'приватность', 'стелс', 'аноним'],
  network: ['network', 'proxy', 'obfuscation', 'tor', 'relay', 'p2p', 'сеть', 'прокси', 'обфуск'],
  storage: ['storage', 'backup', 'import', 'export', 'cache', 'храни', 'резерв'],
  bots: ['bots', 'bot', 'bot'],
  systemStatus: ['status', 'system', 'diagnostic', 'статус'],
  connection: ['connection', 'transport', 'соедение', 'транспорт', 'сое'],
  appearance: ['appearance', 'theme', 'font', 'dark', 'light', 'тема', 'шрифт'],
  language: ['language', 'lang', 'язык', 'ru', 'en'],
  account: ['account', 'profile', 'аккаунт', 'профиль'],
};

const fallback = <div className="text-center py-8 text-sm text-gray-500">Loading...</div>;

const SettingsViewInner = ({ theme, setTheme, setSubView, defaultSection }: { theme: 'light' | 'dark'; setTheme?: (t: 'light' | 'dark') => void; setSubView?: (view: string | null) => void; defaultSection?: string }) => {
  const { t, setLang } = useI18n();

  useEffect(() => {
    if (defaultSection) {
      setActiveSection(defaultSection);
    }
  }, [defaultSection]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('main');
  const [language, setLanguage] = useLocalStorage<string>(KEYS.LANGUAGE, 'ru');
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage(KEYS.NOTIFICATIONS, DEFAULTS.notifications);
  const [twoFactorEnabled, setTwoFactorEnabled] = useLocalStorage(KEYS.TWO_FACTOR, DEFAULTS.twoFactor);
  const [proxyEnabled, setProxyEnabled] = useLocalStorage(KEYS.PROXY, DEFAULTS.proxy);
  const [showPwaBanner, setShowPwaBanner] = useLocalStorage(KEYS.PWA_BANNER, DEFAULTS.pwaBanner);
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
  const [fontSize, setFontSize] = useLocalStorage(KEYS.FONT_SIZE, DEFAULTS.fontSize);
  const [dndEnabled, setDndEnabled] = useLocalStorage(KEYS.DND_ENABLED, DEFAULTS.dndEnabled);
  const [dndFrom, setDndFrom] = useLocalStorage(KEYS.DND_FROM, DEFAULTS.dndFrom);
  const [dndTo, setDndTo] = useLocalStorage(KEYS.DND_TO, DEFAULTS.dndTo);
  const [priorityContacts, setPriorityContacts] = useLocalStorage(KEYS.PRIORITY_CONTACTS, DEFAULTS.priorityContacts);

  const {
    stealthMode, anonymousMode, readReceipts, deliveryReceipts, typingIndicators,
    turnServerUrl, turnServerUser, turnServerPass, allowForwarding, allowMetadata,
    forwardCountLimit, onlineStatus, ghostViewMode, cloudSync, updateSettings,
    setCloudSyncEnabled, bots, setBots, connectionStatus, transportBackend, latencyMs,
    blockedBackends, regionBlocked, soundEnabled, setSoundEnabled, isOnline,
  } = useAppStore();

  const sections = useMemo(() => [
    { id: 'myProfile', label: t('settings.myProfile'), subtitle: t('settings.myProfileSubtitle'), icon: User, search: 'my profile, profile, имя, отображение' },
    { id: 'account', label: t('settings.account'), subtitle: t('settings.accountSubtitle'), icon: User, search: 'account' },
    { id: 'appearance', label: t('settings.theme'), subtitle: t('settings.appearanceTheme'), icon: Palette, search: 'appearance' },
    { id: 'language', label: t('settings.language'), subtitle: language, icon: Globe, search: 'language' },
    { id: 'notifications', label: t('settings.notifications'), subtitle: '', icon: Bell, search: 'notifications' },
    { id: 'security', label: t('settings.security'), subtitle: t('settings.securitySubtitle'), icon: Shield, search: 'security' },
    { id: 'privacy', label: t('settings.privacy'), subtitle: t('settings.privacySubtitle'), icon: Eye, search: 'privacy' },
    { id: 'storage', label: t('settings.dataStorage'), subtitle: t('settings.dataStorageSubtitle'), icon: HardDrive, search: 'storage' },
    { id: 'bots', label: t('settings.bots'), subtitle: t('settings.botsSubtitle'), icon: Bot, search: 'bots' },
    { id: 'network', label: t('settings.network'), subtitle: proxyEnabled ? t('settings.networkEnabled') : t('settings.disabled'), icon: Wifi, search: 'network' },
    { id: 'connection', label: t('settings.connection'), subtitle: '', icon: Wifi, search: 'connection' },
    { id: 'systemStatus', label: t('settings.systemStatus'), subtitle: t('settings.systemStatusSubtitle'), icon: Activity, search: 'systemStatus' },
  ], [t, language, proxyEnabled]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter((s) =>
      s.label.toLowerCase().includes(q) ||
      s.subtitle?.toLowerCase().includes(q) ||
      SEARCH_MAP[s.id]?.some((key) => q.includes(key))
    );
  }, [sections, searchQuery]);

  const renderSection = (id: string) => {
    switch (id) {
      case 'security':
        return (
          <Suspense fallback={fallback}>
            <SecuritySection onBack={() => setActiveSection('main')} t={t} isDark={theme === 'dark'} />
          </Suspense>
        );
      case 'privacy':
        return (
          <Suspense fallback={fallback}>
            <PrivacySection
              visNumber={visNumber} setVisNumber={setVisNumber}
              visActivity={visActivity} setVisActivity={setVisActivity}
              dndEnabled={dndEnabled} setDndEnabled={setDndEnabled}
              dndFrom={dndFrom} setDndFrom={setDndFrom}
              dndTo={dndTo} setDndTo={setDndTo}
              priorityContacts={priorityContacts} setPriorityContacts={setPriorityContacts}
              stealthMode={stealthMode} anonymousMode={anonymousMode}
              deliveryReceipts={deliveryReceipts} readReceipts={readReceipts}
              typingIndicators={typingIndicators} ghostViewMode={ghostViewMode}
              onlineStatus={onlineStatus}
              allowForwarding={allowForwarding} setAllowForwarding={(v) => updateSettings({ allowForwarding: v })}
              allowMetadata={allowMetadata} setAllowMetadata={(v) => updateSettings({ allowMetadata: v })}
              forwardCountLimit={forwardCountLimit} setForwardCountLimit={(v) => updateSettings({ forwardCountLimit: v })}
              onUpdateSettings={updateSettings} onBack={() => setActiveSection('main')} t={t} isDark={theme === 'dark'}
            />
          </Suspense>
        );
      case 'network':
        return (
          <Suspense fallback={fallback}>
            <NetworkSection
              proxyEnabled={proxyEnabled} setProxyEnabled={setProxyEnabled}
              proxyUrl={proxyUrl} setProxyUrl={setProxyUrl}
              obfuscationMode={obfuscationMode} setObfuscationMode={setObfuscationMode}
              obfuscationEnabled={obfuscationEnabled} setObfuscationEnabled={setObfuscationEnabled}
              torBridge={torBridge} setTorBridge={setTorBridge}
              turnServerUrl={turnServerUrl} turnServerUser={turnServerUser} turnServerPass={turnServerPass}
              relayBackend={relayBackend} setRelayBackend={setRelayBackend}
              autoReconnectEnabled={autoReconnectEnabled} setAutoReconnectEnabled={setAutoReconnectEnabled}
              p2pMeshEnabled={p2pMeshEnabled} setP2pMeshEnabled={setP2pMeshEnabled}
              onUpdateSettings={updateSettings} onBack={() => setActiveSection('main')} t={t} isDark={theme === 'dark'}
            />
          </Suspense>
        );
      case 'storage':
        return (
          <Suspense fallback={fallback}>
            <StorageSection onBack={() => setActiveSection('main')} t={t} isDark={theme === 'dark'} />
          </Suspense>
        );
      case 'bots':
        return (
          <Suspense fallback={fallback}>
            <BotsSection bots={bots} setBots={setBots} onBack={() => setActiveSection('main')} t={t} isDark={theme === 'dark'} />
          </Suspense>
        );
      case 'systemStatus':
        return (
          <Suspense fallback={fallback}>
            <SystemStatusSection connectionStatus={connectionStatus} transportBackend={transportBackend} latencyMs={latencyMs} blockedBackends={blockedBackends} regionBlocked={regionBlocked} onBack={() => setActiveSection('main')} t={t} isOnline={isOnline} pendingMessages={0} isDark={theme === 'dark'} />
          </Suspense>
        );
      case 'connection':
        return (
          <Suspense fallback={fallback}>
            <ConnectionSettings t={t} onBack={() => setActiveSection('main')} isDark={theme === 'dark'} />
          </Suspense>
        );
      case 'notifications':
        return (
          <Suspense fallback={fallback}>
            <NotificationsSection onBack={() => setActiveSection('main')} t={t} isDark={theme === 'dark'}
              notificationsEnabled={notificationsEnabled} setNotificationsEnabled={setNotificationsEnabled}
              soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled}
              dndEnabled={dndEnabled} setDndEnabled={setDndEnabled}
              dndFrom={dndFrom} setDndFrom={setDndFrom}
              dndTo={dndTo} setDndTo={setDndTo}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  const renderMainSettings = () => (
    <motion.div key="main-settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex-1 flex flex-col items-center">
      <div className="w-full px-2 md:px-4 flex flex-col gap-3">
        <div className="w-full shrink-0">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]`} />
            <input
              placeholder={t('settings.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-4 py-2 rounded-md border text-sm focus:outline-none transition-colors ${
                'bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-emerald-500/50'
              }`}
              type="text"
            />
          </div>
        </div>

        <div className="w-full flex-1 overflow-y-auto pr-1 pb-2 flex flex-col gap-1.5">
          {filteredSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full rounded-md px-2.5 py-2 text-left transition-all ${
                  'bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={18} className={`shrink-0 text-[var(--accent)]`} />
                  <div className="flex-1 min-w-0 text-left">
                    <div className={`text-[13px] font-semibold text-[var(--text-primary)] leading-tight`}>{section.label}</div>
                    {section.subtitle && <div className={`text-[10px] text-[var(--text-tertiary)] leading-tight`}>{section.subtitle}</div>}
                  </div>
                  <ChevronRight size={14} className={`shrink-0 opacity-30 text-[var(--text-tertiary)]`} />
                </div>
              </button>
            );
          })}
          {filteredSections.length === 0 && (
            <div className={`text-center py-4 text-sm text-[var(--text-tertiary)]`}>No results found</div>
          )}
          <div className="flex justify-center pt-4 pb-2">
            <span className="text-[10px] font-mono tracking-widest opacity-40 uppercase text-[var(--text-tertiary)] flex items-center gap-1">
              <Smartphone size={12} />
              {t('settings.lastBuild')}: 31.05.2026, 11:43
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`w-full flex-1 flex flex-col items-center p-4 md:p-5 overflow-y-auto bg-[var(--bg-primary)] border border-[var(--border-color)]`}>
      <AnimatePresence mode="wait">
        {activeSection === 'main' && renderMainSettings()}
        {activeSection === 'appearance' && (
          <div className="w-full max-w-3xl flex flex-col flex-1 min-h-0">
            <Suspense fallback={fallback}>
              <AppearanceSettings
                theme={theme} setTheme={setTheme || (() => {})} isDark={theme === 'dark'}
                fontSize={fontSize} setFontSize={setFontSize} uiAnimations={uiAnimations} setUiAnimations={setUiAnimations}
                showPwaBanner={showPwaBanner} setShowPwaBanner={setShowPwaBanner}
                onBack={() => setActiveSection('main')}
              />
            </Suspense>
          </div>
        )}
        {activeSection === 'language' && (
          <div className="w-full max-w-3xl flex flex-col flex-1 min-h-0">
            <Suspense fallback={fallback}>
              <LanguageSection
                language={language} setLanguage={setLanguage} setLang={setLang} isDark={theme === 'dark'}
                onBack={() => setActiveSection('main')} t={t}
              />
            </Suspense>
          </div>
        )}
        {activeSection === 'myProfile' && (
          <div className="w-full max-w-3xl flex flex-col flex-1 min-h-0">
            <Suspense fallback={fallback}>
              <MyProfileSection onBack={() => setActiveSection('main')} t={t} />
            </Suspense>
          </div>
        )}
        {activeSection === 'account' && (
          <div className="w-full max-w-3xl flex flex-col flex-1 min-h-0">
            <Suspense fallback={fallback}>
              <AccountSection onBack={() => setActiveSection('main')} t={t} isDark={theme === 'dark'} />
            </Suspense>
          </div>
        )}
        {activeSection === 'security' && renderSection('security')}
        {activeSection === 'privacy' && renderSection('privacy')}
        {activeSection === 'network' && renderSection('network')}
        {activeSection === 'storage' && renderSection('storage')}
        {activeSection === 'bots' && renderSection('bots')}
        {activeSection === 'systemStatus' && renderSection('systemStatus')}
        {activeSection === 'connection' && renderSection('connection')}
        {activeSection === 'notifications' && renderSection('notifications')}
      </AnimatePresence>
    </div>
  );
};

export const SettingsView = React.memo(SettingsViewInner);
