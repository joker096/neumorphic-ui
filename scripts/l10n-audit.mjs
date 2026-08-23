/**
 * l10n-audit.mjs — Localization check loop "everywhere".
 *
 * Scans the whole project for localization problems:
 *   1. Every locale bundle (src/locales, public/landing/lang, ...).
 *   2. Key parity: each non-en locale must have the exact same keys as en.json
 *      (missing keys to add, extra keys to remove).
 *   3. Placeholder parity: {{token}} sets must match English.
 *   4. Empty / untranslated values.
 *   5. JSON validity + duplicate keys.
 *   6. Cross-bundle language parity (app vs landing must expose same langs).
 *   7. Source usage: every literal t('key') / getTranslation('key') in src must
 *      exist in the reference (en.json) catalog.
 *   8. Heuristic hardcoded user-facing strings in .tsx (opt-in: --strict).
 *
 * Exit code: 0 = clean, 1 = errors found.
 *
 * Usage:
 *   node scripts/l10n-audit.mjs                 # report only
 *   node scripts/l10n-audit.mjs --fix           # seed missing keys (copy English)
 *   node scripts/l10n-audit.mjs --fix-extras    # also prune keys not in English
 *   node scripts/l10n-audit.mjs --strict        # also run hardcoded-string heuristic
 *   node scripts/l10n-audit.mjs --json          # machine-readable summary
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = new Set(process.argv.slice(2));
const FIX = args.has('--fix');
const FIX_EXTRAS = args.has('--fix-extras');
const STRICT = args.has('--strict');
const AS_JSON = args.has('--json');

const REFERENCE = 'en';

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/**
 * Flatten a nested object into a "a.b.c" key -> value map.
 *
 * Keys that themselves contain a dot (e.g. en.json's literal "audience.all"
 * nested under "story") are treated as atomic leaves so the flat key matches
 * exactly how the runtime i18n loader addresses them.
 */
function flatten(obj, prefix = '', out = new Map()) {
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];
    if (!key.includes('.') && val && typeof val === 'object' && !Array.isArray(val) && !isPlural(val)) {
      flatten(val, full, out);
    } else {
      out.set(full, val);
    }
  }
  return out;
}

/**
 * Detect ICU plural objects ({ zero, one, few, many, other }) so they are
 * treated as a single leaf rather than recursed into (which would drop the
 * parent key and falsely report it as missing).
 */
function isPlural(val) {
  if (!val || typeof val !== 'object' || Array.isArray(val)) return false;
  const keys = Object.keys(val);
  if (keys.length === 0) return false;
  return keys.every((k) => ['zero', 'one', 'two', 'few', 'many', 'other'].includes(k));
}

/** Parse a dotted key into its parts. */
function parts(key) {
  return key.split('.');
}

/** Set a nested value by dotted key, creating intermediate objects. */
function setNested(obj, key, value) {
  const p = parts(key);
  let cur = obj;
  for (let i = 0; i < p.length - 1; i++) {
    const k = p[i];
    if (typeof cur[k] !== 'object' || cur[k] === null || Array.isArray(cur[k])) {
      cur[k] = {};
    }
    cur = cur[k];
  }
  cur[p[p.length - 1]] = value;
}

/** Keep only keys present in `enFlat`, copying current values. */
function pruneToSchema(obj, enFlat) {
  const langFlat = flatten(obj);
  const out = {};
  for (const key of enFlat.keys()) {
    if (langFlat.has(key)) setNested(out, key, langFlat.get(key));
  }
  return out;
}

/** Extract {{token}} names (sorted, deduped). */
function placeholders(value) {
  if (typeof value !== 'string') return [];
  const re = /\{\{\s*(\w+)\s*\}\}/g;
  const set = new Set();
  let m;
  while ((m = re.exec(value))) set.add(m[1]);
  return [...set].sort();
}

/** Collect duplicate top-level/any keys by re-scanning raw object. */
function findDuplicates(obj, prefix = '', seen = new Map(), dups = new Set()) {
  for (const key of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (seen.has(key) && seen.get(key) === prefix) dups.add(full);
    seen.set(key, prefix);
    const val = obj[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      findDuplicates(val, full, new Map(), dups);
    }
  }
  return dups;
}

/* ------------------------------------------------------------------ */
/* Locale bundles                                                     */
/* ------------------------------------------------------------------ */

const BUNDLES = [
  { name: 'app', dir: join(ROOT, 'src', 'locales') },
  { name: 'landing', dir: join(ROOT, 'public', 'landing', 'lang') },
];

function loadBundle(bundle) {
  const dir = bundle.dir;
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
  const langs = {};
  const errors = [];
  for (const file of files) {
    const lang = file.replace(/\.json$/, '');
    const full = join(dir, file);
    try {
      const raw = readFileSync(full, 'utf-8');
      const parsed = JSON.parse(raw);
      langs[lang] = { parsed, raw, path: full };
    } catch (e) {
      errors.push({ lang, file: full, error: e.message });
    }
  }
  return { dir, files, langs, errors };
}

/* ------------------------------------------------------------------ */
/* Source usage scan                                                  */
/* ------------------------------------------------------------------ */

const USAGE_RE =
  /(?:\b(?:t|translate|getTranslation|getTranslationWithFallback)\s*\(\s*(['"`])((?:[^'"`\\]|\\.)+)\1)/g;

function walk(dir, exts, exclude, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (exclude.some((x) => full.includes(x))) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, exts, exclude, out);
    else if (exts.includes(full.slice(full.lastIndexOf('.')).toLowerCase())) out.push(full);
  }
  return out;
}

function scanUsage() {
  const srcDir = join(ROOT, 'src');
  const files = walk(
    srcDir,
    ['.ts', '.tsx'],
    ['.test.', '.spec.', 'node_modules', 'dist', join('lib', 'i18n.tsx'), join('lib', 'i18n.test.ts')],
  );
  const used = new Map(); // key -> [files]
  const dynamic = new Set();
  for (const file of files) {
    const code = readFileSync(file, 'utf-8');
    let m;
    USAGE_RE.lastIndex = 0;
    while ((m = USAGE_RE.exec(code))) {
      const key = m[2];
      if (key.includes('${')) {
        dynamic.add(`${relative(ROOT, file)}: ${key}`);
        continue;
      }
      if (!used.has(key)) used.set(key, new Set());
      used.get(key).add(relative(ROOT, file));
    }
  }
  return { used, dynamic, fileCount: files.length };
}

/* ------------------------------------------------------------------ */
/* Audit                                                              */
/* ------------------------------------------------------------------ */

const report = {
  bundles: [],
  crossBundleErrors: [],
  usageErrors: [],
  usageWarnings: [],
  hardcoded: [],
  totals: { errors: 0, warnings: 0 },
};

function isError() {
  return report.totals.errors > 0;
}

for (const bundle of BUNDLES) {
  const loaded = loadBundle(bundle);
  if (!loaded) {
    report.bundles.push({ name: bundle.name, dir: bundle.dir, skipped: true });
    continue;
  }
  const { langs, errors: jsonErrors, files } = loaded;

  const bundleReport = {
    name: bundle.name,
    dir: bundle.dir,
    jsonErrors: [],
    missing: [], // {lang, key}
    extra: [], // {lang, key}
    placeholders: [], // {lang, key, missing, extra}
    empty: [], // {lang, key}
    duplicates: [], // {lang, key}
    langParity: { ok: true, enCount: 0, langs: [] },
  };

  for (const e of jsonErrors) {
    bundleReport.jsonErrors.push(e);
    report.totals.errors++;
  }
  if (bundleReport.jsonErrors.length) {
    report.bundles.push(bundleReport);
    continue;
  }

  if (!langs[REFERENCE]) {
    bundleReport.jsonErrors.push({ lang: REFERENCE, error: `reference language ${REFERENCE}.json missing` });
    report.totals.errors++;
    report.bundles.push(bundleReport);
    continue;
  }

  const enFlat = flatten(langs[REFERENCE].parsed);
  const enKeys = new Set(enFlat.keys());
  bundleReport.langParity.enCount = enKeys.size;
  bundleReport.langParity.langs = Object.keys(langs).sort();

  for (const lang of Object.keys(langs).sort()) {
    if (lang === REFERENCE) continue;
    const flat = flatten(langs[lang].parsed);
    const langKeys = new Set(flat.keys());

    // missing keys (in en, not in lang)
    for (const key of enKeys) {
      if (!langKeys.has(key)) bundleReport.missing.push({ lang, key });
    }
    // extra keys (in lang, not in en)
    for (const key of langKeys) {
      if (!enKeys.has(key)) bundleReport.extra.push({ lang, key });
    }
    // placeholders + empty (only for keys present in both)
    for (const [key, enVal] of enFlat) {
      if (!langKeys.has(key)) continue;
      const lv = flat.get(key);
      const enPh = placeholders(enVal).join(',');
      const lvPh = placeholders(lv).join(',');
      if (enPh !== lvPh) {
        const e = placeholders(enVal);
        const l = placeholders(lv);
        bundleReport.placeholders.push({
          lang,
          key,
          missing: e.filter((x) => !l.includes(x)),
          extra: l.filter((x) => !e.includes(x)),
        });
      }
      if (lv === '' || lv == null) bundleReport.empty.push({ lang, key });
    }
  }

  // duplicates within each file
  for (const lang of Object.keys(langs)) {
    const dups = findDuplicates(langs[lang].parsed);
    for (const d of dups) bundleReport.duplicates.push({ lang, key: d });
  }

  report.totals.errors += bundleReport.missing.length;
  report.totals.errors += bundleReport.extra.length;
  report.totals.errors += bundleReport.placeholders.length;
  report.totals.errors += bundleReport.duplicates.length;
  report.totals.warnings += bundleReport.empty.length;

  // --fix: seed missing keys with English values
  if ((FIX || FIX_EXTRAS) && (bundleReport.missing.length || bundleReport.extra.length)) {
    for (const lang of Object.keys(langs).sort()) {
      if (lang === REFERENCE) continue;
      let obj = langs[lang].parsed;
      if (FIX_EXTRAS) {
        obj = pruneToSchema(obj, enFlat);
      }
      if (FIX) {
        for (const { key } of bundleReport.missing.filter((m) => m.lang === lang)) {
          setNested(obj, key, enFlat.get(key));
        }
      }
      writeFileSync(langs[lang].path, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
    }
    bundleReport.fixed = true;
  }

  report.bundles.push(bundleReport);
}

/* Cross-bundle language parity */
const langSets = report.bundles.filter((b) => !b.missing && b.langParity).map((b) => ({
  name: b.name,
  langs: new Set(b.langParity.langs),
}));
if (langSets.length >= 2) {
  const [first, ...rest] = langSets;
  for (const other of rest) {
    const onlyFirst = [...first.langs].filter((l) => !other.langs.has(l));
    const onlyOther = [...other.langs].filter((l) => !first.langs.has(l));
    if (onlyFirst.length || onlyOther.length) {
      report.crossBundleErrors.push({
        a: first.name,
        b: other.name,
        onlyInA: onlyFirst,
        onlyInB: onlyOther,
      });
      report.totals.errors++;
    }
  }
}

/* Source usage vs app catalog */
const appBundle = report.bundles.find((b) => b.name === 'app');
if (appBundle && appBundle.langParity && (!appBundle.jsonErrors || appBundle.jsonErrors.length === 0)) {
  const enFlat = flatten(JSON.parse(readFileSync(join(ROOT, 'src', 'locales', 'en.json'), 'utf-8')));
  const { used, dynamic } = scanUsage();
  for (const [key, files] of used) {
    if (!enFlat.has(key)) {
      report.usageErrors.push({ key, files: [...files] });
      report.totals.errors++;
    }
  }
  for (const d of dynamic) report.usageWarnings.push(d);
  report.totals.warnings += dynamic.size;
}

/* Strict: heuristic hardcoded user-facing strings in .tsx */
if (STRICT) {
  const files = walk(join(ROOT, 'src'), ['.tsx'], ['.test.', '.spec.', 'node_modules', 'dist']);
  const PROP_RE =
    /\b(?:placeholder|title|aria-label|alt|label|ariaLabel|aria-placeholder)\s*=\s*(['"])((?:[^'"]|\{\{[^}]+\}\}|<[^>]+>)*?)\1/g;
  const JSX_TEXT_RE = />([^<>{}]+)<\/(?:[A-Za-z][\w]*|\s)/g;
  for (const file of files) {
    const code = readFileSync(file, 'utf-8');
    // skip lines that already pass through t(...)
    const rel = relative(ROOT, file);
    let m;
    PROP_RE.lastIndex = 0;
    while ((m = PROP_RE.exec(code))) {
      const val = m[2].trim();
      if (val && !val.includes('{') && !/\d+/.test(val) && val.length > 1) {
        report.hardcoded.push({ file: rel, kind: 'prop', value: val });
      }
    }
    JSX_TEXT_RE.lastIndex = 0;
    while ((m = JSX_TEXT_RE.exec(code))) {
      const val = m[1].trim();
      if (val && !val.includes('{') && val.length > 1 && /[A-Za-z]{3,}/.test(val)) {
        // ignore the import/export noise by checking it's plain text in a tag
        report.hardcoded.push({ file: rel, kind: 'jsx-text', value: val });
      }
    }
  }
  report.totals.warnings += report.hardcoded.length;
}

/* ------------------------------------------------------------------ */
/* Output                                                             */
/* ------------------------------------------------------------------ */

if (AS_JSON) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(isError() ? 1 : 0);
}

console.log('\n=== LOCALIZATION AUDIT ===\n');

for (const b of report.bundles) {
  if (b.skipped) {
    console.log(`[SKIP] bundle "${b.name}" — directory not found: ${b.dir}`);
    continue;
  }
  console.log(`\n## Bundle: ${b.name} (${b.dir})`);
  if (b.jsonErrors.length) {
    console.log('  JSON ERRORS:');
    for (const e of b.jsonErrors) console.log(`    - ${e.lang}: ${e.error}`);
  }
  const counts = [];
  if (b.missing?.length) counts.push(`missing=${b.missing.length}`);
  if (b.extra?.length) counts.push(`extra=${b.extra.length}`);
  if (b.placeholders?.length) counts.push(`placeholder=${b.placeholders.length}`);
  if (b.empty?.length) counts.push(`empty=${b.empty.length}`);
  if (b.duplicates?.length) counts.push(`dup=${b.duplicates.length}`);
  console.log(`  en keys: ${b.langParity?.enCount} | langs: ${(b.langParity?.langs || []).join(', ')}`);
  if (counts.length) console.log(`  ${counts.join('  ')}${b.fixed ? '  [FIXED]' : ''}`);

  const show = (label, items, fmt) => {
    if (!items.length) return;
    console.log(`  ${label}:`);
    const byLang = {};
    for (const it of items) (byLang[it.lang] ??= []).push(it);
    for (const [lang, list] of Object.entries(byLang)) {
      console.log(`    [${lang}]`);
      for (const it of list.slice(0, 200)) console.log(`      - ${fmt(it)}`);
      if (list.length > 200) console.log(`      ... +${list.length - 200} more`);
    }
  };
  show('MISSING KEYS (need translation)', b.missing || [], (i) => i.key);
  show('EXTRA KEYS (not in en.json — prune)', b.extra || [], (i) => i.key);
  show(
    'PLACEHOLDER MISMATCH',
    b.placeholders || [],
    (i) => `${i.key}  missing=[${i.missing}] extra=[${i.extra}]`,
  );
  show('EMPTY VALUES (untranslated)', b.empty || [], (i) => i.key);
  show('DUPLICATE KEYS', b.duplicates || [], (i) => i.key);
}

if (report.crossBundleErrors.length) {
  console.log('\n## Cross-bundle language parity');
  for (const e of report.crossBundleErrors) {
    console.log(`  ${e.a} vs ${e.b}`);
    if (e.onlyInA.length) console.log(`    only in ${e.a}: ${e.onlyInA.join(', ')}`);
    if (e.onlyInB.length) console.log(`    only in ${e.b}: ${e.onlyInB.join(', ')}`);
  }
}

if (report.usageErrors.length) {
  console.log('\n## Source usage — unknown keys (used in src, absent in en.json)');
  for (const u of report.usageErrors) {
    console.log(`  - ${u.key}  (${u.files.join(', ')})`);
  }
}
if (report.usageWarnings.length) {
  console.log(`\n## Source usage — dynamic keys (not statically checkable): ${report.usageWarnings.length}`);
  if (STRICT) report.usageWarnings.slice(0, 50).forEach((d) => console.log(`  - ${d}`));
}

if (STRICT && report.hardcoded.length) {
  console.log(`\n## Heuristic hardcoded strings (WARNING, review manually): ${report.hardcoded.length}`);
  report.hardcoded.slice(0, 100).forEach((h) => console.log(`  - ${h.file} [${h.kind}] "${h.value}"`));
}

console.log('\n=== SUMMARY ===');
console.log(`  errors:   ${report.totals.errors}`);
console.log(`  warnings: ${report.totals.warnings}`);
console.log(isError() ? '  RESULT: FAIL' : '  RESULT: PASS');
console.log('');

process.exit(isError() ? 1 : 0);
