import type { SettingsSlice } from '../settingsSlice';
import { encryptPersistValue } from '../../../lib/securePersist';
import { ENCRYPTED_KEYS, PRIVACY_STORAGE_KEY, UPDATE_ALLOWLIST } from './settingsPersist';

export const createUpdateActions = (set: any): Pick<SettingsSlice, 'updateSettings'> => ({
  updateSettings: (settings) => {
    const allowed: Record<string, unknown> = {};
    for (const key of Object.keys(settings)) {
      if (UPDATE_ALLOWLIST.has(key)) allowed[key] = settings[key];
    }
    set((state: any) => ({ ...state, ...allowed }));
    try {
      const prev = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
      const next = { ...prev, ...allowed };
      const toEncrypt = Object.entries(next).filter(
        ([k, v]) => ENCRYPTED_KEYS.has(k) && typeof v === 'string' && v,
      );
      if (toEncrypt.length > 0) {
        // Atomic: encrypt BEFORE the first write; a failure cancels the whole
        // save (fail-closed) — plaintext secrets never touch localStorage.
        (async () => {
          const enc: Record<string, string> = {};
          for (const [k, v] of toEncrypt) {
            try {
              enc[k] = await encryptPersistValue(v as string);
            } catch {
              return;
            }
          }
          const current = JSON.parse(localStorage.getItem(PRIVACY_STORAGE_KEY) || '{}');
          localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify({ ...current, ...allowed, ...enc }));
        })().catch(() => {});
        return;
      }
      localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  },
});