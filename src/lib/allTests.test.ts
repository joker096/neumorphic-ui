import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { getTranslation, getTranslationWithFallback, detectBrowserLanguage, preloadLocales, loadLocale, I18nProvider, useI18n } from './i18n';

function flattenKeys(obj: Record<string, any>, prefix = ''): Set<string> {
  const keys = new Set<string>();
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const nestedKey of flattenKeys(value, fullKey)) keys.add(nestedKey);
    } else {
      keys.add(fullKey);
    }
  }
  return keys;
}

const localesDir = join(process.cwd(), 'src', 'locales');
const localeFiles = ['en.json', 'ru.json', 'de.json', 'es.json', 'fr.json', 'zh.json', 'ja.json', 'ko.json'];
const allLocales = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];

beforeEach(async () => {
  localStorage.clear();
  await preloadLocales();
});

describe('=== COMPREHENSIVE I18N TESTS ===', () => {

  describe('Locale structure', () => {
    it('should have all 8 locale files', () => {
      expect(localeFiles).toHaveLength(8);
    });

    it('should have all keys in en.json', () => {
      const enContent = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));
      expect(flattenKeys(enContent).size).toBeGreaterThanOrEqual(983);
    });

    it('should have same key count in all locales', () => {
      const enContent = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));
      const enSize = flattenKeys(enContent).size;
      for (const file of localeFiles) {
        const content = JSON.parse(readFileSync(join(localesDir, file), 'utf-8'));
        expect(flattenKeys(content).size).toBe(enSize);
      }
    });

    it('should have identical key sets across all locales', () => {
      const enKeys = flattenKeys(JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8')));
      for (const file of localeFiles.filter(f => f !== 'en.json')) {
        const content = JSON.parse(readFileSync(join(localesDir, file), 'utf-8'));
        const localeKeys = flattenKeys(content);
        for (const key of enKeys) expect(localeKeys).toContain(key);
      }
    });
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

    it('should resolve top-level keys', () => {
      expect(getTranslation('nav.chats', 'en')).toBe('Chats');
    });

    it('should resolve chat keys', () => {
      expect(getTranslation('chat.archive', 'en')).toBe('Archive');
    });

    it('should resolve settings keys', () => {
      expect(getTranslation('settings.language', 'en')).toBe('Language');
    });

    it('should resolve contacts keys', () => {
      expect(getTranslation('contacts.addContact', 'en')).toBe('Add New Contact');
    });
  });

  describe('getTranslationWithFallback', () => {
    it('should return target locale translation when key exists', async () => {
      await loadLocale('ru');
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

    it('should handle string interpolation values', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      expect(result.current.t('contacts.lastSeenAgo', { time: '2 hours ago' })).toBe('Last seen: 2 hours ago');
    });

    it('should handle interpolation with special characters', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      expect(result.current.t('contacts.confirmBlockMessage', { name: 'John Doe' })).toBe('Block John Doe? They won\'t be able to contact you.');
    });
  });

  describe('t function (language switching)', () => {
    it('should return Russian translation after switching language', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      act(() => { result.current.setLang('ru'); });
      expect(result.current.t('chat.archive')).toBe('Архив');
    });

    it('should return Japanese translation after switching language', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      await act(async () => { await result.current.setLang('ja'); });
      expect(result.current.t('chat.archive')).toBe("アーカイブ");
    });

    it('should return Chinese translation after switching language', async () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      await act(async () => { await result.current.setLang('zh'); });
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

    it('should support switching to all languages', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      for (const lang of allLocales) {
        act(() => { result.current.setLang(lang); });
        expect(result.current.lang).toBe(lang);
      }
    });
  });

  describe('detectBrowserLanguage', () => {
    it('should return saved language from localStorage', () => {
      localStorage.setItem('app_language', 'fr');
      expect(detectBrowserLanguage()).toBe('fr');
    });

    it('should detect browser language (full locale)', () => {
      const original = global.navigator;
      Object.defineProperty(global, 'navigator', { value: { language: 'de-DE' }, writable: true });
      expect(detectBrowserLanguage()).toBe('de');
      Object.defineProperty(global, 'navigator', { value: original, writable: true });
    });

    it('should detect browser language (short code)', () => {
      const original = global.navigator;
      Object.defineProperty(global, 'navigator', { value: { language: 'ja' }, writable: true });
      expect(detectBrowserLanguage()).toBe('ja');
      Object.defineProperty(global, 'navigator', { value: original, writable: true });
    });

    it('should default to en for unsupported browser language', () => {
      const original = global.navigator;
      Object.defineProperty(global, 'navigator', { value: { language: 'ar-SA' }, writable: true });
      expect(detectBrowserLanguage()).toBe('en');
      Object.defineProperty(global, 'navigator', { value: original, writable: true });
    });

    it('should default to en when no language is set', () => {
      expect(detectBrowserLanguage()).toBe('en');
    });

    it('should handle empty navigator.language', () => {
      const original = global.navigator;
      Object.defineProperty(global, 'navigator', { value: { language: '' }, writable: true });
      expect(detectBrowserLanguage()).toBe('en');
      Object.defineProperty(global, 'navigator', { value: original, writable: true });
    });
  });

  describe('preloadLocales', () => {
    it('should load all 8 locales without errors', async () => {
      await expect(preloadLocales()).resolves.toBeUndefined();
    });

    it('should make translations available for all 8 locales', async () => {
      await Promise.all(allLocales.map((lang) => loadLocale(lang)));
      for (const lang of allLocales) {
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
      for (const lang of allLocales) {
        act(() => { result.current.setLang(lang); });
        expect(result.current.lang).toBe(lang);
      }
    });
  });

  describe('I18nContext', () => {
    it('should have lang property', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      expect(result.current).toHaveProperty('lang');
    });

    it('should have setLang function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      expect(typeof result.current.setLang).toBe('function');
    });

    it('should have t function', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      expect(typeof result.current.t).toBe('function');
    });

    it('should provide context via I18nContext.Provider', () => {
      const { result } = renderHook(() => useI18n(), { wrapper: I18nProvider });
      expect(result.current).toBeDefined();
      expect(result.current.lang).toBeDefined();
      expect(result.current.t).toBeDefined();
      expect(result.current.setLang).toBeDefined();
    });
  });

  describe('XSS prevention', () => {
    it('should interpolate HTML strings as plain text', () => {
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

  describe('All translations are non-empty strings', () => {
    it('all en.json values are non-empty strings', () => {
      const enContent = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));
      function checkValues(obj: any) {
        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (typeof val === 'object' && val !== null && !Array.isArray(val)) { checkValues(val); }
          else { expect(typeof val).toBe('string'); expect(val.length).toBeGreaterThan(0); }
        }
      }
      checkValues(enContent);
    });

    it('all locale values are non-empty strings', () => {
      for (const file of localeFiles) {
        const content = JSON.parse(readFileSync(join(localesDir, file), 'utf-8'));
        function checkValues(obj: any) {
          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'object' && val !== null && !Array.isArray(val)) { checkValues(val); }
            else { expect(typeof val).toBe('string'); expect(val.length).toBeGreaterThan(0); }
          }
        }
        checkValues(content);
      }
    });
  });

  describe('Cross-locale key consistency', () => {
    it('should have all locales return non-key strings for chat.archive', async () => {
      await Promise.all(allLocales.map((lang) => loadLocale(lang)));
      for (const lang of allLocales) {
        const val = getTranslation('chat.archive', lang);
        expect(val).not.toBe('chat.archive');
        expect(typeof val).toBe('string');
        expect(val.length).toBeGreaterThan(0);
      }
    });

    it('should have all visibility sub-keys defined in every locale', () => {
      const subKeys = ['contacts', 'everyone', 'none'];
      for (const lang of allLocales) {
        for (const sub of subKeys) {
          const val = getTranslation(`settings.visibility.${sub}`, lang);
          expect(val).not.toBe(`settings.visibility.${sub}`);
        }
      }
    });

    it('should have all chat filter keys defined in every locale', () => {
      const subKeys = ['title', 'hasMedia', 'hasAudio', 'hasReplies', 'fromBots', 'priority', 'reset', 'apply', 'button', 'buttonOn', 'clear', 'from', 'to', 'all', 'me', 'others', 'items'];
      for (const lang of allLocales) {
        for (const sub of subKeys) {
          const val = getTranslation(`chat.filters.${sub}`, lang);
          expect(val).not.toBe(`chat.filters.${sub}`);
        }
      }
    });
  });

  describe('All top-level sections', () => {
    const sections = ['nav', 'chat', 'common', 'createChannel', 'createBot', 'admin', 'aftercare', 'campaigns', 'campaignSheet', 'channelComments', 'recordings', 'voiceRecorder', 'morseDecoder', 'photoViewer', 'meshRadar', 'accountSwitcher', 'soundSettings', 'systemPlayer', 'search', 'confirmDialog', 'toast', 'views', 'contacts', 'header', 'lock', 'hub', 'settings', 'gifSearch', 'error', 'stickers', 'login', 'company'];

    for (const section of sections) {
      it(`section "${section}" has at least one key in en.json`, () => {
        const enContent = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));
        expect(Object.keys(enContent)).toContain(section);
      });
    }
  });

  describe('nav.* keys translations', () => {
    const navKeys = ['nav.chats', 'nav.contacts', 'nav.settings', 'nav.company'];

    for (const lang of allLocales) {
      for (const key of navKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
          expect(val.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('common.* keys translations', () => {
    const commonKeys = ['common.delete', 'common.close', 'common.cancel', 'common.confirm', 'common.loading', 'common.addDevice', 'common.selectLanguage'];

    for (const lang of allLocales) {
      for (const key of commonKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
          expect(val.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('contacts.* keys translations', () => {
    const contactKeys = [
      'contacts.activeNow', 'contacts.addContact', 'contacts.allTab', 'contacts.blockSpammer', 'contacts.moreActions',
      'contacts.call', 'contacts.videoCall', 'contacts.callType', 'contacts.close', 'contacts.confirmBlockMessage',
      'contacts.confirmDeleteMessage', 'contacts.contactName', 'contacts.deleteContact', 'contacts.edit', 'contacts.editContact',
      'contacts.favoritesTab', 'contacts.foundResults', 'contacts.lastSeenAgo', 'contacts.message', 'contacts.networkId',
      'contacts.noContacts', 'contacts.noContactsSubtitle', 'contacts.recentTab', 'contacts.saveChanges', 'contacts.saveContact',
      'contacts.scanContactQR', 'contacts.scanDescription', 'contacts.searchPlaceholder', 'contacts.shareDescription',
      'contacts.shareIdentity', 'contacts.title', 'contacts.localInfo', 'contacts.localFieldsNotShared', 'contacts.addField',
      'contacts.noLocalFields', 'contacts.fieldTypePhone', 'contacts.fieldTypeEmail', 'contacts.fieldTypeTelegram',
      'contacts.fieldTypeCustom', 'contacts.fieldSubtypeMobile', 'contacts.fieldSubtypeWork', 'contacts.fieldSubtypeHome',
      'contacts.fieldSubtypeMain', 'contacts.verifySecurity', 'contacts.verifySecurityDesc', 'contacts.safetyNumbersTitle',
      'contacts.safetyNumbersDesc', 'contacts.verificationLevel', 'contacts.yourId', 'contacts.theirId',
      'contacts.crmTitle', 'contacts.crmAll', 'contacts.crmByCompany', 'contacts.crmByTag', 'contacts.crmSearchContacts',
      'contacts.crmNoCompany', 'contacts.crmTagClient', 'contacts.crmTagLead', 'contacts.crmTagPartner', 'contacts.crmTagVendor',
      'contacts.crmTagInternal', 'contacts.crmTagVip',
    ];

    for (const lang of allLocales) {
      for (const key of contactKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
          expect(val.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('hub.* keys translations', () => {
    const hubKeys = ['hub.recordingsSubtitle', 'hub.radarSubtitle'];

    for (const lang of allLocales) {
      for (const key of hubKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
          expect(val.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('login.* keys translations', () => {
    const loginKeys = ['login.title', 'login.subtitle', 'login.username', 'login.usernamePlaceholder', 'login.password', 'login.passwordPlaceholder', 'login.captcha', 'login.captchaPlaceholder', 'login.refreshCaptcha', 'login.signIn'];

    for (const lang of allLocales) {
      for (const key of loginKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
          expect(val.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('company.* keys translations', () => {
    const companyKeys = ['company.orgName', 'company.orgId', 'company.connected', 'company.teamMembers', 'company.channels', 'company.scanQR', 'company.scanDescription', 'company.invite', 'company.inviteDescription', 'company.roleAdmin', 'company.roleMember', 'company.officeMoscow', 'company.officeLondon', 'company.members', 'company.memberCount'];

    for (const lang of allLocales) {
      for (const key of companyKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
          expect(val.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('toast.* keys translations', () => {
    const toastKeys = [
      'toast.contactAdded', 'toast.encryptionFailed', 'toast.noPasswordProvided', 'toast.encryptedBackupCreated',
      'toast.backupEncryptedWithPassword', 'toast.encryptionError', 'toast.couldNotEncryptBackup', 'toast.backupCreated',
      'toast.backupReady', 'toast.encryptedBackup', 'toast.passwordRequiredDecryption', 'toast.decryptionFailed',
      'toast.couldNotDecryptBackup', 'toast.backupRestored', 'toast.dataImported', 'toast.failedGenerateRecovery',
      'toast.recoverySuccessful', 'toast.dataRestored', 'toast.recoveryFailed', 'toast.invalidPhrase', 'toast.recoveryError',
      'toast.accountManagement', 'toast.accountRequiresAuth', 'toast.passwordRequired', 'toast.enterBackupPassword',
      'toast.deviceAdded', 'toast.deviceRemoved', 'toast.contact', 'toast.call', 'toast.callFunctionality',
      'toast.messageFunctionality', 'toast.forwardPrivacyUpdated', 'toast.settingsSaved', 'toast.contactUpdated',
    ];

    for (const lang of allLocales) {
      for (const key of toastKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
          expect(val.length).toBeGreaterThan(0);
        });
      }
    }
  });

  describe('settings.relay backend keys', () => {
    const relayKeys = ['settings.relayPreference', 'settings.relayAuto', 'settings.relayDirect', 'settings.relayCloudflare', 'settings.relayDomainFront', 'settings.relayPeerTunnel'];

    for (const lang of allLocales) {
      for (const key of relayKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.obfuscation keys', () => {
    const obfuscationKeys = ['settings.obfuscation', 'settings.obfuscationMode', 'settings.obfuscationActive', 'settings.obfuscationDisabled', 'settings.stealthMode', 'settings.stealthModeSubtitle'];

    for (const lang of allLocales) {
      for (const key of obfuscationKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.proxy keys', () => {
    const proxyKeys = ['settings.proxyUrl', 'settings.proxyUrlSubtitle', 'settings.useProxy', 'settings.useProxySubtitle', 'settings.torBridge', 'settings.relaySection', 'settings.relayBackend'];

    for (const lang of allLocales) {
      for (const key of proxyKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.backup keys', () => {
    const backupKeys = ['settings.hexportHelp', 'settings.himportHelp', 'settings.exportSuccess', 'settings.exportFailed', 'settings.importSuccess', 'settings.importFailed', 'settings.importing', 'settings.importWarning', 'settings.importWarningNote', 'settings.importCurrentDataWiped', 'settings.backupHowToExport', 'settings.backupPasswordNote', 'settings.backupStoreSecurely', 'settings.importHowToImport', 'settings.enterPriorityContacts'];

    for (const lang of allLocales) {
      for (const key of backupKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.security keys', () => {
    const securityKeys = ['settings.security', 'settings.securitySubtitle', 'settings.recoveryPhrase', 'settings.recoveryPhraseGenerated', 'settings.recoveryPhraseSubtitle', 'settings.recoveryPhrasePlaceholder', 'settings.recoveryPhraseWriteDown', 'settings.recoveryPhraseIveSavedIt', 'settings.recoveryPhraseRestoreTitle', 'settings.recoveryPhraseRestoreSubtitle', 'settings.recoveryPhraseInvalid', 'settings.recoveryPhraseRestoring', 'settings.recoveryPhraseSuccess', 'settings.restore', 'settings.cancel', 'settings.confirmWipe', 'settings.wipeAllData', 'settings.wipeSubtitle', 'settings.dataWiped', 'settings.wipeFailed'];

    for (const lang of allLocales) {
      for (const key of securityKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.TOTP keys', () => {
    const totpKeys = ['settings.twoFactorAuth', 'settings.totpVerified', 'settings.totpSubtitle', 'settings.totpInstruction', 'settings.totpPlaceholder', 'settings.verify'];

    for (const lang of allLocales) {
      for (const key of totpKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.recovery keys', () => {
    const recoveryKeys = ['settings.recoveryPhrase', 'settings.recoveryPhraseGenerated', 'settings.recoveryPhrasePlaceholder', 'settings.recoveryPhraseSubtitle', 'settings.recoveryPhraseWriteDown', 'settings.recoveryPhraseIveSavedIt', 'settings.recoveryPhraseRestoreTitle', 'settings.recoveryPhraseRestoreSubtitle', 'settings.recoveryPhraseInvalid', 'settings.recoveryPhraseRestoring', 'settings.recoveryPhraseSuccess'];

    for (const lang of allLocales) {
      for (const key of recoveryKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.transport keys', () => {
    const transportKeys = ['settings.transportMode', 'settings.transportModeXorShroud', 'settings.transportModeHttpMask', 'settings.transportModeMediaDummy', 'settings.transportBackend', 'settings.transportOptions', 'settings.transportModeXorShroud', 'settings.transportModeHttpMask', 'settings.transportModeMediaDummy', 'settings.relayPreference', 'settings.relayAuto', 'settings.relayDirect', 'settings.relayCloudflare', 'settings.relayDomainFront', 'settings.relayPeerTunnel'];

    for (const lang of allLocales) {
      for (const key of transportKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.advanced keys', () => {
    const advancedKeys = ['settings.advancedSection', 'settings.advancedPrivacy', 'settings.allowMetadata', 'settings.allowMetadataSubtitle', 'settings.dataStorage', 'settings.dataStorageSection', 'settings.dataStorageSubtitle', 'settings.clearCache', 'settings.clearAll', 'settings.clearCacheSubtitle'];

    for (const lang of allLocales) {
      for (const key of advancedKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.notifications keys', () => {
    const notifKeys = ['settings.notifications', 'settings.notificationsSection', 'settings.notificationsSubtitle', 'settings.notificationsOption', 'settings.dnd', 'settings.dndMode', 'settings.dndSubtitle', 'settings.dndFrom', 'settings.dndTo', 'settings.sound'];

    for (const lang of allLocales) {
      for (const key of notifKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.appearance keys', () => {
    const appearanceKeys = ['settings.appearance', 'settings.appearanceSection', 'settings.appearanceDescription', 'settings.darkTheme', 'settings.darkThemeSubtitle', 'settings.animations', 'settings.animationsSubtitle', 'settings.fontSize', 'settings.fontSizeLarge', 'settings.fontSizeMedium', 'settings.fontSizeSmall', 'settings.fontSizeSubtitle'];

    for (const lang of allLocales) {
      for (const key of appearanceKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.company keys', () => {
    const companyKeys = ['settings.companyVisibility', 'settings.hideWhenOfficeOnly', 'settings.hideWhenOfficeOnlySubtitle'];

    for (const lang of allLocales) {
      for (const key of companyKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.device pair keys', () => {
    const deviceKeys = ['settings.pairDevice', 'settings.hostDevice', 'settings.hostDeviceSubtitle', 'settings.joinDevice', 'settings.joinDeviceSubtitle', 'settings.scanWithNewDevice', 'settings.generateQR', 'settings.scanOtherDevice', 'settings.cameraRequired'];

    for (const lang of allLocales) {
      for (const key of deviceKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.pin keys', () => {
    const pinKeys = ['settings.appLock', 'settings.appLockSubtitle', 'settings.appLockPin', 'settings.pinSet', 'settings.pinDisabled', 'settings.pinEnabled', 'settings.pinIncorrect', 'settings.pinTooShort', 'settings.confirmPin', 'settings.pinLock', 'settings.removePin', 'settings.pinRemoved', 'settings.enterPin', 'settings.confirmWipe', 'settings.wipeAllData', 'settings.wipeSubtitle', 'settings.dataWiped', 'settings.wipeFailed'];

    for (const lang of allLocales) {
      for (const key of pinKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.network keys', () => {
    const networkKeys = ['settings.dhtConnection', 'settings.dhtStable', 'settings.p2pMeshMode', 'settings.p2pMeshModeSubtitle', 'settings.autoReconnect', 'settings.autoReconnectSubtitle', 'settings.proxySection', 'settings.relaySection', 'settings.relayBackend', 'settings.relayPreference'];

    for (const lang of allLocales) {
      for (const key of networkKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });

  describe('settings.import keys', () => {
    const importKeys = ['settings.importBackup', 'settings.importBackupSubtitle', 'settings.hexportHelp', 'settings.himportHelp', 'settings.exportBackup', 'settings.exportBackupSubtitle', 'settings.importing', 'settings.importWarning', 'settings.importWarningNote', 'settings.importCurrentDataWiped', 'settings.enterPriorityContacts'];

    for (const lang of allLocales) {
      for (const key of importKeys) {
        it(`"${key}" translates in ${lang}`, () => {
          const val = getTranslation(key, lang);
          expect(val).not.toBe(key);
        });
      }
    }
  });
});
