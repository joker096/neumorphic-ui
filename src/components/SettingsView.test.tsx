import React from 'react';
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
  })),
}));

vi.mock('../lib/i18n', () => {
  const translations: Record<string, string> = {
    'settings.searchPlaceholder': 'Search settings...',
    'settings.accountSection': 'Account',
    'settings.addAccount': 'Add account',
    'settings.appearanceSection': 'Appearance',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.notificationsSection': 'Notifications',
    'settings.notifications': 'Notifications',
    'settings.sound': 'Sound',
    'settings.privacySecuritySection': 'Privacy & Security',
    'settings.security': 'Security',
    'settings.privacy': 'Privacy',
    'settings.dataStorageSection': 'Data & Storage',
    'settings.dataStorage': 'Data & Storage',
    'settings.servicesSection': 'Services',
    'settings.bots': 'Bots',
    'settings.advancedSection': 'Advanced',
    'settings.network': 'Proxy & Network',
    'settings.spamProtection': 'Spam Protection',
    'settings.systemStatus': 'System Status',
    'settings.cloudSync': 'Cloud Sync',
    'settings.locationSection': 'Location',
    'settings.locationSharing': 'Active shares',
    'settings.photoEditorSection': 'Photo Editor',
    'settings.photoEditor': 'Image Editor',
    'settings.autoSaveEdits': 'Auto-save edits',
    'settings.batteryLevel': 'Battery Level',
    'settings.installBtn': 'Install',
    'settings.installDismiss': 'Not now',
    'settings.appearance': 'Appearance',
    'settings.darkTheme': 'Dark theme',
    'settings.fontSize': 'Font Size',
    'settings.animations': 'Animations',
    'settings.appLockPin': 'App Lock PIN',
    'settings.appLockSubtitle': 'Data encryption (PBKDF2-SHA256)',
    'settings.cloudPasswordTitle': 'Cloud Password (TOTP)',
    'settings.cloudPasswordSubtitle': 'Uses PBKDF2 (600k iterations)',
    'settings.encryptionKeys': 'Encryption Keys',
    'settings.encryptionKeysUpdated': 'Updated just now (WebCrypto)',
    'settings.deadMansSwitch': "Auto-wipe (Dead Man's Switch)",
    'settings.wipeAllData': 'Wipe all data (Wipe)',
    'settings.whoSeesNumber': 'Who sees my number',
    'settings.lastSeen': 'Last activity',
    'settings.blacklist': 'Blacklist',
    'settings.users': 'users',
    'settings.dnd': 'Do not disturb',
    'settings.dndSubtitle': 'Disable notifications on schedule',
    'settings.dndMode': 'DND Mode',
    'settings.dndFrom': 'From',
    'settings.dndTo': 'To',
    'settings.priorityContacts': 'Priority contacts',
    'settings.priorityContactsSubtitle': 'Comma-separated names that bypass DND',
    'settings.advancedPrivacy': 'Advanced privacy',
    'settings.selfDestruct': 'Self-destruct timer',
    'settings.stealthMode': 'Stealth Mode (Time fuzzing)',
    'settings.stealthModeSubtitle': 'Shift timestamps ±5 minutes',
    'settings.anonymousMode': 'Anonymous mode (Traffic via relay)',
    'settings.anonymousModeSubtitle': 'Blocks direct P2P connections to hide IP',
    'settings.deliveryReceipts': 'Delivery receipts',
    'settings.deliveryReceiptsSubtitle': 'Show sent/delivered status for outgoing messages',
    'settings.readReceipts': 'Read receipts',
    'settings.readReceiptsSubtitle': 'Show read status when messages are opened',
    'settings.typingIndicators': 'Typing indicators',
    'settings.typingIndicatorsSubtitle': 'Show when the other side is typing',
    'settings.dataStorageSubtitle': 'Backup, auto-load, cache',
    'settings.clearCache': 'Clear cache',
    'settings.clearAll': 'Clear',
    'settings.exportBackup': 'Export backup',
    'settings.exportBackupSubtitle': 'JSON backup of chats, channels, bots, and settings',
    'settings.exportHtml': 'Export HTML',
    'settings.useProxy': 'Use proxy',
    'settings.obfuscation': 'Traffic obfuscation',
    'settings.p2pFilters': 'P2P filters',
    'settings.p2pFiltersSubtitle': 'Auto-hide known spam nodes',
    'settings.meshNodesNearby': 'Mesh nodes nearby',
    'settings.activeNodes': 'active',
    'settings.dhtConnection': 'DHT connection',
    'settings.dhtStable': 'Stable',
    'settings.localDB': 'Local DB',
    'settings.dbEncrypted': 'Encrypted',
    'settings.enableCloudSync': 'Enable cloud sync',
    'settings.cloudSyncSubtitle': 'Sync chats and settings between devices',
    'settings.networkEnabled': 'Enabled',
    'settings.disabled': 'Disabled',
    'settings.spamActive': 'Filters active',
    'settings.spamDisabled': 'Disabled',
    'settings.systemStatusSubtitle': 'Battery level, circuit breakers',
    'settings.cloudSyncEnabled': 'Enabled',
    'settings.cloudProvider': 'Provider',
    'settings.cloudSyncNow': 'Sync now',
    'settings.cloudStatus': 'Status',
    'settings.cloudError': 'Error',
    'settings.photoEditorSubtitle': 'Crop, draw, text',
    'settings.autoSaveChanges': 'Save changes automatically',
    'settings.lastBuild': 'Last build',
    'settings.turnServer': 'Custom TURN Server',
    'settings.obfuscationDesc': 'WebRTC → WS → MTProto → Fastly',
    'settings.botsTitle': 'Bots & Services',
    'settings.noBots': 'No active bots',
    'settings.botsDescription': 'Bots and third-party integrations will appear here when you add them.',
    'settings.devices': 'Devices',
    'settings.currentDevice': 'Current device',
    'settings.deviceWebBrowser': 'Web browser',
    'settings.deviceAddSubtitle': 'Scan QR code to add new device',
    'settings.devicesConnected': 'devices connected',
    'settings.deviceCurrent': 'Current',
    'common.addDevice': 'Add device',
    'common.delete': 'Delete',
    'settings.removeDevice': 'Remove device',
    'settings.lastSync': 'Last sync',
    'settings.never': 'Never',
    'settings.syncing': 'Syncing...',
    'settings.syncNow': 'Sync now',
    'settings.liveLocations': 'live',
    'settings.staticLocations': 'static',
    'settings.stopLocation': 'Stop',
    'settings.until': 'until',
    'settings.noActiveSharing': 'No active location shares',
    'settings.crop': 'Crop',
    'settings.draw': 'Draw',
    'settings.text': 'Text',
    'settings.imagePreview': 'Image preview area',
    'settings.save': 'Save',
    'settings.reset': 'Reset',
    'settings.tools': 'Tools: crop (drag to select), draw (freehand), text (tap to add), filters',
    'settings.gb': 'GB',
    'settings.mb': 'MB',
    'settings.enterBackupPassword': 'Enter backup password...',
    'settings.importBackupTitle': 'Import Backup',
    'settings.importBackupSubtitle': 'JSON backup restore from local file',
    'settings.forwardAllow': 'Allow message forwarding',
    'settings.forwardAllowSubtitle': 'Control whether others can forward your messages',
    'settings.allowMetadata': 'Allow metadata',
    'settings.allowMetadataSubtitle': 'Include metadata in forwarded messages',
    'settings.forwardLimit': 'Forward limit',
    'settings.receipts': 'Read receipts',
    'settings.receiptsEnable': 'Enable read receipts for all',
    'settings.receiptsEnableSubtitle': 'Show when you have read a message',
    'settings.receiptsOn': 'On',
    'settings.receiptsOff': 'Off',
    'settings.receiptsContactAlice': 'Contact: Alice',
    'settings.receiptsContactBob': 'Contact: Bob',
    'settings.receiptsContactCharlie': 'Contact: Charlie',
    'settings.twoFactorAuth': 'Two-factor auth',
    'settings.encryptBackupPassword': 'Encrypt backup with password',
    'settings.enterNewPin': 'Enter new PIN (leave empty to reset):',
    'settings.confirmWipe': 'Are you sure? This will destroy keys, IndexedDB, Cache, SW and local data.',
    'settings.storageUsage': 'Storage usage',
    'settings.networkUsage': 'Network usage',
    'settings.fontSizeSmall': 'Small',
    'settings.fontSizeMedium': 'Medium',
    'settings.fontSizeLarge': 'Large',
    'settings.visibility.none': 'Nobody',
    'settings.visibility.contacts': 'My contacts',
    'settings.visibility.everyone': 'Everyone',
    'settings.deadMansSwitch6months': '6 months',
    'settings.deadMansSwitch1year': '1 year',
    'settings.deadMansSwitch1month': '1 month',
    'settings.mediaWifi': 'Wi-Fi',
    'settings.mediaWifiNetwork': 'Wi-Fi & Cellular',
    'settings.mediaNever': 'Never',
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
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders main settings view', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByPlaceholderText('Search settings...')).toBeInTheDocument();
  });

  it('shows PWA install banner by default', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText(/Install Mess&Anger/)).toBeInTheDocument();
    expect(screen.getByText(/worksOffline/)).toBeInTheDocument();
  });

it.skip('hides PWA banner when dismissed', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Not now'));
    expect(screen.queryByText(/Install/)).not.toBeInTheDocument();
  });

  it('shows Account section with user info', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Account')).toBeInTheDocument();
    expect(screen.getByText('Joker')).toBeInTheDocument();
    expect(screen.getByText('@joker')).toBeInTheDocument();
    expect(screen.getByText('Add account')).toBeInTheDocument();
  });

  it('shows Appearance section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it.skip('navigates to Appearance sub-view when clicked', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText(/Theme/));

    expect(screen.getByText(/Appearance/)).toBeInTheDocument();
    expect(screen.getByText(/theme|appearance/)).toBeInTheDocument();
  });

  it.skip('navigates to Language sub-view when clicked', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText(/Language/));

    expect(screen.getByText(/Language/)).toBeInTheDocument();
    expect(screen.getByText(/Русский|Russian/)).toBeInTheDocument();
    expect(screen.getByText(/English|Espanol|Deutsch/)).toBeInTheDocument();
  });

  it.skip('shows Notifications section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText(/notification|notifications/)).toBeInTheDocument();
    expect(screen.getByText(/Sound/)).toBeInTheDocument();
  });

  it('shows Privacy & Security section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Privacy & Security')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });

  it.skip('navigates to Security sub-view', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText(/Security/));
    expect(screen.getByText(/Security/)).toBeInTheDocument();
  });

  it.skip('navigates to Privacy sub-view', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText(/Privacy/));
    expect(screen.getByText(/Privacy/)).toBeInTheDocument();
  });

  it.skip('shows Data & Storage section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText(/Data|Storage/)).toBeInTheDocument();
    expect(screen.getByText(/backup|cache/)).toBeInTheDocument();
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

  it('navigates to Network sub-view', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Proxy & Network'));

    expect(screen.getByText('Proxy & Network')).toBeInTheDocument();
  });

   it.skip('shows Cloud Sync section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText(/Cloud Sync|cloud|sync/)).toBeInTheDocument();
  });

  it('shows Location section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Active shares')).toBeInTheDocument();
  });

  it('shows Photo Editor section', () => {
    render(<SettingsView {...defaultProps} />);

    expect(screen.getByText('Photo Editor')).toBeInTheDocument();
    expect(screen.getByText('Image Editor')).toBeInTheDocument();
    expect(screen.getByText('Auto-save edits')).toBeInTheDocument();
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

  it.skip('toggles dark theme when clicked in Appearance', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText('Theme'));
    expect(screen.getByText(/theme|appearance|dark|light/)).toBeInTheDocument();
  });

  it.skip('changes language when selected', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText(/Language/));
    expect(screen.getByText(/English|Espanol|Deutsch/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/English/));

    expect(screen.getByText(/English/).closest('button')).toHaveTextContent(/English/);
  });

  it.skip('navigates back to main from sub-view', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText(/Theme/));
    expect(screen.getByText(/Appearance/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText('Search settings...')).toBeInTheDocument();
  });

  it.skip('shows Battery status in System Status', () => {
    render(<SettingsView {...defaultProps} />);

    fireEvent.click(screen.getByText(/System Status/));

    expect(screen.getByText(/Battery/)).toBeInTheDocument();
  });

  
});