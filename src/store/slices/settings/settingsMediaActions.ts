import type { SettingsSlice } from '../settingsSlice';
import { persistSetting } from './settingsPersist';

export const createMediaActions = (set: any): Pick<SettingsSlice,
  | 'setSaveAudioRecordings'
  | 'setSaveVideoRecordings'
  | 'setAutoRecordCalls'
  | 'setRecordingsRetentionDays'
> => ({
  setSaveAudioRecordings: (enabled) => {
    set({ saveAudioRecordings: enabled });
    persistSetting('saveAudioRecordings', enabled);
  },
  setSaveVideoRecordings: (enabled) => {
    set({ saveVideoRecordings: enabled });
    persistSetting('saveVideoRecordings', enabled);
  },
  setAutoRecordCalls: (enabled) => {
    set({ autoRecordCalls: enabled });
    persistSetting('autoRecordCalls', enabled);
  },
  setRecordingsRetentionDays: (days) => {
    set({ recordingsRetentionDays: days });
    persistSetting('recordingsRetentionDays', days);
  },
});