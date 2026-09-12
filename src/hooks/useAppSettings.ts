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

  // Mirror the theme onto <html> so CSS vars resolve outside AppShell
  // (body/html backgrounds, scrollbars) and Tailwind `dark:` variants match.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const language = lang;
  const setLanguage = setLang;

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE);
    if (saved === 'Small' || saved === 'Medium' || saved === 'Large') return saved;
    return 'Medium';
  });

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FONT_SIZE, fontSize); }, [fontSize]);

  // Mirror the font size onto <html> so the `[data-font-size]` custom-property
  // overrides actually reach the `html`/`body` rules that consume
  // `--font-size-base` (inheritance flows down, not up from AppShell's div).
  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);

  return { theme, setTheme, isDark, language, setLanguage, fontSize, setFontSize, t };
}
