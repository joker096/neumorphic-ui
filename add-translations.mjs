import { readFileSync, writeFileSync } from 'fs';

const untranslatedKeys = [
  "nav.company","nav.radar","nav.recordings",
  "common.close","common.confirm","common.loading",
  "meshRadar.emptyHint","meshRadar.emptyDesc","meshRadar.hint",
  "settings.companySection","settings.company","settings.companySubtitle",
  "settings.obfuscationMode","settings.proxySection","settings.companyVisibility",
  "settings.hideWhenOfficeOnly","settings.hideWhenOfficeOnlySubtitle",
  "settings.importBackupFile","settings.backupPassword","settings.removeBot",
  "settings.proxyUrlExample","settings.obfuscationActive","settings.obfuscationDisabled",
  "settings.transportOptions","settings.turnServerExample",
  "settings.hexportHelp","settings.himportHelp","settings.encryptionKeysExported",
  "settings.cloudBackupExported","settings.backupHowToExport",
  "settings.backupPasswordNote","settings.backupStoreSecurely",
  "settings.importHowToImport","settings.importWarning","settings.importCurrentDataWiped",
  "settings.enterPriorityContacts","settings.remove","settings.cacheCleared",
  "settings.cacheClearFailed","settings.transportMode","settings.transportModeXorShroud",
  "settings.transportModeHttpMask","settings.transportModeMediaDummy",
  "settings.relayPreference","settings.relayAuto","settings.relayDirect",
  "settings.relayCloudflare","settings.relayDomainFront","settings.relayPeerTunnel",
  "settings.status","settings.disconnected","settings.backend",
  "settings.resetTransportCache","settings.devicesAndSync","settings.syncStatus",
  "settings.syncing","settings.syncNow","settings.pairedDevices",
  "settings.twoFactorAuth","settings.totpVerified","settings.totpSubtitle",
  "settings.totpInstruction","settings.totpPlaceholder","settings.verify",
  "settings.pairDevice","settings.hostDevice","settings.hostDeviceSubtitle",
  "settings.joinDevice","settings.joinDeviceSubtitle","settings.scanWithNewDevice",
  "settings.generateQR","settings.scanOtherDevice","settings.cameraRequired",
  "settings.relaySection","settings.relayBackend",
  "company.orgName","company.orgId","company.connected","company.teamMembers",
  "company.channels","company.scanQR","company.scanDescription",
  "company.invite","company.inviteDescription","company.roleAdmin","company.roleMember",
  "company.officeMoscow","company.officeLondon","company.members","company.memberCount",
];

// Get English values for these keys
const en = JSON.parse(readFileSync('src/locales/en.json', 'utf8'));
const enValues = {};
for (const key of untranslatedKeys) {
  const parts = key.split('.');
  let o = en;
  for (const p of parts) {
    o = o[p];
  }
  enValues[key] = o;
}

// For each locale (except ru which has 0 untranslated)
const locales = ['de', 'es', 'fr', 'zh', 'ja', 'ko'];
for (const loc of locales) {
  const content = readFileSync(`src/locales/${loc}.json`, 'utf8');
  const obj = JSON.parse(content);

  // Replace untranslated values with English values
  for (const key of untranslatedKeys) {
    const parts = key.split('.');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!o[parts[i]]) o[parts[i]] = {};
      o = o[parts[i]];
    }
    // Check current value
    const currentVal = o[parts[parts.length - 1]];
    if (currentVal === key) {
      // Replace with English value
      o[parts[parts.length - 1]] = enValues[key];
    }
  }

  writeFileSync(`src/locales/${loc}.json`, JSON.stringify(obj, null, 2));
  console.log(`${loc}: updated`);
}
console.log("Done!");
