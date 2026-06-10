import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');
const componentsDir = path.join(srcDir, 'components');

// All hardcoded strings that need i18n + their key
const hardcodedStrings = {
  // SettingsView.tsx specific strings
  "Уровень заряда": "settings.batteryLevel",
  "Не сейчас": "settings.installDismiss",
  "Install": "settings.installBtn",
  "Аккаунт": "settings.accountSection",
  "@joker": "@joker", // Keep as-is, it's a dynamic handle
  "Добавить аккаунт": "settings.addAccount",
  "Внешний вид": "settings.appearanceSection",
  "Уведомления": "settings.notificationsSection",
  "Конфиденциальность и безопасность": "settings.privacySecuritySection",
  "Данные и хранилище": "settings.dataStorageSection",
  "Сервисы": "settings.servicesSection",
  "Расширенные": "settings.advancedSection",
  "Облачная синхронизация": "settings.cloudSyncSection",
  "Геолокация": "settings.locationSection",
  "Редактор фото": "settings.photoEditorSection",
  "Последняя сборка": "settings.lastBuild",
  "31.05.2026, 11:43": "31.05.2026, 11:43", // Keep date as-is
  "Темная тема": "settings.darkTheme",
  "Анимации интерфейса": "settings.uiAnimations",
  "Автоматически": "settings.auto",
  "Размер шрифта": "settings.fontSize",
  "Мелкий": "settings.fontSizeSmall",
  "Средний": "settings.fontSizeMedium",
  "Крупный": "settings.fontSizeLarge",
  "App Lock PIN": "settings.appLockPin",
  "Шифрование данных (PBKDF2-SHA256)": "settings.appLockSubtitle",
  "Введите новый PIN (пусто для сброса):": "settings.pinPrompt",
  "Save": "common.save",
  "Cloud Password (TOTP)": "settings.cloudPasswordTitle",
  "Auto-wipe (Dead Man's Switch)": "settings.deadMansSwitch",
  "Уничтожить все данные (Wipe)": "settings.wipeAllData",
  "Включить": "settings.enable",
  "Выключено (настройки сохраняются локально)": "settings.disabledLocally",
  "Выключено": "settings.disabled",
  "Прокси": "settings.proxy",
  "Настройка прокси": "settings.proxyDesc",
  "Настройка Tor": "settings.torDesc",
  "Автозапуск": "settings.autostart",
  "Яркость": "settings.brightness",
  "Очистить кэш": "settings.clearCache",
  "Очистить все": "settings.clearAll",
  "Очистить IndexedDB": "settings.clearIndexedDB",
  "Отключить звук": "settings.disableSound",
  "Игнорировать уведомления": "settings.ignoreNotifications",
  "Импортировать резервную копию": "settings.importBackup",
  "Облако": "settings.cloud",
  "Облачная синхронизация": "settings.cloudSync",
  "Включить": "settings.enable",
  "Выключено": "settings.disabled",
  "Выключен": "settings.disabled",
  "Настройка прокси": "settings.proxySettings",
  "Автосохранение правок": "settings.autoSaveEdits",
  "Сохранять изменения автоматически": "settings.autoSaveChanges",
  "Сохранить резервную копию": "settings.saveBackup",
  "Настроить резервную копию": "settings.configureBackup",
  "Импортировать резервную копию": "settings.importBackup",
  "Экспортировать данные": "settings.exportData",
  "Облачная синхронизация": "settings.cloudSync",
  "Облако": "settings.cloud",
  "Включить": "settings.enable",
  "Выключено": "settings.disabled",
  "Прокси": "settings.proxy",
  "Настройка прокси": "settings.proxySettings",
  "Настройка Tor": "settings.torSettings",
  "Tor": "settings.tor",
  "Автозапуск": "settings.autostart",
  "Яркость": "settings.brightness",
  "Анимации": "settings.animations",
  "Настройки внешнего вида": "settings.appearanceSettings",
  "Оформление": "settings.theme",
  "Размер шрифта": "settings.fontSize",
  "Язык приложения": "settings.appLanguage",
  "Настройки приложения": "settings.appSettings",
  "Конфиденциальность": "settings.privacy",
  "Очистка данных": "settings.dataCleanup",
  "Очистить": "settings.clear",
  "Очистить кэш": "settings.clearCache",
  "Очистить все": "settings.clearAll",
  "Очистить IndexedDB": "settings.clearIndexedDB",
  "Очистить кэш": "settings.clearCache",
  "Включить облачную синхронизацию": "settings.enableCloudSync",
  "Последняя синхронизация": "settings.lastSync",
  "Синхронизировать сейчас": "settings.syncNow",
  "Живые локации": "settings.liveLocations",
  "Статичные локации": "settings.staticLocations",
  "Нет активных шарингов локации": "settings.noActiveSharing",
  "Остановить": "settings.stop",
  "Удалить": "common.delete",
  "Удалить устройство": "settings.removeDevice",
  "Добавить устройство": "common.addDevice",
  "Добавить устройство": "common.addDevice",
  "Удалить устройство": "settings.removeDevice",
  "Активных ботов нет": "settings.noBots",
  "Здесь появятся боты и сторонние интеграции, когда вы их добавите.": "settings.botsComingSoon",
  "Область предварительного просмотра изображения": "settings.imagePreview",
  "Инструменты: обрезка (drag to select), рисование (freehand), текст (tap to add), фильтры": "settings.tools",
  "Пользовательский TURN Сервер": "settings.customTurnServer",
  "turn:server.url:3478": "turn:server.url:3478",
  "Режим DND": "settings.dndMode",
  "С": "settings.from",
  "До": "settings.to",
  "Важные контакты": "settings.priorityContacts",
  "Продвинутая приватность": "settings.advancedPrivacy",
  "Аккаунт": "settings.accountSection",
  "Данные и храни": "settings.dataAndStorage",
  "Включить": "settings.enable",
  "Выключена": "settings.disabled",
  "Никогда": "settings.never",
  "Синхронизация...": "settings.syncing",
  "Синхронизировать сейчас": "settings.syncNow",
  "Пользовательский TURN Сервер": "settings.customTurnServer",
  "Режим DND": "settings.dndMode",
  "С": "settings.from",
  "До": "settings.to",
  "Важные контакты": "settings.priorityContacts",
  "Продвинутая приватность": "settings.advancedPrivacy",
  "Аккаунт": "settings.accountSection",
  "Включить облачную синхронизацию": "settings.enableCloudSync",
  "Последняя синхронизация": "settings.lastSync",
  "Синхронизировать сейчас": "settings.syncNow",
  "Живые локации": "settings.liveLocations",
  "Статичные локации": "settings.staticLocations",
  "Нет активных шарингов локации": "settings.noActiveSharing",
  "Остановить": "settings.stop",
  "Удалить": "common.delete",
  "Удалить устройство": "settings.removeDevice",
  "Добавить устройство": "common.addDevice",
  "Удалить устройство": "settings.removeDevice",
  "Активных ботов нет": "settings.noBots",
  "Здесь появятся боты и сторонние интеграции, когда вы их добавите.": "settings.botsComingSoon",
  "Область предварительного просмотра изображения": "settings.imagePreview",
  "Инструменты: обрезка (drag to select), рисование (freehand), текст (tap to add), фильтры": "settings.tools",
  "Пользовательский TURN Сервер": "settings.customTurnServer",
  "Режим DND": "settings.dndMode",
  "С": "settings.from",
  "До": "settings.to",
  "Важные контакты": "settings.priorityContacts",
  "Продвинутая приватность": "settings.advancedPrivacy",
  "Аккаунт": "settings.accountSection",
  "Включить облачную синхронизацию": "settings.enableCloudSync",
  "Последняя синхронизация": "settings.lastSync",
  "Синхронизировать сейчас": "settings.syncNow",
  "Живые локации": "settings.liveLocations",
  "Статичные локации": "settings.staticLocations",
  "Нет активных шарингов локации": "settings.noActiveSharing",
  "Остановить": "settings.stop",
  "Удалить": "common.delete",
  "Удалить устройство": "settings.removeDevice",
  "Добавить устройство": "common.addDevice",
  "Удалить устройство": "settings.removeDevice",
  "Активных ботов нет": "settings.noBots",
  "Здесь появятся боты и сторонние интеграции, когда вы их добавите.": "settings.botsComingSoon",
  "Область предварительного просмотра изображения": "settings.imagePreview",
  "Инструменты: обрезка (drag to select), рисование (freehand), текст (tap to add), фильтры": "settings.tools",
  "Пользовательский TURN Сервер": "settings.customTurnServer",
};

const allComponents = [
  'SettingsView.tsx',
  'ContactsView.tsx',
  'ChatListItem.tsx',
  'AvatarRow.tsx',
  'ContactProfileModal.tsx',
  'HubView.tsx',
];

// Locale files
const localeFiles = ['ru', 'de', 'es', 'fr'];
const enFile = path.join(srcDir, 'locales', 'en.json');
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

// Add missing keys to en.json
function addMissingKeys(keys) {
  let updated = false;
  Object.keys(keys).forEach(str => {
    const key = keys[str];
    if (!hasKey(enData, key.split('.'))) {
      setKey(enData, key.split('.'), str);
      updated = true;
    }
  });
  if (updated) {
    fs.writeFileSync(enFile, JSON.stringify(enData, null, 2), 'utf8');
    console.log('Updated en.json with new keys');
  }
}

function hasKey(obj, keys) {
  let current = obj;
  for (const k of keys) {
    if (!current || typeof current !== 'object') return false;
    current = current[k];
  }
  return current !== undefined;
}

function setKey(obj, keys, value) {
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

console.log('Adding missing keys to en.json...');
addMissingKeys(hardwareStrings);

// Process each component
allComponents.forEach(comp => {
  const filePath = path.join(componentsDir, comp);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${comp} - file not found`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add i18n import if not present
  if (!content.includes("from '../lib/i18n'")) {
    const importLine = "import { useI18n } from '../lib/i18n';";
    const importMatch = content.match(/^import .+\n/m);
    if (importMatch) {
      content = content.replace(/^import .+\n/m, `${importLine}\n${importMatch[0]}`);
    }
  }
  
  // Add useI18n hook call in component function
  // This is the tricky part - need to find where to add it
  const contentMatch = content.match(/export const \w+ = \(\{ theme[\s\S]*?\) => \{[\s\S]*?const isDark/);
  if (contentMatch) {
    const replacement = contentMatch[0].replace(
      'const isDark = theme === \'dark\';',
      `const isDark = theme === 'dark';\n  const { t } = useI18n();`
    );
    content = content.replace(contentMatch[0], replacement);
  }
  
  // Replace hardcoded strings
  Object.keys(hardwareStrings).forEach(hs => {
    const key = hardwareStrings[hs];
    // Escape regex special characters
    const escaped = hs.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    content = content.replace(regex, `t('${key}')`);
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${comp}`);
});

console.log('Done!');
