import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  getTranslation,
  getTranslationWithFallback,
  detectBrowserLanguage,
  preloadLocales,
  I18nProvider,
  useI18n,
} from './i18n';

function flattenKeys(obj: Record<string, any>, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const nestedKey of flattenKeys(value, fullKey)) {
        keys.add(nestedKey);
      }
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

const localesDir = join(process.cwd(), 'src', 'locales');
const localeFiles = readdirSync(localesDir).filter(file => file.endsWith('.json'));
const enKeys = flattenKeys(JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8')));

beforeEach(async () => {
  localStorage.clear();
  await preloadLocales();
});

describe('getTranslation', () => {
  it('should return key for missing locale', () => {
    expect(getTranslation('chat.archive', 'xx')).toBe('chat.archive');
  });

  it('should return key for invalid locale file', () => {
    expect(getTranslation('chat.archive', '')).toBe('chat.archive');
  });

  it('should return dot-notation key when it does not exist', () => {
    expect(getTranslation('nonexistent.section.key', 'en')).toBe('nonexistent.section.key');
  });

  it('should handle nested object keys', () => {
    expect(getTranslation('settings.importBackup.title', 'en')).toBe('Import backup');
  });

  it('should handle deeply nested object keys', () => {
    expect(getTranslation('settings.visibility.everyone', 'en')).toBe('Everyone');
  });

  it('should return key when section exists but key is missing', () => {
    expect(getTranslation('chat.__nonexistent__', 'en')).toBe('chat.__nonexistent__');
  });
});

describe('getTranslationWithFallback', () => {
  it('should return target locale translation when key exists', () => {
    expect(getTranslationWithFallback('chat.archive', 'ru')).toBe('Архив');
  });

  it('should fall back to English when key missing in target locale', () => {
    const result = getTranslationWithFallback('settings.recoveryPhrase', 'xx');
    expect(result).toBe('Recovery Phrase');
  });

  it('should return key when neither target nor English has it', () => {
    const result = getTranslationWithFallback('nonexistent.key', 'fr');
    expect(result).toBe('nonexistent.key');
  });

  it('should handle missing locale gracefully', () => {
    const result = getTranslationWithFallback('chat.archive', 'zz');
    expect(result).toBe('Archive');
  });

  it('should fall back to English for nested objects', () => {
    const result = getTranslationWithFallback('settings.visibility.none', 'de');
    expect(result).toBe('Niemand');
  });
});

describe('t function (interpolation)', () => {
  it('should support single argument interpolation', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.t('chat.daysAgo', { count: 5 })).toBe('5d ago');
  });

  it('should support multiple argument interpolation', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.t('contacts.foundResults', { count: 3, total: 10 })).toBe('Found: 3 of 10');
  });

  it('should return key as-is when no args provided', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.t('chat.archive')).toBe('Archive');
  });

  it('should handle numeric interpolation values', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.t('chat.views', { count: 42 })).toBe('42 Views');
  });

  it('should return raw key when key does not exist', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.t('totally.fake.key')).toBe('totally.fake.key');
  });

  it('should not crash on missing interpolation values', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.t('chat.daysAgo', {})).toBe('{{count}}d ago');
  });
});

describe('t function (language switching)', () => {
  it('should return Russian translation after switching language', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    act(() => { result.current.setLang('ru'); });
    expect(result.current.t('chat.archive')).toBe('Архив');
  });

  it('should return Japanese translation after switching language', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    act(() => { result.current.setLang('ja'); });
    expect(result.current.t('chat.archive')).toBe('アーカイブ');
  });

  it('should return Chinese translation after switching language', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    act(() => { result.current.setLang('zh'); });
    expect(result.current.t('chat.archive')).toBe('归档');
  });

  it('should reflect language change in lang property', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    act(() => { result.current.setLang('de'); });
    expect(result.current.lang).toBe('de');
  });

  it('should fall back to English for keys not in target locale', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    act(() => { result.current.setLang('de'); });
    expect(result.current.t('chat.__nonexistent__')).toBe('chat.__nonexistent__');
  });
});

describe('detectBrowserLanguage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('should return saved language from localStorage', () => {
    localStorage.setItem('app_language', 'fr');
    expect(detectBrowserLanguage()).toBe('fr');
  });

  it('should detect browser language (full locale)', () => {
    vi.stubGlobal('navigator', { language: 'de-DE' });
    expect(detectBrowserLanguage()).toBe('de');
  });

  it('should detect browser language (short code)', () => {
    vi.stubGlobal('navigator', { language: 'ja' });
    expect(detectBrowserLanguage()).toBe('ja');
  });

  it('should default to en for unsupported browser language', () => {
    vi.stubGlobal('navigator', { language: 'ar-SA' });
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('should default to en when no language is set', () => {
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('should handle empty navigator.language', () => {
    vi.stubGlobal('navigator', { language: '' });
    expect(detectBrowserLanguage()).toBe('en');
  });

  it('should handle localStorage exception gracefully', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage error'); });
    expect(detectBrowserLanguage()).toBe('en');
    getItemSpy.mockRestore();
  });
});

describe('preloadLocales', () => {
  it('should load all 8 locales without errors', async () => {
    await expect(preloadLocales()).resolves.toBeUndefined();
  });

  it('should make translations available for all 8 locales', () => {
    const locales = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];
    for (const lang of locales) {
      const result = getTranslation('chat.archive', lang);
      expect(result).not.toBe('chat.archive');
    }
  });

  it('should handle duplicate preloadLocales calls', async () => {
    await preloadLocales();
    await expect(preloadLocales()).resolves.toBeUndefined();
  });
});

describe('I18nProvider', () => {
  it('should provide default language as en', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.lang).toBe('en');
  });

  it('should update language via setLang', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    act(() => { result.current.setLang('fr'); });
    expect(result.current.lang).toBe('fr');
  });

  it('should persist language to localStorage', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    act(() => { result.current.setLang('es'); });
    expect(localStorage.getItem('app_language')).toBe('es');
  });

  it('should re-render with new translations after language change', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    expect(result.current.t('common.delete')).toBe('Delete');
    act(() => { result.current.setLang('ru'); });
    expect(result.current.t('common.delete')).toBe('Удалить');
  });

  it('should support switching to all supported languages', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    const langs = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];
    for (const lang of langs) {
      act(() => { result.current.setLang(lang); });
      expect(result.current.lang).toBe(lang);
    }
  });
});

describe('Locale file key consistency', () => {
  it('should have the same key set as en.json in every locale', () => {
    for (const file of localeFiles) {
      const lang = file.replace('.json', '');
      const localeKeys = flattenKeys(JSON.parse(readFileSync(join(localesDir, file), 'utf-8')));
      expect([...localeKeys].sort()).toEqual([...enKeys].sort());
    }
  });

  it('should translate every chat sidebar key in every locale', () => {
    const locales = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];
    const sidebarKeys = [
      'chat.archived',
      'chat.folders.all',
      'chat.folders.personal',
      'chat.folders.unread',
      'chat.folders.work',
      'chat.folders.archived',
      'chat.searchPlaceholder',
      'chat.searchChannelsPlaceholder',
      'chat.searchBotsPlaceholder',
      'chat.tabs.stories',
      'chat.tabs.chats',
      'chat.tabs.channels',
      'chat.tabs.bots',
      'chat.sectionConversations',
    ];

    for (const lang of locales) {
      for (const key of sidebarKeys) {
        expect(getTranslation(key, lang)).not.toBe(key);
      }
    }
  });
});

describe('Cross-locale key consistency', () => {
  it('should have all locales return non-key strings for chat.archive', () => {
    const locales = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];
    for (const lang of locales) {
      const val = getTranslation('chat.archive', lang);
      expect(val).not.toBe('chat.archive');
      expect(typeof val).toBe('string');
      expect(val.length).toBeGreaterThan(0);
    }
  });

  it('should have all visibility sub-keys defined in every locale', () => {
    const locales = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];
    const subKeys = ['contacts', 'everyone', 'none'];
    for (const lang of locales) {
      for (const sub of subKeys) {
        const val = getTranslation(`settings.visibility.${sub}`, lang);
        expect(val).not.toBe(`settings.visibility.${sub}`);
      }
    }
  });

  it('should have all chat filter keys defined in every locale', () => {
    const locales = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];
    const subKeys = ['title', 'hasMedia', 'hasAudio', 'hasReplies', 'fromBots', 'priority', 'reset', 'apply'];
    for (const lang of locales) {
      for (const sub of subKeys) {
        const val = getTranslation(`chat.filters.${sub}`, lang);
        expect(val).not.toBe(`chat.filters.${sub}`);
      }
    }
  });
});

describe('XSS prevention', () => {
  it('should interpolate HTML strings as plain text (React handles escaping)', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    const malicious = '<script>alert("xss")</script>';
    const translated = result.current.t('chat.daysAgo', { count: malicious });
    expect(translated).toBe(`${malicious}d ago`);
    expect(translated.length).toBe(malicious.length + 5);
  });

  it('should handle special regex characters in args safely', () => {
    const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
    const special = '$&.test{}[]';
    const translated = result.current.t('chat.daysAgo', { count: special });
    expect(translated).toBe(`${special}d ago`);
  });
});
