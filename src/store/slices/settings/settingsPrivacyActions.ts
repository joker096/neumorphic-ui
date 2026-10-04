import type { SettingsSlice } from '../settingsSlice';
import { persistSetting } from './settingsPersist';

export const createPrivacyActions = (set: any): Pick<SettingsSlice,
  | 'setNotifications'
  | 'setSpamFilter'
  | 'setMediaAutoLoad'
  | 'setOnlineStatus'
  | 'setDraftsEnabled'
  | 'setOfflineMode'
> => ({
  setNotifications: (v) => {
    set({ notifications: v });
    persistSetting('notifications', v);
  },
  setSpamFilter: (v) => {
    set({ spamFilter: v });
    persistSetting('spamFilter', v);
  },
  setMediaAutoLoad: (v) => {
    set({ mediaAutoLoad: v });
    persistSetting('mediaAutoLoad', v);
  },
  setOnlineStatus: (status) => {
    set({ onlineStatus: status, isOnline: status });
    persistSetting('onlineStatus', status);
  },
  setDraftsEnabled: (enabled) => { set({ draftsEnabled: enabled }); persistSetting('draftsEnabled', enabled); },
  setOfflineMode: (enabled) => { set({ offlineMode: enabled }); persistSetting('offlineMode', enabled); },
});