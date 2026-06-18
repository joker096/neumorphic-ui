import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

const cache = new Map<string, Record<string, any>>()

async function loadLocale(lang: string): Promise<Record<string, any>> {
  if (cache.has(lang)) return cache.get(lang)!
  
  try {
    const mod = await import(`../locales/${lang}.json`)
    const data = mod.default || mod
    cache.set(lang, data)
    return data
  } catch {
    console.warn(`Failed to load locale: ${lang}`)
    return {}
  }
}

export async function preloadLocales() {
  await Promise.all([
    loadLocale('en'),
    loadLocale('ru'),
  ])
}

export function getTranslation(key: string, lang: string): string {
  const cached = cache.get(lang)
  if (!cached) return key
  
  return key.split('.').reduce((obj: any, k: string) => obj?.[k], cached) as string || key
}

export function getTranslationWithFallback(key: string, lang: string): string {
  const translated = getTranslation(key, lang)
  if (translated !== key) return translated
  return getTranslation(key, 'en')
}

interface I18nContextValue {
  lang: string
  setLang: (lang: string) => void
  t: (key: string, args?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
})

export const useAdminI18n = () => useContext(I18nContext)

export function detectBrowserLanguage(): string {
  try {
    const saved = localStorage.getItem('admin_language')
    if (saved) return saved
    const browserLang = navigator.language?.slice(0, 2)
    if (browserLang && ['en', 'ru'].includes(browserLang)) {
      return browserLang
    }
  } catch {}
  return 'en'
}

export const AdminI18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState(detectBrowserLanguage)
  
  const setLang = useCallback((newLang: string) => {
    setLangState(newLang)
    localStorage.setItem('admin_language', newLang)
    loadLocale(newLang)
  }, [])
  
  const t = useCallback((key: string, args?: Record<string, string | number>) => {
    let text = getTranslationWithFallback(key, lang)
    if (args && Object.keys(args).length > 0) {
      for (const [k, v] of Object.entries(args)) {
        text = text.replace(`{${k}}`, () => String(v))
      }
    }
    return text
  }, [lang])
  
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}