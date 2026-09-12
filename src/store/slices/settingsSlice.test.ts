import { describe, it, expect, beforeEach, vi } from 'vitest';

const PRIVACY_KEY = 'mess_privacy_settings_v2';

const mk = (createSettingsSlice: any) => {
  let state: any = {};
  const set = (partial: any) => {
    const next = typeof partial === 'function' ? partial(state) : partial;
    state = { ...state, ...next };
  };
  const get = () => state;
  const slice = createSettingsSlice(set, get) as any;
  state = { ...slice };
  return { slice, get };
};

describe('settingsSlice', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  it('uses defaults when no stored settings', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice } = mk(createSettingsSlice);
    expect(slice.readReceipts).toBe(true);
    expect(slice.currentLanguage).toBe('en');
    expect(slice.soundVolume).toBe(0.7);
    expect(slice.saveAudioRecordings).toBe(true);
    expect(slice.saveVideoRecordings).toBe(true);
    expect(slice.autoRecordCalls).toBe(true);
  });

  it('loads persisted settings from localStorage', async () => {
    localStorage.setItem(PRIVACY_KEY, JSON.stringify({ readReceipts: false, currentLanguage: 'ru' }));
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice } = mk(createSettingsSlice);
    expect(slice.readReceipts).toBe(false);
    expect(slice.currentLanguage).toBe('ru');
  });

  it('setSoundEnabled updates state and persists', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);
    slice.setSoundEnabled(false);
    expect(get().soundEnabled).toBe(false);
    const stored = JSON.parse(localStorage.getItem(PRIVACY_KEY)!);
    expect(stored.soundEnabled).toBe(false);
  });

  it('lockApp/unlockApp toggle appLocked', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);
    slice.lockApp();
    expect(get().appLocked).toBe(true);
    slice.unlockApp();
    expect(get().appLocked).toBe(false);
  });

  it('setAppLock stores credentials; lockApp controls appLocked', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);
    slice.setAppLock('hash', 'salt');
    expect(get().appLockHashedPIN).toBe('hash');
    expect(get().appLocked).toBe(false); // setAppLock stores credentials only
    slice.lockApp();
    expect(get().appLocked).toBe(true);
    slice.setAppLock('', '');
    expect(get().appLockHashedPIN).toBe('');
    expect(get().appLocked).toBe(false);
  });

  it('updateSettings merges and persists', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);
    slice.updateSettings({ stealthMode: true, readReceipts: false });
    expect(get().stealthMode).toBe(true);
    expect(get().readReceipts).toBe(false);
    const stored = JSON.parse(localStorage.getItem(PRIVACY_KEY)!);
    expect(stored.stealthMode).toBe(true);
  });

  it('setOnlineStatus sets onlineStatus and isOnline together', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);
    slice.setOnlineStatus(false);
    expect(get().onlineStatus).toBe(false);
    expect(get().isOnline).toBe(false);
  });

  it('setAutoRecordCalls updates state and persists', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);
    slice.setAutoRecordCalls(false);
    expect(get().autoRecordCalls).toBe(false);
    const stored = JSON.parse(localStorage.getItem(PRIVACY_KEY)!);
    expect(stored.autoRecordCalls).toBe(false);
  });
});
