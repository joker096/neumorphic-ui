import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const cache: Map<string, Record<string, any>> =
  (globalThis as any).__i18nCache ?? ((globalThis as any).__i18nCache = new Map<string, Record<string, any>>());

const localeModules = (import.meta as any).glob('../locales/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, any>>;

for (const [path, data] of Object.entries(localeModules)) {
  const lang = path.split('/').pop()!.replace('.json', '');
  cache.set(lang, data);
}

export async function preloadLocales() {
  return;
}

function resolveKey(dict: Record<string, any> | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], dict);
  return value == null ? undefined : String(value);
}

export function getTranslation(key: string, lang: string): string {
  const cached = cache.get(lang);
  if (cached) {
    const value = resolveKey(cached, key);
    if (value != null && value !== key) return value;
    if (lang !== 'en') {
      const fallback = resolveKey(cache.get('en'), key);
      if (fallback != null) return fallback;
    }
  }
  return key;
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
    if (browserLang && ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'].includes(browserLang)) {
      return browserLang;
    }
  } catch {}
  return 'en';
}

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState(detectBrowserLanguage);
  
  const setLang = useCallback((newLang: string) => {
    setLangState(newLang);
    localStorage.setItem('app_language', newLang);
  }, []);
  
   const t = useCallback((key: string, fallback?: string | Record<string, string | number>) => {
    let text = getTranslationWithFallback(key, lang);
    if (text === key && typeof fallback === 'string') {
      text = fallback;
    }
    if (fallback && typeof fallback === 'object' && Object.keys(fallback).length > 0) {
      text = text.replace(/\{\{(\w+)\}\}/g, '{$1}');
      for (const [k, v] of Object.entries(fallback)) {
        text = text.replace(`{${k}}`, () => String(v));
      }
    }
    return text;
  }, [lang]);
  
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};