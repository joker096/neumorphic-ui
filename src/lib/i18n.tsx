import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { isSupportedLanguage } from '../constants/i18n';

const cache: Map<string, Record<string, any>> =
  (globalThis as any).__i18nCache ?? ((globalThis as any).__i18nCache = new Map<string, Record<string, any>>());

const localeModules = (import.meta as any).glob('../locales/*.json', { eager: false, import: 'default' }) as Record<string, () => Promise<Record<string, any>>>;

function langKey(lang: string) {
  return `../locales/${lang}.json`;
}

export async function preloadLocales(lang?: string) {
  const target = lang || detectBrowserLanguage();
  const langs = target === 'en' ? ['en'] : [target, 'en'];
  await Promise.all(langs.map((l) => loadLocale(l)));
}

export async function loadLocale(lang: string) {
  const loader = localeModules[langKey(lang)];
  if (!loader) return;
  try {
    const data = await loader();
    cache.set(lang, data);
  } catch {
    // noop
  }
}

function resolveKey(dict: Record<string, any> | undefined, key: string): any {
  if (!dict) return undefined;
  const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], dict);
  return value === undefined ? undefined : value;
}

function getRawTranslation(key: string, lang: string): any {
  const cached = cache.get(lang);
  if (cached) {
    const value = resolveKey(cached, key);
    if (value != null && value !== key) return value;
    if (lang !== 'en') {
      const fallback = resolveKey(cache.get('en'), key);
      if (fallback != null) return fallback;
    }
  } else if (lang !== 'en') {
    loadLocale(lang).catch(() => {});
    loadLocale('en').catch(() => {});
  }
  return key;
}

export function getTranslation(key: string, lang: string): string {
  const raw = getRawTranslation(key, lang);
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const form = (raw as any).other ?? (raw as any)[Object.keys(raw)[0]];
    return typeof form === 'string' ? form : String(form ?? '');
  }
  return typeof raw === 'string' ? raw : String(raw ?? '');
}

export function getTranslationWithFallback(key: string, lang: string): string {
  const translated = getTranslation(key, lang);
  if (translated !== key) return translated;
  return getTranslation(key, 'en');
}

interface I18nContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string, fallback?: string | Record<string, string | number>) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
});

export const useI18n = () => useContext(I18nContext);

export function detectBrowserLanguage(): string {
  try {
    const saved = localStorage.getItem('app_language');
    if (saved) return saved;
    const browserLang = navigator.language?.slice(0, 2);
    if (browserLang && isSupportedLanguage(browserLang)) {
      return browserLang;
    }
  } catch {}
  return 'en';
}

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState(detectBrowserLanguage);
  const [ready, setReady] = useState(false);
  const [dictVersion, setDictVersion] = useState(0);

  useEffect(() => {
    preloadLocales(lang).then(() => setReady(true)).catch(() => setReady(true));
  }, []);

  const setLang = useCallback((newLang: string) => {
    setLangState(newLang);
    localStorage.setItem('app_language', newLang);
    return loadLocale(newLang).finally(() => setDictVersion((v) => v + 1));
  }, []);
  
   const t = useCallback((key: string, fallback?: string | Record<string, string | number>) => {
    const raw = getRawTranslation(key, lang);
    let text: string;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const hasCount = fallback != null && typeof fallback === 'object' && 'count' in (fallback as any);
      const count = hasCount ? Number((fallback as any).count) : 0;
      let cat = 'other';
      if (hasCount) {
        try {
          cat = new Intl.PluralRules(lang).select(Number.isFinite(count) ? count : 0);
        } catch {
          cat = 'other';
        }
      }
      const form = (raw as any)[cat] ?? (raw as any).other ?? (raw as any)[Object.keys(raw)[0]];
      text = typeof form === 'string' ? form : String(form ?? '');
    } else {
      text = typeof raw === 'string' ? raw : String(raw ?? '');
    }
    if (text === key && typeof fallback === 'string') {
      text = fallback;
    }
    if (fallback && typeof fallback === 'object' && Object.keys(fallback).length > 0) {
      text = text.replace(/\{\{(\w+)\}\}/g, '{$1}');
      for (const [k, v] of Object.entries(fallback)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), () => String(v));
      }
    }
    return text;
   }, [lang, ready, dictVersion]);
  
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};