import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const cache = new Map<string, Record<string, any>>();

async function loadLocale(lang: string): Promise<Record<string, any>> {
  if (cache.has(lang)) return cache.get(lang)!;
  
  try {
    const mod = await import(`../locales/${lang}.json`);
    const data = mod.default || mod;
    cache.set(lang, data);
    return data;
  } catch {
    console.warn(`Failed to load locale: ${lang}`);
    return {};
  }
}

export async function preloadLocales() {
  await Promise.all([
    loadLocale('en'),
    loadLocale('ru'),
    loadLocale('de'),
    loadLocale('es'),
    loadLocale('fr'),
    loadLocale('zh'),
    loadLocale('ja'),
    loadLocale('ko'),
  ]);
}

export function getTranslation(key: string, lang: string): string {
  const cached = cache.get(lang);
  if (!cached) return key;
  
  return key.split('.').reduce((obj: any, k: string) => obj?.[k], cached) as string || key;
}

export function getTranslationWithFallback(key: string, lang: string): string {
  const translated = getTranslation(key, lang);
  if (translated !== key) return translated;
  
  const enCached = cache.get('en');
  if (enCached) {
    const enTranslated = key.split('.').reduce((obj: any, k: string) => enCached?.[k], enCached) as string;
    if (enTranslated) return enTranslated;
  }
  
  return key;
}

interface I18nContextValue {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string, args?: Record<string, string | number>) => string;
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
    loadLocale(newLang);
  }, []);
  
  const t = useCallback((key: string, args?: Record<string, string | number>) => {
    let text = getTranslationWithFallback(key, lang);
    if (args) {
      for (const [k, v] of Object.entries(args)) {
        text = text.replace(`{${k}}`, String(v));
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