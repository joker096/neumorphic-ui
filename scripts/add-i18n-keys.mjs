/**
 * add-i18n-keys.mjs — insert new keys into specific namespaces of every locale,
 * touching as few lines as possible.
 *
 * JSON re-serialisation would rewrite every line of a ~5000-line locale file
 * (and risks EOL/BOM churn), so this edits the raw text: locate the namespace
 * object by brace-depth walk, then insert formatted key lines before its closing
 * brace. Existing keys are detected via JSON.parse, not by text matching.
 *
 * Usage: node scripts/add-i18n-keys.mjs [--write]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const WRITE = process.argv.includes('--write');
const LOCALES = ['en', 'ru', 'de', 'es', 'fr', 'ja', 'ko', 'zh'];

const T = {
  type: { en: 'Type', ru: 'Тип', de: 'Typ', es: 'Tipo', fr: 'Type', ja: '種類', ko: '유형', zh: '类型' },
  subtype: { en: 'Subtype', ru: 'Подтип', de: 'Untertyp', es: 'Subtipo', fr: 'Sous-type', ja: 'サブタイプ', ko: '하위 유형', zh: '子类型' },
  value: { en: 'Value', ru: 'Значение', de: 'Wert', es: 'Valor', fr: 'Valeur', ja: '値', ko: '값', zh: '值' },
  snippet: { en: 'Embed snippet', ru: 'Код для встраивания', de: 'Einbettungs-Snippet', es: 'Fragmento para insertar', fr: 'Extrait d’intégration', ja: '埋め込みコード', ko: '임베드 코드', zh: '嵌入代码' },
  amount: { en: 'Amount', ru: 'Сумма', de: 'Betrag', es: 'Importe', fr: 'Montant', ja: '金額', ko: '금액', zh: '金额' },
  currency: { en: 'Currency', ru: 'Валюта', de: 'Währung', es: 'Moneda', fr: 'Devise', ja: '通貨', ko: '통화', zh: '货币' },
  visibility: { en: 'Visibility', ru: 'Видимость', de: 'Sichtbarkeit', es: 'Visibilidad', fr: 'Visibilité', ja: '公開範囲', ko: '공개 범위', zh: '可见性' },
};

/** namespace -> [key, translation-table] */
const ADD = {
  contacts: [['fieldTypeLabel', T.type], ['fieldSubtypeLabel', T.subtype], ['fieldValue', T.value]],
  company: [['embedSnippet', T.snippet]],
  payRequests: [['amount', T.amount], ['currency', T.currency]],
  payments: [['amount', T.amount], ['currency', T.currency]],
  settings: [['fieldTypeLabel', T.type], ['fieldVisibility', T.visibility]],
};

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

/** index of the `}` that closes the object opened at `openIdx` */
function blockEnd(code, openIdx) {
  let depth = 0, inStr = false, escCh = false;
  for (let i = openIdx; i < code.length; i++) {
    const c = code[i];
    if (inStr) {
      if (escCh) escCh = false;
      else if (c === '\\') escCh = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return -1;
}

function insertIntoNamespace(code, ns, entries, lang) {
  const head = new RegExp(`^\\s{2}"${ns}":\\s*\\{`, 'm');
  const hm = head.exec(code);
  if (!hm) throw new Error(`namespace ${ns} not found (${lang})`);
  const openIdx = hm.index + hm[0].length - 1;
  const end = blockEnd(code, openIdx);
  if (end === -1) throw new Error(`unbalanced braces for ${ns} (${lang})`);

  const lineStart = code.lastIndexOf('\n', end) + 1;
  const todo = entries.filter(([k]) => !(k in JSON.parse(code)[ns]));
  if (todo.length === 0) return { code, added: 0 };

  // previous last entry needs a trailing comma once we append
  let prev = code.slice(openIdx, lineStart).trimEnd();
  const withComma = prev.endsWith(',') ? prev : `${prev},`;

  // note: no trailing comma — JSON forbids it before the closing brace
  const block = `\n${todo
    .map(([k, table]) => {
      const val = table[lang];
      if (val === undefined) throw new Error(`no ${lang} translation for ${ns}.${k}`);
      return `    "${k}": "${esc(val)}"`;
    })
    .join(',\n')}`;

  return {
    code: code.slice(0, openIdx + 1) + withComma.slice(1) + block + '\n' + code.slice(lineStart),
    added: todo.length,
  };
}

let total = 0;
for (const lang of LOCALES) {
  const file = resolve(ROOT, 'src', 'locales', `${lang}.json`);
  const original = readFileSync(file, 'utf-8');
  let code = original;
  let added = 0;
  for (const [ns, entries] of Object.entries(ADD)) {
    const r = insertIntoNamespace(code, ns, entries, lang);
    code = r.code;
    added += r.added;
  }
  const before = Object.keys(JSON.parse(original)).length;
  const after = JSON.parse(code);
  if (Object.keys(after).length !== before) throw new Error(`${lang}: top-level key count changed`);
  if (WRITE && added > 0) writeFileSync(file, code);
  total += added;
  console.log(`${lang}.json: ${added} keys ${WRITE ? 'written' : 'planned'}`);
}
console.log(`total: ${total}`);
