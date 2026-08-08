import { useState, useEffect } from "react";
import { useI18n } from "../lib/i18n";
import { STORAGE_KEYS } from "../constants/storage";
import type { Theme } from "../contexts/ThemeContext";

export function useAppSettings() {
  const { t, setLang, lang } = useI18n();

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved === 'dark' || saved === 'light') ? (saved as Theme) : 'dark';
  });
  const setTheme = (t: Theme) => setThemeState(t);
  const isDark = theme === 'dark';

  const language = lang;
  const setLanguage = setLang;

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    if (saved === 'Small' || saved === 'Medium' || saved === 'Large') return saved;
    return 'Medium';
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize); }, [fontSize]);

  return { theme, setTheme, isDark, language, setLanguage, fontSize, setFontSize, t };
}
