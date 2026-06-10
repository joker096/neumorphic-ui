import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = new URL('.', import.meta.url).pathname;

// Read current en.json
const en = JSON.parse(fs.readFileSync('src\\locales\\en.json', 'utf8'));

// Add missing settings keys
en.settings.searchPlaceholder = 'Search settings...';
en.settings.account = 'Account';
en.settings.appearanceTheme = 'Dark Theme';
en.settings.fontSize = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large'
};
en.settings.animations = 'UI Animations';
en.settings.notificationsSettings = {
  title: 'Notifications',
  subtitle: 'Message notifications'
};
en.settings.soundSettings = {
  title: 'Notification Sound',
  enabled: 'Sound Enabled'
};
en.settings.volume = 'Volume';
en.settings.security = {
  title: 'Security',
  subtitle: '2FA, encryption, key management'
};
en.settings.privacy = {
  title: 'Privacy',
  subtitle: 'Last activity, blocks'
};
en.settings.dataStorage = {
  title: 'Data and Storage',
  subtitle: 'Backup, auto-load, cache'
};
en.settings.bots = {
  title: 'Bots',
  subtitle: 'Manage bots and integrations'
};
en.settings.network = {
  title: 'Proxy and Network',
  enabled: 'Enabled',
  disabled: 'Disabled (settings saved locally)'
};
en.settings.spamProtection = {
  title: 'Spam Protection',
  active: 'Filters active',
  disabled: 'Disabled'
};
en.settings.systemStatus = {
  title: 'System Status',
  subtitle: 'Battery level, circuit breakers'
};
en.settings.cloudSync = {
  title: 'Cloud Sync',
  enabled: 'Enabled',
  disabled: 'Disabled',
  provider: 'Provider',
  syncNow: 'Sync Now',
  lastSync: 'Last: {date}',
  never: 'Never',
  status: 'Status',
  error: 'Error',
  enable: 'Enable cloud synchronization',
  subtitle: 'Sync chats and settings between devices',
  syncing: 'Syncing...',
  syncBtn: 'Sync Now'
};
en.settings.locationSharing = {
  title: 'Location Sharing',
  active: '{live} live, {static} static',
  chat: 'Chat: {chatId}',
  stop: 'Stop',
  static: 'Static locations',
  live: 'Live locations',
  none: 'No active location sharing'
};
en.settings.photoEditor = {
  title: 'Photo Editor',
  subtitle: 'Crop, draw, text',
  autoSave: 'Auto-save edits',
  autoSaveSubtitle: 'Save changes automatically',
  crop: 'Crop',
  draw: 'Drawing',
  text: 'Text',
  preview: 'Image preview area',
  save: 'Save',
  reset: 'Reset',
  tools: 'Tools: crop (drag to select), draw (freehand), text (tap to add), filters'
};
en.settings.pinPrompt = 'Enter new PIN (empty to reset):';
en.settings.saveBtn = 'Save';
en.settings.twoFactorAuth = 'Two-step authentication';
en.settings.cloudPassword = {
  title: 'Cloud Password (TOTP)',
  subtitle: 'Uses PBKDF2 (600k iterations)'
};
en.settings.encryptionKeys = {
  title: 'Encryption keys',
  updated: 'Updated just now (WebCrypto)'
};
en.settings.deadMansSwitch = 'Auto-wipe (Dead Man\'s Switch)';
en.settings.selfDestruct = {
  off: 'Off',
  day: '1 day',
  week: '1 week'
};
en.settings.mediaAutoLoad = {
  wifi: 'Wi-Fi',
  wifiAndNetwork: 'Wi-Fi and Network',
  never: 'Never'
};
en.settings.obfuscation = {
  modes: ['Auto', 'MTProto', 'Domain Fronting']
};
en.settings.visibility = {
  none: 'Nobody',
  contacts: 'My contacts',
  everyone: 'Everyone'
};
en.settings.storageUsage = 'Memory usage';
en.settings.networkUsage = 'Network usage';
en.settings.clearCache = {
  title: 'Clear cache',
  action: 'Clear'
};
en.settings.encryptBackupPassword = 'Encrypt backup with password';
en.settings.enterBackupPassword = 'Enter backup password...';
en.settings.exportBackup = {
  title: 'Export backup',
  subtitle: 'JSON backup of chats, channels, bots, and settings'
};
en.settings.exportHtml = {
  title: 'Export HTML',
  subtitle: 'Readable backup summary for quick review'
};
en.settings.importBackup = {
  title: 'Import backup',
  subtitle: 'JSON backup restore from local file'
};
en.settings.turnServer = 'Custom TURN Server';
en.settings.turnServerPlaceholder = 'turn:server.url:3478';
en.settings.p2pFilters = {
  title: 'P2P filters',
  subtitle: 'Automatically hide known spam nodes'
};
en.settings.proxy = {
  title: 'Use proxy',
  subtitle: 'SOCKS5 / HTTP'
};
en.settings.obfuscationMode = 'Obfuscation';
en.settings.meshNodesNearby = 'Mesh nodes nearby';
en.settings.dhtConnection = 'DHT connection';
en.settings.stable = 'Stable';
en.settings.localDB = 'Local DB';
en.settings.encrypted = 'Encrypted';
en.settings.botsNone = 'No active bots';
en.settings.botsComingSoon = 'Bots and third-party integrations will appear here when you add them.';
en.settings.forwardAllow = 'Allow message forwarding';
en.settings.forwardAllowSubtitle = 'Control if others can forward your messages';
en.settings.forwardAnonymization = 'Forward Chain Break';
en.settings.forwardAnonymizationSubtitle = 'Anonymized forwarding with metadata cleanup';
en.settings.allowMetadata = 'Allow metadata';
en.settings.allowMetadataSubtitle = 'Enable metadata in forwarded messages';
en.settings.forwardLimit = 'Forward limit';
en.settings.deviceWebBrowser = 'Web Browser (Current)';
en.settings.deviceCurrent = 'Current';
en.settings.deviceRemove = 'Remove device';
en.settings.deviceAddSubtitle = 'Scan QR code to add a new device';
en.settings.deviceActiveSessions = 'Active sessions';
en.settings.deviceCount = '{count} devices connected';
en.settings.receiptsEnable = 'Enable receipts for all';
en.settings.receiptsEnableSubtitle = 'Show when you have read a message';
en.settings.receiptsOn = 'Read receipts: on';
en.settings.receiptsOff = 'Read receipts: off';
en.settings.receiptsContact = 'Contact: {name}';
en.settings.dndTitle = 'Do Not Disturb Mode';
en.settings.dndSubtitle = 'Disables notifications by schedule';
en.settings.dndFrom = 'From';
en.settings.dndTo = 'To';
en.settings.priorityContactsTitle = 'Priority contacts';
en.settings.priorityContactsSubtitle = 'Comma-separated names that bypass DND';
en.settings.advancedPrivacyTitle = 'Advanced privacy';
en.settings.stealthMode = 'Stealth Mode (Time fuzzing)';
en.settings.stealthModeSubtitle = 'Shift timestamps by ±5 minutes';
en.settings.anonymousMode = 'Anonymous mode (Traffic through relay)';
en.settings.anonymousModeSubtitle = 'Blocks direct P2P connections to hide IP';
en.settings.ghostViewMode = 'Ghost View Mode';
en.settings.ghostViewModeSubtitle = 'H hides your chat and story viewing status';
en.settings.deliveryReceipts = 'Delivery receipts';
en.settings.deliveryReceiptsSubtitle = 'Show sent/delivered status for outgoing messages';
en.settings.readReceipts = 'Read receipts';
en.settings.readReceiptsSubtitle = 'Show read status when messages are opened';
en.settings.typingIndicators = 'Typing indicators';
en.settings.typingIndicatorsSubtitle = 'Show when the other side is typing';

// Save back
fs.writeFileSync('src\\locales\\en.json', JSON.stringify(en, null, 2));
console.log('Updated en.json with', Object.keys(en.settings).length, 'new keys');
