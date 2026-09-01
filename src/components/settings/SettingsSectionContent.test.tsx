import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsSectionContent } from './SettingsSectionContent';
import { SettingsMainMenu } from './SettingsMainMenu';
import { CallsSection } from './CallsSection';

let activeSection = 'main';

vi.mock('./useSettingsSectionData', () => ({
  useSettingsSectionData: () => ({
    t: (key: string, fallback?: any) => (typeof fallback === 'string' ? fallback : key),
    setLang: vi.fn(),
    lang: 'en',
    searchQuery: 'q',
    setSearchQuery: vi.fn(),
    activeSection,
    setActiveSection: vi.fn(),
    notificationsEnabled: false,
    setNotificationsEnabled: vi.fn(),
    soundEnabled: false,
    setSoundEnabled: vi.fn(),
    proxyEnabled: false,
    setProxyEnabled: vi.fn(),
    spamFilterEnabled: false,
    setSpamFilterEnabled: vi.fn(),
    showPwaBanner: false,
    setShowPwaBanner: vi.fn(),
    mediaAutoLoad: false,
    setMediaAutoLoad: vi.fn(),
    selfDestructDefault: false,
    setSelfDestructDefault: vi.fn(),
    obfuscationEnabled: false,
    setObfuscationEnabled: vi.fn(),
    proxyUrl: '',
    setProxyUrl: vi.fn(),
    torBridge: false,
    setTorBridge: vi.fn(),
    relayBackend: 'relay-1',
    setRelayBackend: vi.fn(),
    autoReconnectEnabled: true,
    setAutoReconnectEnabled: vi.fn(),
    p2pMeshEnabled: true,
    setP2pMeshEnabled: vi.fn(),
    visNumber: false,
    setVisNumber: vi.fn(),
    visActivity: false,
    setVisActivity: vi.fn(),
    uiAnimations: true,
    setUiAnimations: vi.fn(),
    themeMode: 'system',
    setThemeMode: vi.fn(),
    accentColor: '#6366f1',
    setAccentColor: vi.fn(),
    chatBackground: '',
    setChatBackground: vi.fn(),
    density: 'comfortable',
    setDensity: vi.fn(),
    messageRadius: 12,
    setMessageRadius: vi.fn(),
    animationIntensity: 'medium',
    setAnimationIntensity: vi.fn(),
    profilePhotoVisibility: 'contacts',
    setProfilePhotoVisibility: vi.fn(),
    callsVisibility: 'contacts',
    setCallsVisibility: vi.fn(),
    messagesFrom: 'everyone',
    setMessagesFrom: vi.fn(),
    dndEnabled: false,
    setDndEnabled: vi.fn(),
    dndFrom: '22:00',
    setDndFrom: vi.fn(),
    dndTo: '08:00',
    setDndTo: vi.fn(),
    priorityContacts: [],
    setPriorityContacts: vi.fn(),
    stealthMode: false,
    anonymousMode: false,
    readReceipts: true,
    deliveryReceipts: true,
    typingIndicators: true,
    ghostViewMode: false,
    forwardAnonymization: false,
    onlineStatus: true,
    allowForwarding: true,
    allowMetadata: true,
    forwardCountLimit: 10,
    cloudSync: { enabled: false, status: 'idle', pendingChanges: 0, lastSync: null },
    setCloudSyncEnabled: vi.fn(),
    updateSettings: vi.fn(),
    bots: [],
    setBots: vi.fn(),
    connectionStatus: 'online',
    transportBackend: 'relay-1',
    latencyMs: 12,
    blockedBackends: [],
    regionBlocked: false,
    premiumEntitlement: { premium: false },
  }),
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('./SettingsMainMenu', () => ({
  SettingsMainMenu: vi.fn(() => <div data-testid="section-main" />),
}));
vi.mock('./CompanySettingsView', () => ({
  CompanySettingsView: () => <div data-testid="section-company" />,
}));
vi.mock('./AppearanceSettings', () => ({
  AppearanceSettings: () => <div data-testid="section-appearance" />,
}));
vi.mock('./LanguageSection', () => ({
  LanguageSection: () => <div data-testid="section-language" />,
}));
vi.mock('./PrivacySection', () => ({
  PrivacySection: () => <div data-testid="section-privacy" />,
}));
vi.mock('./ProfileSection', () => ({
  ProfileSection: () => <div data-testid="section-profile" />,
}));
vi.mock('./NetworkSection', () => ({
  NetworkSection: () => <div data-testid="section-network" />,
}));
vi.mock('./DevicesSection', () => ({
  DevicesSection: () => <div data-testid="section-devices" />,
}));
vi.mock('./SecuritySection', () => ({
  SecuritySection: () => <div data-testid="section-security" />,
}));
vi.mock('./BotsSection', () => ({
  BotsSection: () => <div data-testid="section-bots" />,
}));
vi.mock('./SpamSection', () => ({
  SpamSection: () => <div data-testid="section-spam" />,
}));
vi.mock('./SystemStatusSection', () => ({
  SystemStatusSection: () => <div data-testid="section-systemStatus" />,
}));
vi.mock('./CompanyGuideSection', () => ({
  CompanyGuideSection: () => <div data-testid="section-companyGuide" />,
}));
vi.mock('./StorageSection', () => ({
  StorageSection: () => <div data-testid="section-storage" />,
}));
vi.mock('./NotificationsSection', () => ({
  NotificationsSection: () => <div data-testid="section-notifications" />,
}));
vi.mock('./FoldersSection', () => ({
  FoldersSection: () => <div data-testid="section-folders" />,
}));
vi.mock('./BackupExportSection', () => ({
  BackupExportSection: () => <div data-testid="section-backup" />,
}));
vi.mock('./HelpSupportSection', () => ({
  HelpSupportSection: () => <div data-testid="section-help" />,
}));
vi.mock('./PaymentsSection', () => ({
  PaymentsSection: () => <div data-testid="section-payments" />,
}));
vi.mock('./PaymentRequestsSection', () => ({
  PaymentRequestsSection: () => <div data-testid="section-paymentRequests" />,
}));
vi.mock('./CallsSection', () => ({
  CallsSection: vi.fn(() => <div data-testid="section-calls" />),
}));
vi.mock('./PremiumSection', () => ({
  PremiumSection: () => <div data-testid="section-premium" />,
}));

const renderContent = (props: Partial<React.ComponentProps<typeof SettingsSectionContent>> = {}) =>
  render(<SettingsSectionContent theme="light" {...props} />);

beforeEach(() => {
  activeSection = 'main';
  vi.clearAllMocks();
});

describe('SettingsSectionContent', () => {
  it.each([
    ['main', 'section-main'],
    ['profile', 'section-profile'],
    ['appearance', 'section-appearance'],
    ['language', 'section-language'],
    ['security', 'section-security'],
    ['devices', 'section-devices'],
    ['privacy', 'section-privacy'],
    ['network', 'section-network'],
    ['bots', 'section-bots'],
    ['spam', 'section-spam'],
    ['systemStatus', 'section-systemStatus'],
    ['company', 'section-company'],
    ['companyGuide', 'section-companyGuide'],
    ['storage', 'section-storage'],
    ['notifications', 'section-notifications'],
    ['folders', 'section-folders'],
    ['backup', 'section-backup'],
    ['help', 'section-help'],
    ['payments', 'section-payments'],
    ['paymentRequests', 'section-paymentRequests'],
    ['calls', 'section-calls'],
    ['premium', 'section-premium'],
  ])('renders %s section when active', async (section, testId) => {
    activeSection = section;
    renderContent();
    expect(await screen.findByTestId(testId)).toBeInTheDocument();
  });

  it('renders only one section at a time', () => {
    activeSection = 'main';
    renderContent();
    const sections = screen.getAllByTestId(/^section-/);
    expect(sections).toHaveLength(1);
  });

  it('passes isDark derived from theme to main menu', () => {
    activeSection = 'main';
    renderContent({ theme: 'dark' });
    expect((SettingsMainMenu as any).mock.calls[0][0]).toMatchObject({ isDark: true });
  });

  it('passes searchQuery from hook data to main menu', () => {
    activeSection = 'main';
    renderContent();
    expect((SettingsMainMenu as any).mock.calls[0][0]).toMatchObject({ searchQuery: 'q' });
  });

  it('forwards setSubView to calls section', async () => {
    activeSection = 'calls';
    renderContent({ setSubView: vi.fn() });
    await screen.findByTestId('section-calls');
    expect((CallsSection as any).mock.calls[0][0]).toMatchObject({
      setSubView: expect.any(Function),
    });
  });

  it('uses prop language over hook lang', () => {
    activeSection = 'main';
    renderContent({ language: 'de' });
    expect((SettingsMainMenu as any).mock.calls[0][0]).toMatchObject({ language: 'de' });
  });
});