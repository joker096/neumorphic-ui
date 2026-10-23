import type { SettingsSlice } from '../settingsSlice';
import { persistSetting } from './settingsPersist';

export const createAppearanceActions = (set: any): Pick<SettingsSlice,
  | 'setUiAnimations'
  | 'setThemeMode'
  | 'setAccentColor'
  | 'setChatBackground'
  | 'setCustomChatBackground'
  | 'setDensity'
  | 'setMessageRadius'
  | 'setAnimationIntensity'
  | 'setChatWallpaper'
> => ({
  setUiAnimations: (v) => {
    set({ uiAnimations: v });
    persistSetting('uiAnimations', v);
  },
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    persistSetting('themeMode', mode);
  },
  setAccentColor: (color) => {
    set({ accentColor: color });
    persistSetting('accentColor', color);
  },
  setChatBackground: (bg) => {
    set({ chatBackground: bg });
    persistSetting('chatBackground', bg);
  },
  setCustomChatBackground: (dataUrl) => {
    set({ customChatBackground: dataUrl });
    persistSetting('customChatBackground', dataUrl);
  },
  setDensity: (d) => {
    set({ density: d });
    persistSetting('density', d);
  },
  setMessageRadius: (r) => {
    set({ messageRadius: r });
    persistSetting('messageRadius', r);
  },
  setAnimationIntensity: (i) => {
    set({ animationIntensity: i });
    persistSetting('animationIntensity', i);
  },
  setChatWallpaper: (chatId, preset) => {
    set((s: any) => {
      const key = String(chatId);
      const next = { ...(s.chatWallpaper || {}) };
      if (!preset || preset === 'default') delete next[key];
      else next[key] = preset;
      persistSetting('chatWallpaper', next);
      return { chatWallpaper: next };
    });
  },
});