import { useState, useEffect, useCallback, useRef } from "react";
import { useI18n } from "../lib/i18n";
import { STORAGE_KEYS } from "../constants/storage";
import { useAppStore } from "../store";
import type { Theme } from "../contexts/ThemeContext";

type ThemeMode = 'light' | 'dark' | 'system';

function resolveTheme(mode: ThemeMode): Theme {
  if (mode === 'system') {
    try {
      if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch { /* jsdom/no-matchMedia — fall through */ }
    return 'dark';
  }
  return mode;
}

export function useAppSettings() {
  const { t, setLang, lang } = useI18n();
  const themeMode = useAppStore((s) => s.themeMode);

  // Boot with the applied theme when present, otherwise derive from the
  // persisted themeMode. The store is the source of truth for the mode; the
  // applied "theme" is the resolved light/dark value mirrored onto <html>.
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved as Theme;
    return resolveTheme(themeMode as ThemeMode);
  });

  const applyTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, next);
    } catch { /* storage unavailable — in-memory only */ }
  }, []);

  // Re-resolve when the user changes the persisted mode (appearance switcher).
  // Only reacts to an actual mode change — on mount a persisted applied theme
  // (STORAGE_KEYS.THEME) wins over the stored mode.
  const prevMode = useRef(themeMode);
  useEffect(() => {
    if (prevMode.current === themeMode) return;
    prevMode.current = themeMode;
    applyTheme(resolveTheme(themeMode as ThemeMode));
  }, [themeMode, applyTheme]);

  // Live OS appearance tracking while the mode is "system".
  useEffect(() => {
    if (themeMode !== 'system') return;
    let mq: MediaQueryList | null = null;
    try {
      if (typeof window.matchMedia === 'function') {
        mq = window.matchMedia('(prefers-color-scheme: dark)');
      }
    } catch { /* ignore */ }
    if (!mq) return;
    const onChange = () => applyTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', onChange);
    return () => mq?.removeEventListener?.('change', onChange);
  }, [themeMode, applyTheme]);

  const setTheme = (next: Theme) => applyTheme(next);
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