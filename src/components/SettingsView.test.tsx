import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SettingsView } from './SettingsView';
import { useAppStore } from '../store';

vi.mock('../store', () => ({
  useAppStore: vi.fn(() => ({
    stealthMode: false,
    anonymousMode: false,
    readReceipts: true,
    deliveryReceipts: true,
    typingIndicators: true,
    turnServerUrl: '',
    allowForwarding: true,
    allowMetadata: true,
    forwardCountLimit: 3,
    contactReadReceipts: {},
    devices: [{ id: 'current-device', name: 'This Device', platform: 'web', lastActive: Date.now(), isCurrent: true }],
    currentSession: { deviceId: 'current-device', startTime: Date.now(), isActive: true },
    addDevice: vi.fn(),
    removeDevice: vi.fn(),
    updateSettings: vi.fn(),
    toggleContactReadReceipt: vi.fn(),
    polls: [],
    addPoll: vi.fn(),
    removePoll: vi.fn(),
    voteOnPoll: vi.fn(),
    channels: [],
    bots: [],
    archivedChats: [],
    chats: [],
    cloudSync: {
      enabled: false,
      lastSync: null,
      pendingChanges: 0,
      status: 'idle' as const,
      errorMessage: null,
      provider: 'local' as const,
    },
    setCloudSyncEnabled: vi.fn(),
    updateCloudSyncStatus: vi.fn(),
    triggerCloudSync: vi.fn(),
    locationShares: [],
    addLocationShare: vi.fn(),
    removeLocationShare: vi.fn(),
    updateLocationShare: vi.fn(),
    startLiveLocation: vi.fn(),
    stopLiveLocation: vi.fn(),
    photoEditState: null,
    setPhotoEditState: vi.fn(),
    updatePhotoEditCrop: vi.fn(),
    addPhotoEditDrawing: vi.fn(),
    addPhotoEditText: vi.fn(),
    resetPhotoEditor: vi.fn(),
    activeCall: null,
    setActiveCall: vi.fn(),
    soundEnabled: false,
    setSoundEnabled: vi.fn(),
  })),
}));

vi.mock('../lib/i18n', () => {
  const translations: Record<string, string> = {
    'settings.searchPlaceholder': 'Search settings...',
    'settings.accountSection': 'Account',
    'settings.addAccount': 'Add account',
    'settings.appearance': 'Appearance',
    'settings.appearanceSection': 'Appearance',
    'settings.appearanceDescription': 'Theme, text size, animations, and PWA prompt',
    'settings.theme': 'Theme',
    'settings.darkTheme': 'Dark theme',
    'settings.darkThemeSubtitle': 'Switch between light and dark mode',
    'settings.language': 'Language',
    'settings.appearanceTheme': 'Dark Theme',
    'settings.fontSize': 'Font Size',
    'settings.fontSizeSubtitle': 'Small, medium, or large interface text',
    'settings.fontSizeSmall': 'Small',
    'settings.fontSizeMedium': 'Medium',
    'settings.fontSizeLarge': 'Large',
    'settings.animations': 'Animations',
    'settings.animationsSubtitle': 'Enable motion effects and spring transitions',
    'settings.pwaPrompt': 'PWA install prompt',
    'settings.pwaPromptSubtitle': 'Show install banner on supported browsers',
    'settings.installBtn': 'Install',
    'settings.installDismiss': 'Not now',
    'settings.quickOptions': 'Quick options',
    'settings.notifications': 'Notifications',
    'settings.notificationsSection': 'Notifications section',
    'settings.notificationsOption': 'Message notifications',
    'settings.notificationsSubtitle': 'Message notifications',
    'settings.sound': 'Sound',
    'settings.soundOption': 'Notification sound',
    'settings.privacySecuritySection': 'Privacy & Security',
    'settings.security': 'Security',
    'settings.securitySubtitle': '2FA, encryption, key management',
    'settings.privacy': 'Privacy',
    'settings.privacySubtitle': 'Last activity, blocks',
    'settings.dataStorageSection': 'Data & Storage',
    'settings.dataStorage': 'Data & Storage',
    'settings.dataStorageSubtitle': 'Backup, auto-load, cache',
    'settings.servicesSection': 'Services',
    'settings.bots': 'Bots',
    'settings.botsSubtitle': 'Manage bots and integrations',
    'settings.advancedSection': 'Advanced',
    'settings.network': 'Proxy & Network',
    'settings.spamProtection': 'Spam Protection',
    'settings.systemStatus': 'System Status',
    'settings.systemStatusSubtitle': 'Battery level, circuit breakers',
    'settings.cloudSync': 'Cloud Sync',
    'settings.cloudSyncSubtitle': 'Sync chats and settings between devices',
    'settings.cloudSyncEnabled': 'Enabled',
    'settings.cloudProvider': 'Provider',
    'settings.cloudSyncNow': 'Sync now',
    'settings.cloudStatus': 'Status',
    'settings.cloudError': 'Error',
    'settings.locationSection': 'Location',
    'settings.locationSharing': 'Active shares',
    'settings.cloudSyncOption': 'Cloud sync',
    'settings.appLockPin': 'App Lock PIN',
    'settings.appLockSubtitle': 'Data encryption (PBKDF2-SHA256)',
    'settings.cloudPasswordTitle': 'Cloud Password (TOTP)',
    'settings.cloudPasswordSubtitle': 'Uses PBKDF2 (600k iterations)',
    'settings.encryptionKeys': 'Encryption Keys',
    'settings.encryptionKeysUpdated': 'Updated just now (WebCrypto)',
    'settings.deadMansSwitch': "Auto-wipe (Dead Man's Switch)",
    'settings.wipeAllData': 'Wipe all data',
    'settings.whoSeesNumber': 'Who sees my number',
    'settings.lastSeen': 'Last seen',
    'settings.blacklist': 'Blacklist',
    'settings.dnd': 'Do not disturb',
    'settings.dndSubtitle': 'Disable notifications on schedule',
    'settings.dndMode': 'DND Mode',
    'settings.dndFrom': 'From',
    'settings.dndTo': 'To',
    'settings.priorityContacts': 'Priority contacts',
    'settings.advancedPrivacy': 'Advanced privacy',
    'settings.selfDestruct': 'Self-destruct timer',
    'settings.stealthMode': 'Stealth Mode (time obfuscation)',
    'settings.stealthModeSubtitle': 'Shift timestamps ±5 minutes',
    'settings.anonymousMode': 'Anonymous mode',
    'settings.anonymousModeSubtitle': 'Blocks direct P2P connections',
    'settings.forwardAllow': 'Allow forwarding',
    'settings.forwardAllowSubtitle': 'Control if others can forward',
    'settings.forwardLimit': 'Forward limit',
    'settings.encryptBackupPassword': 'Encrypt backup',
    'settings.exportBackup': 'Export backup',
    'settings.exportBackupSubtitle': 'JSON backup of chats, channels, bots',
    'settings.exportHtml': 'Export HTML',
    'settings.forwardPrivacy': 'Forward Privacy',
    'settings.importBackup.title': 'Import backup',
    'settings.imagePreview': 'Image preview',
    'settings.p2pFilters': 'P2P filters',
    'settings.p2pFiltersSubtitle': 'Auto-hide spam nodes',
    'settings.meshNodesNearby': 'Mesh nodes nearby',
    'settings.activeNodes': 'Active nodes',
    'settings.dhtConnection': 'DHT connection',
    'settings.dhtStable': 'Stable',
    'settings.localDB': 'Local DB',
    'settings.dbEncrypted': 'Encrypted',
    'settings.enableCloudSync': 'Enable cloud sync',
    'settings.networkEnabled': 'Enabled',
    'settings.disabled': 'Disabled',
    'settings.spamActive': 'Active',
    'settings.spamDisabled': 'Disabled',
    'settings.photoEditorSubtitle': 'Crop, draw, text',
    'settings.autoSaveChanges': 'Auto-save changes',
    'settings.lastBuild': 'Last build',
    'settings.turnServer': 'TURN server',
    'settings.botsTitle': 'Bots & Services',
    'settings.noBots': 'No active bots',
    'settings.deviceAddSubtitle': 'Scan QR to add device',
    'settings.devicesConnected': 'Devices connected',
    'settings.deviceCurrent': 'Current',
    'settings.confirmWipe': 'Are you sure you want to wipe all data?',
    'settings.storageUsage': 'Storage usage',
    'settings.networkUsage': 'Network usage',
    'settings.recoveryPhrase': 'Recovery phrase',
    'settings.recoveryPhraseSubtitle': 'Generate backup recovery phrase',
    'settings.recoveryPhraseWriteDown': 'Write this down and store it safely',
    'settings.pinPrompt': 'Enter new PIN (empty to reset):',
    'settings.restore': 'Restore',
    'settings.cancel': 'Cancel',
    'settings.settings': 'Settings',
    'lang.ru': 'Русский',
    'lang.en': 'English',
    'lang.es': 'Español',
    'lang.de': 'Deutsch',
    'chat.chatLabel': 'Chat:',
  };
  return {
    useI18n: () => ({
      t: (key: string) => translations[key] || key,
      lang: 'en',
      setLang: vi.fn(),
    }),
    I18nProvider: ({ children }: { children: React.ReactNode }) => children,
    I18nContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
    detectBrowserLanguage: () => 'en',
  };
});

vi.mock('../lib/cryptoCore', () => ({
  cryptoCore: {
    hashAppLockPIN: vi.fn().mockResolvedValue({ hash: 'hashed', saltHex: 'salt' }),
  },
}));

const defaultProps = {
  theme: 'dark' as const,
  setTheme: vi.fn(),
};

describe('SettingsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders main settings view', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search settings...')).toBeInTheDocument();
  });

  it('shows PWA install banner by default', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText((content, element) => {
      return element?.tagName === 'BUTTON' && content.includes('Install');
    })).toBeInTheDocument();
  });

  it('shows grouped Account section with user info', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Joker')).toBeInTheDocument();
    expect(screen.getByText('@joker')).toBeInTheDocument();
    expect(screen.getByText('Add account')).toBeInTheDocument();
  });

  it('shows Appearance section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
  });

  it('navigates to Appearance sub-view when theme row clicked', async () => {
    render(<SettingsView {...defaultProps} />);

    const themeRow = screen.getByText('Theme').closest('button')!;
    fireEvent.click(themeRow);

    await waitFor(() => {
      expect(screen.getByText('Dark theme')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('shows quick options on the main settings screen', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Quick options')).toBeInTheDocument();
    expect(screen.getByText('Notification sound')).toBeInTheDocument();
    expect(screen.getByText('Cloud sync')).toBeInTheDocument();
  });

  it('shows Notifications section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Notifications section')).toBeInTheDocument();
    expect(screen.getByText('Notification sound')).toBeInTheDocument();
  });

  it('shows Privacy & Security section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it('navigates to Security sub-view', async () => {
    render(<SettingsView {...defaultProps} />);

    const securityRow = screen.getByText('Security').closest('button')!;
    fireEvent.click(securityRow);
    await waitFor(() => {
      expect(screen.getByText('App Lock PIN')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('shows Services section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Bots')).toBeInTheDocument();
  });

  it('shows Advanced section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Advanced')).toBeInTheDocument();
    expect(screen.getByText('Proxy & Network')).toBeInTheDocument();
    expect(screen.getByText('Spam Protection')).toBeInTheDocument();
    expect(screen.getByText('System Status')).toBeInTheDocument();
  });

  it('navigates to Network sub-view', async () => {
    render(<SettingsView {...defaultProps} />);

    const networkRow = screen.getByText('Proxy & Network').closest('button')!;
    fireEvent.click(networkRow);
    await waitFor(() => {
      expect(screen.getByText('Proxy & Network')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  it('shows Location section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Active shares')).toBeInTheDocument();
  });

  it('shows build status footer', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText(/Last build|build|last build/)).toBeInTheDocument();
  });

  it('applies dark theme styles', () => {
    render(<SettingsView {...defaultProps} />);

    const container = screen.getByPlaceholderText('Search settings...').closest('div[class*="bg-[#11141c]"]');
    expect(container).toBeInTheDocument();
  });

  it('applies light theme styles', () => {
    const lightProps = { ...defaultProps, theme: 'light' as const };
    render(<SettingsView {...lightProps} />);

    const container = screen.getByPlaceholderText('Search settings...').closest('div[class*="bg-[#eaeff4]"]');
    expect(container).toBeInTheDocument();
  });
});
