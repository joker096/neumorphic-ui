import type { SettingsSlice } from '../settingsSlice';
import { persistSetting } from './settingsPersist';

export const createMessagingActions = (set: any): Pick<SettingsSlice,
  'setSoundEnabled' | 'setSoundVolume'
> => ({
  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
    persistSetting('soundEnabled', enabled);
  },
  setSoundVolume: (volume) => {
    set({ soundVolume: volume });
    persistSetting('soundVolume', volume);
  },
});