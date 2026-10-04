import type { SettingsSlice } from '../settingsSlice';
import { persistSetting } from './settingsPersist';

export const createChatActions = (set: any): Pick<SettingsSlice,
  | 'setSelfDestructDefault'
  | 'setChatSelfDestruct'
  | 'setDndEnabled'
  | 'setDndFrom'
  | 'setDndTo'
  | 'setPriorityContacts'
> => ({
  setSelfDestructDefault: (v) => {
    set({ selfDestructDefault: v });
    persistSetting('selfDestructDefault', v);
  },
  setChatSelfDestruct: (chatId, timer) => {
    // No `persistSetting` call — per-chat timers are session-scoped by design.
    set((s) => ({ chatSelfDestruct: { ...s.chatSelfDestruct, [String(chatId)]: timer ?? "Off" } }));
  },
  setDndEnabled: (v) => {
    set({ dndEnabled: v });
    persistSetting('dndEnabled', v);
  },
  setDndFrom: (v) => {
    set({ dndFrom: v });
    persistSetting('dndFrom', v);
  },
  setDndTo: (v) => {
    set({ dndTo: v });
    persistSetting('dndTo', v);
  },
  setPriorityContacts: (v) => {
    set({ priorityContacts: v });
    persistSetting('priorityContacts', v);
  },
});