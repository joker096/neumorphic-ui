import { create } from 'zustand';
import { applyThemeToDocument, readStoredTheme, THEME_STORAGE_KEY } from '../theme/tokens';
import type { Theme } from '../theme/tokens';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Persisting the theme is best-effort.
    }
    applyThemeToDocument(theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));
