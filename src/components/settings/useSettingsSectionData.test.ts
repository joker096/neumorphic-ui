import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettingsSectionData } from './useSettingsSectionData';

let state: any;

vi.mock('../../store', () => ({
  useAppStore: (selector?: any) => (selector ? selector(state) : state),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key, setLang: vi.fn(), lang: 'en' }),
}));

const mkState = () => ({
  notifications: false, setNotifications: vi.fn(),
  soundEnabled: false, setSoundEnabled: vi.fn(),
  twoFactor: false, setTwoFactor: vi.fn(),
  proxyEnabled: false, setProxyEnabled: vi.fn(),
  spamFilter: true, setSpamFilter: vi.fn(),
  pwaBanner: false, setPwaBanner: vi.fn(),
  deadMansSwitch: false, setDeadMansSwitch: vi.fn(),
  mediaAutoLoad: false, setMediaAutoLoad: vi.fn(),
  selfDestructDefault: true, setSelfDestructDefault: vi.fn(),
  obfuscationMode: 'default', setObfuscationMode: vi.fn(),
  obfuscationEnabled: false, setObfuscationEnabled: vi.fn(),
  proxyUrl: '', setProxyUrl: vi.fn(),
  torBridge: false, setTorBridge: vi.fn(),
  relayBackend: 'relay-1', setRelayBackend: vi.fn(),
  autoReconnect: true, setAutoReconnect: vi.fn(),
  p2pMesh: true, setP2pMesh: vi.fn(),
  visNumber: false, setVisNumber: vi.fn(),
  visActivity: false, setVisActivity: vi.fn(),
  uiAnimations: true, setUiAnimations: vi.fn(),
  themeMode: 'system', setThemeMode: vi.fn(),
  accentColor: '#6366f1', setAccentColor: vi.fn(),
  chatBackground: '', setChatBackground: vi.fn(),
  customChatBackground: '', setCustomChatBackground: vi.fn(),
  density: 'comfortable', setDensity: vi.fn(),
  messageRadius: 12, setMessageRadius: vi.fn(),
  animationIntensity: 'medium', setAnimationIntensity: vi.fn(),
  profilePhotoVisibility: 'contacts', setProfilePhotoVisibility: vi.fn(),
  callsVisibility: 'contacts', setCallsVisibility: vi.fn(),
  messagesFrom: 'everyone', setMessagesFrom: vi.fn(),
  dndEnabled: false, setDndEnabled: vi.fn(),
  dndFrom: '22:00', setDndFrom: vi.fn(),
  dndTo: '08:00', setDndTo: vi.fn(),
  priorityContacts: [], setPriorityContacts: vi.fn(),
  saveAudioRecordings: true, setSaveAudioRecordings: vi.fn(),
  saveVideoRecordings: true, setSaveVideoRecordings: vi.fn(),
  recordingsRetentionDays: 30, setRecordingsRetentionDays: vi.fn(),
  premiumEntitlement: { premium: false },
  stealthMode: false, readReceipts: true,
  deliveryReceipts: true, typingIndicators: true,
  turnServerUrl: '', turnServerUser: '', turnServerPass: '',
  forwardAnonymization: false,
  soundVolume: 1, setSoundVolume: vi.fn(),
  onlineStatus: true, ghostViewMode: false,
  devices: [], currentSession: null,
  cloudSync: { enabled: false, status: 'idle', pendingChanges: 0, lastSync: null },
  locationShares: [],
  addDevice: vi.fn(), removeDevice: vi.fn(),
  updateSettings: vi.fn(),
  setCloudSyncEnabled: vi.fn(), triggerCloudSync: vi.fn(),
  stopLiveLocation: vi.fn(), removeLocationShare: vi.fn(),
  bots: [], setBots: vi.fn(),
  connectionStatus: 'online', transportBackend: 'relay-1', latencyMs: 12,
  blockedBackends: [], regionBlocked: false,
});

beforeEach(() => {
  state = mkState();
});

describe('useSettingsSectionData', () => {
  it('returns i18n and store-backed values', () => {
    const { result } = renderHook(() => useSettingsSectionData());
    expect(result.current.t('settings.theme')).toBe('settings.theme');
    expect(result.current.lang).toBe('en');
    expect(result.current.notificationsEnabled).toBe(false);
    expect(result.current.soundEnabled).toBe(false);
    expect(result.current.spamFilterEnabled).toBe(true);
    expect(result.current.proxyEnabled).toBe(false);
    expect(result.current.premiumEntitlement.premium).toBe(false);
  });

  it('starts with empty search query and updates it', () => {
    const { result } = renderHook(() => useSettingsSectionData());
    expect(result.current.searchQuery).toBe('');
    act(() => result.current.setSearchQuery('radar'));
    expect(result.current.searchQuery).toBe('radar');
  });

  it('starts at main section and updates active section', () => {
    const { result } = renderHook(() => useSettingsSectionData());
    expect(result.current.activeSection).toBe('main');
    act(() => result.current.setActiveSection('network'));
    expect(result.current.activeSection).toBe('network');
  });

  it('delegates setters to store actions', () => {
    const { result } = renderHook(() => useSettingsSectionData());
    act(() => result.current.setNotificationsEnabled(true));
    expect(state.setNotifications).toHaveBeenCalledWith(true);
    act(() => result.current.setSoundEnabled(true));
    expect(state.setSoundEnabled).toHaveBeenCalledWith(true);
    act(() => result.current.setProxyEnabled(true));
    expect(state.setProxyEnabled).toHaveBeenCalledWith(true);
    act(() => result.current.setSpamFilterEnabled(false));
    expect(state.setSpamFilter).toHaveBeenCalledWith(false);
    act(() => result.current.setCloudSyncEnabled(true));
    expect(state.setCloudSyncEnabled).toHaveBeenCalledWith(true);
  });

  it('exposes updateSettings and triggers store update', () => {
    const { result } = renderHook(() => useSettingsSectionData());
    act(() => result.current.updateSettings({ stealthMode: true }));
    expect(state.updateSettings).toHaveBeenCalledWith({ stealthMode: true });
  });

  it('exposes custom chat background value and setter', () => {
    const { result } = renderHook(() => useSettingsSectionData());
    expect(result.current.customChatBackground).toBe('');
    act(() => result.current.setCustomChatBackground('data:image/jpeg;base64,AAAA'));
    expect(state.setCustomChatBackground).toHaveBeenCalledWith('data:image/jpeg;base64,AAAA');
  });
});