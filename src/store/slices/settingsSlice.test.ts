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
    expect(slice.soundVolume).toBe(0.7);
    expect(slice.saveAudioRecordings).toBe(true);
    expect(slice.saveVideoRecordings).toBe(true);
    expect(slice.autoRecordCalls).toBe(true);
  });

  it('loads persisted settings from localStorage', async () => {
    localStorage.setItem(PRIVACY_KEY, JSON.stringify({ readReceipts: false, soundVolume: 0.3 }));
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice } = mk(createSettingsSlice);
    expect(slice.readReceipts).toBe(false);
    expect(slice.soundVolume).toBe(0.3);
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

  it('customChatBackground defaults empty and setter persists', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);
    expect(get().customChatBackground).toBe('');
    slice.setCustomChatBackground('data:image/jpeg;base64,AAAA');
    expect(get().customChatBackground).toBe('data:image/jpeg;base64,AAAA');
    const stored = JSON.parse(localStorage.getItem(PRIVACY_KEY)!);
    expect(stored.customChatBackground).toBe('data:image/jpeg;base64,AAAA');
  });

  it('loads a persisted customChatBackground', async () => {
    localStorage.setItem(PRIVACY_KEY, JSON.stringify({ customChatBackground: 'data:image/jpeg;base64,BBBB' }));
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice } = mk(createSettingsSlice);
    expect(slice.customChatBackground).toBe('data:image/jpeg;base64,BBBB');
  });

  it('persists encrypted keys atomically: no plaintext, ENC:v1: only, fail-closed without key', async () => {
    const { createSettingsSlice } = await import('./settingsSlice');
    const { slice, get } = mk(createSettingsSlice);

    // 1) No session key → save aborted, plaintext never written (fail-closed).
    slice.setTotpSecret('SECRET-NO-KEY');
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(localStorage.getItem(PRIVACY_KEY) || '{}').totpSecret).toBeUndefined();

    // 2) With session key → only the encrypted bundle is stored.
    const { setSessionPersistKey, decryptPersistValue } = await import('../../lib/securePersist');
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
    setSessionPersistKey(key);

    slice.setTotpSecret('SECRET-WITH-KEY');
    const stored = await vi.waitFor(() => {
      const value = JSON.parse(localStorage.getItem(PRIVACY_KEY) || '{}').totpSecret;
      expect(typeof value).toBe('string');
      return value as string;
    });
    expect(stored.startsWith('ENC:v1:')).toBe(true);
    expect(stored).not.toContain('SECRET-WITH-KEY');
    expect(await decryptPersistValue(stored)).toBe('SECRET-WITH-KEY');

    // 3) Hydration (fresh module = boot-time snapshot) restores the decrypted value into state.
    vi.resetModules();
    const { setSessionPersistKey: resetKey } = await import('../../lib/securePersist');
    resetKey(key);
    const { hydrateSecurePrivacyFields } = await import('./settingsSlice');
    const setLocal = vi.fn();
    await hydrateSecurePrivacyFields(get, setLocal);
    expect(setLocal).toHaveBeenCalledWith(expect.objectContaining({ totpSecret: 'SECRET-WITH-KEY' }));
  });
});
