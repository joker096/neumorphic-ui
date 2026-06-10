import fs from 'fs';
import path from 'path';

const srcDir = path.join(process.cwd(), 'src');
const enFile = path.join(srcDir, 'locales', 'en.json');
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

// All i18n keys needed by SettingsView.tsx
const settingsKeys = {
  // Section headers (in .tsx file, these appear as hardcoded strings)
  "Аккаунт": "settings.accountSection",
  "Внешний вид": "settings.appearanceSection",
  "Уведомления": "settings.notificationsSection",
  "Конфиденциальность и безопасность": "settings.privacySecuritySection",
  "Данные и храни": "settings.dataStorageSection",
  "Сервисы": "settings.servicesSection",
  "Расширенные": "settings.advancedSection",
  "Облачная синхронизация": "settings.cloudSyncSection",
  "Геолокация": "settings.locationSection",
  "Редактор фото": "settings.photoEditorSection",

  // Search
  "Поиск настроек...": "settings.searchPlaceholder",

  // PWA Banner
  "Не сейчас": "settings.installDismiss",
  "Install": "settings.installBtn",

  // Add account
  "Добавить аккаунт": "settings.addAccount",
  "Account Management": "settings.accountManagement",

  // Theme and Appearance
  "Темная тема": "settings.darkTheme",
  "Анимации интерфейса": "settings.uiAnimations",
  "Автоматически": "settings.auto",
  "Размер шрифта": "settings.fontSize",
  "Мелкий": "settings.fontSizeSmall",
  "Средний": "settings.fontSizeMedium",
  "Крупный": "settings.fontSizeLarge",

  // Security
  "App Lock PIN": "settings.appLockPin",
  "Шифрование данных (PBKDF2-SHA256)": "settings.appLockSubtitle",
  "Введите новый PIN (пусто для сброса):": "settings.pinPrompt",
  "Save": "common.save",
  "Cloud Password (TOTP)": "settings.cloudPasswordTitle",
  "Auto-wipe (Dead Man's Switch)": "settings.deadMansSwitch",
  "Уничтожить все данные (Wipe)": "settings.wipeAllData",
  "Подтверждение": "settings.confirm",

  // Privacy
  "Включить": "settings.enable",
  "Выключено": "settings.disabled",
  "Выключен": "settings.disabled",

  // Proxy
  "Прокси": "settings.proxy",
  "Настройка прокси": "settings.proxyDesc",

  // Network
  "Tor": "settings.tor",
  "Автозапуск": "settings.autostart",

  // Cache
  "Очистить кэш": "settings.clearCache",
  "Очистить все": "settings.clearAll",
  "Очистить IndexedDB": "settings.clearIndexedDB",
  "Игнорировать уведомления": "settings.ignoreNotifications",
  "Отключить звук": "settings.disableSound",

  // Backup
  "Импорт бэкапа": "settings.importBackup",
  "JSON backup restore from local file": "settings.importBackupSubtitle",

  // Cloud
  "Облачная синхронизация": "settings.cloudSync",
  "Включить": "settings.enable",
  "Выключена": "settings.disabled",
  "Последняя синхронизация": "settings.lastSync",
  "Никогда": "settings.never",
  "Синхронизировать сейчас": "settings.syncNow",
  "Синхронизация...": "settings.syncing",
  "Sync chats and settings between devices": "settings.cloudSyncSubtitle",
  "Enable cloud synchronization": "settings.enableCloudSync",

  // Location
  "Живые локации": "settings.liveLocations",
  "Статичные локации": "settings.staticLocations",
  "Чат: {chatId}": "settings.locationChat",
  "Остановить": "settings.stopLocation",
  "Удалить": "common.delete",
  "Нет активных шарингов локации": "settings.noActiveSharing",

  // Photo Editor
  "Автосохранение правок": "settings.autoSaveEdits",
  "Сохранять изменения автоматически": "settings.autoSaveChanges",
  "Обрезка": "settings.crop",
  "Рисование": "settings.draw",
  "T Текст": "settings.text",
  "Сохранить": "settings.save",
  "Сбросить": "settings.reset",
  "Область предварительного просмотра изображения": "settings.imagePreview",
  "Инструменты: обрезка (drag to select), рисование (freehand), текст (tap to add), фильтры": "settings.tools",

  // DND
  "Режим DND": "settings.dndMode",
  "С": "settings.from",
  "До": "settings.to",
  "Важные контакты": "settings.priorityContacts",
  "Продвинутая приватность": "settings.advancedPrivacy",

  // Devices
  "Добавить устройство": "common.addDevice",
  "Удалить устройство": "settings.removeDevice",

  // Bots
  "Боты и сервисы": "settings.botsTitle",
  "Активных ботов нет": "settings.noBots",
  "Здесь появятся боты и сторонние интеграции, когда вы их добавите.": "settings.botsComingSoon",

  // System status
  "Уровень заряда": "settings.batteryLevel",
  "3 активных": "settings.meshActive",
  "Последняя сборка": "settings.lastBuild",
};

// Add missing keys to en.json
Object.keys(settingsKeys).forEach(hs => {
  const key = settingsKeys[hs];
  if (!hasKey(enData, key.split('.'))) {
    setKey(enData, key.split('.'), hs);
    console.log(`Added: ${key} = "${hs}"`);
  }
});

// Write updated en.json
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2), 'utf8');

// Now update all locale files
const localeFiles = ['ru', 'de', 'es', 'fr'];
localeFiles.forEach(lang => {
  const filePath = path.join(srcDir, 'locales', `${lang}.json`);
  if (!fs.existsSync(filePath)) return;
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  // Copy missing keys from enData
  Object.keys(enData).forEach(section => {
    Object.keys(enData[section]).forEach(key => {
      if (!data[section] || !data[section][key]) {
        if (!data[section]) data[section] = {};
        data[section][key] = enData[section][key];
      }
    });
  });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${lang}.json`);
});

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

console.log('Done!');
