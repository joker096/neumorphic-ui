import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const enPath = join(process.cwd(), 'src', 'locales', 'en.json');
const enContent = JSON.parse(readFileSync(enPath, 'utf-8'));

function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(obj).sort()) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// A key may be a plural object (e.g. { one, few, many, other }); treat its
// parent key as present when any plural sub-key exists.
function hasKey(keys: string[], key: string): boolean {
  return keys.includes(key) || keys.some((k) => k === `${key}.other` || k.startsWith(`${key}.`));
}

const enKeys = flattenKeys(enContent);
const allLocaleFiles = ['en', 'ru', 'de', 'es', 'fr', 'zh', 'ja', 'ko'];

describe('Localization completeness', () => {
  describe('Company section keys', () => {
    const companyKeys = [
      'company.roleAdmin',
      'company.roleMember',
      'company.officeMoscow',
      'company.officeLondon',
      'company.members',
      'company.memberCount',
    ];

    for (const key of companyKeys) {
      it(`has key "${key}" in en.json`, () => {
        expect(hasKey(enKeys, key)).toBe(true);
      });
    }

    for (const lang of allLocaleFiles) {
      it(`has all company keys in ${lang}.json`, () => {
        const path = join(process.cwd(), 'src', 'locales', `${lang}.json`);
        const content = JSON.parse(readFileSync(path, 'utf-8'));
        const localeKeys = flattenKeys(content);
        for (const key of companyKeys) {
          expect(hasKey(localeKeys, key)).toBe(true);
        }
      });
    }
  });

  describe('Settings localization keys', () => {
    const criticalKeys = [
      'settings.removeBot',
      'settings.proxyUrlExample',
      'settings.obfuscationActive',
      'settings.obfuscationDisabled',
      'settings.transportOptions',
      'settings.turnServerExample',
      'settings.hexportHelp',
      'settings.himportHelp',
      'settings.encryptionKeysExported',
      'settings.cloudBackupExported',
      'settings.backupHowToExport',
      'settings.backupPasswordNote',
      'settings.backupStoreSecurely',
      'settings.importHowToImport',
      'settings.importWarning',
      'settings.importCurrentDataWiped',
      'settings.enterPriorityContacts',
      'settings.remove',
      'settings.cacheCleared',
      'settings.cacheClearFailed',
      'settings.connection',
      'settings.transportMode',
      'settings.relayPreference',
      'settings.disconnected',
      'settings.backend',
      'settings.resetTransportCache',
      'settings.devicesAndSync',
      'settings.syncStatus',
      'settings.syncing',
      'settings.syncNow',
      'settings.pairedDevices',
      'settings.twoFactorAuth',
      'settings.totpVerified',
      'settings.totpSubtitle',
      'settings.totpInstruction',
      'settings.totpPlaceholder',
      'settings.verify',
      'settings.pairDevice',
      'settings.hostDevice',
      'settings.hostDeviceSubtitle',
      'settings.joinDevice',
      'settings.joinDeviceSubtitle',
      'settings.scanWithNewDevice',
      'settings.generateQR',
      'settings.scanOtherDevice',
      'settings.cameraRequired',
      'common.close',
      'common.loading',
    ];

    for (const key of criticalKeys) {
      it(`has key "${key}" in en.json`, () => {
        expect(enKeys).toContain(key);
      });
    }

    for (const lang of allLocaleFiles) {
      it(`has all critical settings keys in ${lang}.json`, () => {
        const path = join(process.cwd(), 'src', 'locales', `${lang}.json`);
        const content = JSON.parse(readFileSync(path, 'utf-8'));
        const localeKeys = flattenKeys(content);
        for (const key of criticalKeys) {
          expect(localeKeys).toContain(key);
        }
      });
    }

    it('all new settings keys have non-empty English translations', () => {
      const keysToCheck = criticalKeys.filter(k => k.startsWith('settings.') || k.startsWith('common.'));
      for (const key of keysToCheck) {
        const parts = key.split('.');
        let value: any = enContent;
        for (const part of parts) {
          value = value[part];
        }
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ConnectionSettings translations', () => {
    const transportKeys = [
      'settings.transportModeXorShroud',
      'settings.transportModeHttpMask',
      'settings.transportModeMediaDummy',
      'settings.relayAuto',
      'settings.relayDirect',
      'settings.relayCloudflare',
      'settings.relayDomainFront',
      'settings.relayPeerTunnel',
    ];

    for (const key of transportKeys) {
      it(`has transport key "${key}" in en.json`, () => {
        expect(enKeys).toContain(key);
      });
    }
  });

  describe('Company ContactsView translation fallbacks', () => {
    it('has fallback strings as actual translation keys', () => {
      const fallbackKeys = [
        'company.orgName',
        'company.orgId',
        'company.connected',
        'company.teamMembers',
        'company.channels',
        'company.scanQR',
        'company.scanDescription',
        'company.invite',
        'company.inviteDescription',
      ];
      for (const key of fallbackKeys) {
        expect(enKeys).toContain(key);
      }
    });
  });

  describe('Cross-locale consistency for new keys', () => {
    const sampleKeys = [
      'settings.cacheCleared',
      'settings.syncNow',
      'settings.twoFactorAuth',
      'settings.verify',
      'common.close',
      'company.roleAdmin',
    ];

    for (const lang of allLocaleFiles) {
      for (const key of sampleKeys) {
        it(`key "${key}" exists in ${lang}.json`, () => {
          const path = join(process.cwd(), 'src', 'locales', `${lang}.json`);
          const content = JSON.parse(readFileSync(path, 'utf-8'));
          const localeKeys = flattenKeys(content);
          expect(localeKeys).toContain(key);
        });
      }
    }
  });
});
