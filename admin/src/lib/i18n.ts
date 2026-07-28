import en from '../locales/en.json';
import ru from '../locales/ru.json';

const locales = {en, ru} as const;
type Locale = keyof typeof locales;

function getNested(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
}

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language?.slice(0, 2);
  return lang === 'ru' ? 'ru' : 'en';
}

let currentLocale: Locale = detectLocale();

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string): string {
  const locale = locales[currentLocale] as unknown as Record<string, unknown>;
  return getNested(locale, key);
}
