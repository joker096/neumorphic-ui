import { useState, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { STORAGE_KEYS } from "../constants/storage";
import type { Theme } from "../contexts/ThemeContext";

export function useAppSettings() {
  const { t, setLang } = useI18n();

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved === 'dark' || saved === 'light') ? (saved as Theme) : 'dark';
  });
  const setTheme = (t: Theme) => setThemeState(t);
  const isDark = theme === 'dark';

  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en');
  const setLanguage = (l: string) => setLanguageState(l);

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('app_font_size');
    if (saved === 'Small' || saved === 'Medium' || saved === 'Large') return saved;
    return 'Medium';
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.THEME, theme); }, [theme]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.LANGUAGE, language); }, [language]);
  useEffect(() => { localStorage.setItem('app_font_size', fontSize); }, [fontSize]);

  return { theme, setTheme, isDark, language, setLanguage, fontSize, setFontSize, t };
}
