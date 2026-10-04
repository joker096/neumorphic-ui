import type { SettingsSlice } from '../settingsSlice';
import { persistSetting } from './settingsPersist';

export const createNetworkActions = (set: any): Pick<SettingsSlice,
  | 'setObfuscationEnabled'
  | 'setRelayBackend'
  | 'setAutoReconnect'
> => ({
  setObfuscationEnabled: (v) => {
    set({ obfuscationEnabled: v });
    persistSetting('obfuscationEnabled', v);
  },
  setRelayBackend: (v) => {
    set({ relayBackend: v });
    persistSetting('relayBackend', v);
  },
  setAutoReconnect: (v) => {
    set({ autoReconnect: v });
    persistSetting('autoReconnect', v);
  },
});