/** Theme primitives shared by the store, the provider and the dev toggle. */

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'hichat-theme';

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage can be unavailable in private mode — fall through to the OS.
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/** Applies the theme to the document so every token resolves before paint settles. */
export function applyThemeToDocument(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#181A20' : '#2F6BFF');
}
