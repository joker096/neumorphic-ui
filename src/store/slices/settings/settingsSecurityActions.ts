import type { SettingsSlice } from '../settingsSlice';
import { persistSetting } from './settingsPersist';

export const createSecurityActions = (set: any, get: any): Pick<SettingsSlice,
  | 'setTwoFactor'
  | 'setTotpSecret'
  | 'setAppLock'
  | 'setAppLockBiometric'
  | 'setAppLockAutoLock'
  | 'setAppLocked'
  | 'lockApp'
  | 'unlockApp'
> => ({
  setTwoFactor: (v) => {
    set({ twoFactor: v });
    persistSetting('twoFactor', v);
  },
  setTotpSecret: (secret) => {
    set({ totpSecret: secret });
    persistSetting('totpSecret', secret);
  },
  setAppLock: (hash, salt) => {
    set({ appLockHashedPIN: hash, appLockSalt: salt });
    persistSetting('appLockHashedPIN', hash);
    persistSetting('appLockSalt', salt);
    if (!hash && !get().appLockBiometricEnabled) set({ appLocked: false });
  },
  setAppLockBiometric: (enabled, credentialId) => {
    set({ appLockBiometricEnabled: enabled, appLockBiometricCredentialId: credentialId });
    persistSetting('appLockBiometricEnabled', enabled);
    persistSetting('appLockBiometricCredentialId', credentialId);
    if (!enabled && !get().appLockHashedPIN) set({ appLocked: false });
  },
  setAppLockAutoLock: (onBackground, idleSeconds) => {
    set({ appLockAutoLockOnBackground: onBackground, appLockIdleSeconds: idleSeconds });
    persistSetting('appLockAutoLockOnBackground', onBackground);
    persistSetting('appLockIdleSeconds', idleSeconds);
  },
  setAppLocked: (locked) => set({ appLocked: locked }),
  lockApp: () => set({ appLocked: true }),
  unlockApp: () => set({ appLocked: false }),
});