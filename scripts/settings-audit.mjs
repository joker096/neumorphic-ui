#!/usr/bin/env node
/**
 * settings-audit.mjs — статический аудит настроек (классы S1–S6, AGENTS.md
 * «Settings Cycle»).
 *
 * Проверяет для каждой настройки three orthogonal facts:
 *   S3 persist  — setter/updateSettings-путь пишет localStorage.
 *   S1 UI-control — сеттер ИЛИ updateSettings{ключ} вызывается в продуктивном
 *                 коде настроек (src/components/settings/*, не тесты).
 *   S2 effect/consumer — значение читается вне settings/store/tests/config
 *                 (т.е. реально применяется к приложению).
 *
 * Производные классы:
 *   S4  — рассинхрон persist-ключа чтения/записи (init-ключ ≠ persist-ключ).
 *   S6  — нет UI И нет consumer: мёртвое поле (кандидат на удаление).
 *   S5  — echo/no-op setter (пишет текущее значение) — определить вручную.
 *
 * `hidden` = документированное решение 09-10 (строки скрыты, slice-поля +
 * persist остались). Такие НЕ считаются S1-фичевые (UI намеренно скрыт);
 * они маркируются H и требуют решения пользователя: удалить или вернуть UI.
 *
 * Это ПОДСКАЗЧИК для человека/ИИ, не замена ручного ревью.
 * Usage: node scripts/settings-audit.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLICE = join(ROOT, 'src', 'store', 'slices', 'settingsSlice.ts');
const SRC = join(ROOT, 'src');
const SETTINGS_DIR = join(SRC, 'components', 'settings');

// ---- collect files ---------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const fp = join(dir, entry.name);
    if (entry.isDirectory()) walk(fp, out);
    else if (entry.isFile() && (extname(fp) === '.ts' || extname(fp) === '.tsx')) out.push(fp);
  }
  return out;
}

const appFiles = walk(SRC).filter((f) => !/(\.test\.|\.spec\.)/.test(f));
const sliceSrc = readFileSync(SLICE, 'utf-8');

// ---- parse slice -----------------------------------------------------------

/** map field -> storage key used at init */
const initKey = new Map();
for (const m of sliceSrc.matchAll(/^  (\w+): savedPrivacySettings\.(\w+) \?\?/gm)) {
  if (m[1] && m[2]) initKey.set(m[1], m[2]);
}

// all setter names present in the slice (one-shot regex, works for both
// block-bodied `setX: (v) => { ... },` and single-lined `setX: (v) => set(...),`)
const setterNames = new Set();
for (const s of sliceSrc.matchAll(/^  set(\w+):/gm)) setterNames.add(`set${s[1]}`);
// ---- setter/consumer overrides ---------------------------------------------

// Поля, которые пишутся одним составным сеттером (S4-превент: даём аудиту
// настоящие имена сеттеров, чтобы persist → UI-поля связывались):
const SETTER_OVERRIDES = {
  appLockHashedPIN: ['setAppLock'],
  appLockSalt: ['setAppLock'],
  appLockBiometricEnabled: ['setAppLockBiometric'],
  appLockBiometricCredentialId: ['setAppLockBiometric'],
  appLockAutoLockOnBackground: ['setAppLockAutoLock'],
  appLockIdleSeconds: ['setAppLockAutoLock'],
};

// Поля, чей единственный consumer живёт в store-слое (вне consumerHits-скоупа):
const CONSUMER_OVERRIDES = new Set([
  'forwardAnonymization', // применяется в chatSlice.ts (анонимизация пересылки)
]);

// property bodies of block setters, in the scope of the block (used to attribute
// persist-setting to the setters that own the persist call)
function fieldSetters(field) {
  const out = [];
  if (SETTER_OVERRIDES[field]) {
    for (const n of SETTER_OVERRIDES[field]) if (setterNames.has(n)) out.push(n);
    return out;
  }
  const cap = field.charAt(0).toUpperCase() + field.slice(1);
  for (const cand of [`set${cap}`, `set${cap}Enabled`, `set${cap}On`]) {
    if (setterNames.has(cand)) out.push(cand);
  }
  return out;
}
// does the slice persist this field by its own key somewhere?
function persistCalls(field) {
  const re = new RegExp(`persist(?:Setting|EncryptedSetting)\\(['"](${field})['"]`, 'g');
  const hits = [];
  let m;
  while ((m = re.exec(sliceSrc)) !== null) hits.push(m[1]);
  return hits.length ? hits : null;
}
/** setter registry built lazily per field */
function setterInfo(field) {
  const setters = fieldSetters(field);
  if (!setters.length) return null; // field written only via updateSettings (allowlist)
  const per = persistCalls(field);
  return {
    setterNames: setters,
    persist: per ? 'OK' : 'NONE',
    persistCalls: per ?? ['NONE'],
  };
}

// ---- usage helpers ---------------------------------------------------------

function hasToken(fp, re) {
  const src = readFileSync(fp, 'utf-8');
  re.lastIndex = 0;
  return re.test(src);
}

function occurrencesIn(fileList, token) {
  const re = new RegExp(`\\b${token}\\b`, 'g');
  const hits = [];
  for (const fp of fileList) {
    const src = readFileSync(fp, 'utf-8');
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split('\n').length;
      hits.push(`${rel(fp)}:${line}`);
    }
  }
  return hits;
}

function rel(fp) {
  return fp.startsWith(ROOT) ? fp.slice(ROOT.length + 1).replace(/\\/g, '/') : fp;
}

const isSettings = (fp) => fp.startsWith(SETTINGS_DIR);
const isStore = (fp) => /\\store\\|\\store\//.test(fp);
const isConfig = (fp) => fp.includes('settingsDefaults.ts');
const isUiStore = (fp) => fp.includes('uiStore.ts');
const isNotifSlice = (fp) => fp.includes('notificationSlice.ts');
const isChainDeep = (fp) => fp.includes(`lib${'\\'}p2p`) || fp.includes(`lib/p2p`);

/**
 * UI write detection. Handles renamed props:
 *  - `setNotificationsEnabled(...)` ← `setNotifications`
 *  - `setAutoReconnectEnabled(...)` ← `setAutoReconnect`
 *  - `updateSettings({ key: ... })`
 */
function uiWriteHits(field) {
  const hits = [];
  const files = appFiles.filter((fp) => isSettings(fp));
  const info = setterInfo(field);
  const setterNames = info ? info.setterNames : [];
  const cap = field.charAt(0).toUpperCase() + field.slice(1);
  const variants = [...setterNames];
  for (const v of [`set${cap}Enabled`, `set${cap}`, `toggle${cap.replace(/(.)$/, c => c.toUpperCase())}`]) {
    variants.push(v);
  }
  for (const fp of files) {
    const src = readFileSync(fp, 'utf-8');
    for (const name of variants) {
      if (!name) continue;
      // optional-chaining setX?.(...) тоже вызов
      if (new RegExp(`\\b${name}(?:\\?)?\\.?\\s*\\(`).test(src)) hits.push(`${rel(fp)}`);
      for (const tok of [`updateSettings({ ${field}:`, `updateSettings({'${field}'`, `onUpdateSettings({ ${field}:`]) {
        if (src.includes(tok)) hits.push(`${rel(fp)} (${tok.trim().split(' ')[0]})`);
      }
    }
  }
  return [...new Set(hits)];
}

/** Consumer reads: field referenced outside settings/store/tests/config */
function consumerHits(field) {
  const hits = [];
  for (const fp of appFiles) {
    if (isSettings(fp) || isConfig(fp) || isUiStore(fp) || isNotifSlice(fp)) continue;
    if (isStore(fp) && !CONSUMER_OVERRIDES.has(field)) continue;
    if (field === 'currentLanguage' && fp.includes('LanguageSection')) continue; // UI includes
    if (occFieldInFile(fp, field)) hits.push(rel(fp));
  }
  return hits;
}

function occFieldInFile(fp, field) {
  const src = readFileSync(fp, 'utf-8');
  const re = new RegExp(`\\b${field}\\b`, 'g');
  // read = появляется как `field`, `state.field`, `s.field`, `.field`, destructuring `field,`
  return re.test(src);
}

// ---- registry --------------------------------------------------------------

const REGISTRY = [
  ['soundEnabled', 'main', false, 'Тумблер «Звук» в SettingsMainMenu'],
  ['soundVolume', 'main', false, 'Громкость звука'],
  ['notifications', 'main', false, 'Глобальный тумблер «Уведомления»'],
  ['forwardAnonymization', 'privacy', false, 'Анонимизация пересылаемых данных'],
  ['onlineStatus', 'privacy', false, 'Видимость «онлайн»'],
  ['stealthMode', 'privacy', false, 'Стелс-режим'],
  ['ghostViewMode', 'privacy', false, 'Скрытие «видел»'],
  ['deliveryReceipts', 'privacy', false, 'Галочки доставки'],
  ['readReceipts', 'privacy', false, 'Галочки прочтения'],
  ['typingIndicators', 'privacy', false, 'Индикатор набора'],
  ['dndEnabled', 'privacy', false, 'Не беспокоить'],
  ['dndFrom', 'privacy', false, 'DND начало'],
  ['dndTo', 'privacy', false, 'DND конец'],
  ['priorityContacts', 'privacy', false, 'Приоритетные контакты (DND)'],
  ['mediaAutoLoad', 'privacy', false, 'Автозагрузка медиа'],
  ['selfDestructDefault', 'privacy', false, 'Самоуничтожение по умолчанию'],
  ['twoFactor', 'security', false, '2FA TOTP'],
  ['totpSecret', 'security', false, 'Секрет TOTP'],
  ['appLockHashedPIN', 'security', false, 'Hash PIN'],
  ['appLockSalt', 'security', false, 'Salt PIN'],
  ['appLockBiometricEnabled', 'security', false, 'Биометрия'],
  ['appLockBiometricCredentialId', 'security', false, 'Credential биометрии'],
  ['appLockAutoLockOnBackground', 'security', false, 'Автоблокировка фон'],
  ['appLockIdleSeconds', 'security', false, 'Таймаут автоблокировки'],
  ['turnServerUrl', 'network', false, 'TURN URL'],
  ['turnServerUser', 'network', false, 'TURN user'],
  ['turnServerPass', 'network', false, 'TURN pass'],
  ['relayBackend', 'network', false, 'Релейный backend'],
  ['autoReconnect', 'network', false, 'Автореконнект'],
  ['obfuscationEnabled', 'network', false, 'Обфускация трафика'],
  ['saveAudioRecordings', 'calls', false, 'Сохранять аудио звонков'],
  ['saveVideoRecordings', 'calls', false, 'Сохранять видео звонков'],
  ['autoRecordCalls', 'calls', false, 'Автозапись звонков'],
  ['recordingsRetentionDays', 'calls', false, 'Ретенция записей'],
  ['themeMode', 'appearance', false, 'Тема light/dark/system'],
  ['accentColor', 'appearance', false, 'Акцент-цвет'],
  ['chatBackground', 'appearance', false, 'Фон чата'],
  ['customChatBackground', 'appearance', false, 'Кастомный фон'],
  ['density', 'appearance', false, 'Плотность списка'],
  ['messageRadius', 'appearance', false, 'Радиус сообщений'],
  ['animationIntensity', 'appearance', false, 'Интенсивность анимаций'],
  ['uiAnimations', 'appearance', false, 'UI анимации'],
  ['spamFilter', 'privacy', false, 'Скрывает чаты не-контактов (useFilteredChats)'],
  ['draftsEnabled', 'storage', false, 'Гейт сохранения черновиков (App.tsx)'],
  ['offlineMode', 'storage', false, 'Гейт офлайн-очереди (useOfflineQueue)'],
];

// ---- main ------------------------------------------------------------------

const FINDINGS = [];
const INFO = [];

for (const [field, section, hidden, note] of REGISTRY) {
  const info = setterInfo(field);
  const persist = info ? (info.persist === 'OK' ? `OK(${info.persistCalls.join(',')})` : 'NONE') : 'n/a(updateSettings)';
  const uiHits = uiWriteHits(field);
  const ui = uiHits.length > 0;
  const consumers = consumerHits(field);
  const consumer = consumers.length > 0;
  const init = initKey.get(field);

  let s4 = false;
  if (info?.persist === 'OK' && init && !info.persistCalls.includes(init)) s4 = true;
  const s3 = (info ? info.persist === 'NONE' : false) && !hidden; // hidden: persist-слой намеренно сохранён
  const s1 = hidden ? false : !ui; // hidden: UI намеренно скрыт — не S1
  const s2 = hidden ? false : !consumer; // hidden: отсутствие consumer = решение 09-10, не S2
  const s6 = hidden ? false : !ui && !consumer;

  const parts = [];
  if (s3) parts.push('S3');
  if (s4) parts.push('S4');
  if (s1) parts.push('S1');
  if (s2) parts.push('S2');
  const cls = parts.length ? parts.join('+') : (hidden ? 'H' : (consumer ? 'OK' : 'OK'));

  const rec = { field, section, hidden, persist, ui, consumer, cls, init, note, consumers };
  if (cls !== 'OK' && cls !== 'H') FINDINGS.push(rec);
  else INFO.push(rec);
}

// ---- report ----------------------------------------------------------------

console.log('\n=== SETTINGS AUDIT ===');
console.log(`Settings scanned: ${REGISTRY.length}`);
const hiddenFields = INFO.filter(r => r.hidden).map(r => r.field);
console.log(`Findings: ${FINDINGS.length} (OK/H отдельно: ${INFO.length}, hidden: ${hiddenFields.length})`);

const byClass = new Map();
for (const f of FINDINGS) {
  if (!byClass.has(f.cls)) byClass.set(f.cls, []);
  byClass.get(f.cls).push(f);
}
const order = ['S3', 'S4', 'S1', 'S1+S2', 'S1+S2+S6', 'S2'];
for (const cls of [...byClass.keys()].sort((a, b) => {
  const ia = order.indexOf(a), ib = order.indexOf(b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
})) {
  const list = byClass.get(cls);
  console.log(`\n[${cls}] ${list.length}`);
  for (const f of list) {
    const hiddenMark = f.hidden ? ' (hidden)' : '';
    console.log(`  ${f.field}${hiddenMark} [${f.section}] — ${f.note} | persist=${f.persist} init=${f.init ?? '-'} ui=${f.ui} consumer=${f.consumer}`);
    if (!f.ui) console.log(`      ui hits: ${f.hidden ? 'hidden-by-design' : 'NONE'}`);
    if (f.consumer) for (const c of f.consumers.slice(0,3)) console.log(`      consumer: ${c}`);
  }
}
console.log(`\nHidden (09-10, решение за пользователем): ${hiddenFields.join(', ') || 'нет — все поля имеют UI или consumer'}`);

process.exit(FINDINGS.filter((f) => f.cls.includes('S3') || f.cls.includes('S4') || f.cls.includes('S1+S2') || f.cls.includes('S1') || f.cls.includes('S2') && !f.hidden).length > 0 ? 2 : 0);