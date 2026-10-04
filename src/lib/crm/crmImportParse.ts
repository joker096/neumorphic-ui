import type { ImportFormat, RawRecord } from './crmImportTypes';

/** CSV (RFC-4180-ish: quoted fields, escaped quotes, CRLF) → raw records. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i += 1; continue;
      }
      field += ch; i += 1; continue;
    }
    if (ch === '"') { inQuotes = true; i += 1; continue; }
    if (ch === ',') { row.push(field); field = ''; i += 1; continue; }
    if (ch === '\r') { i += 1; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i += 1; continue; }
    field += ch; i += 1;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export function parseCsvToRecords(text: string): RawRecord[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const records: RawRecord[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const rec: RawRecord = {};
    rows[r].forEach((val, ci) => {
      const key = header[ci] ?? `col${ci}`;
      rec[key] = val;
    });
    records.push(rec);
  }
  return records;
}

/** JSON object → raw record (values stringified, keys lowercased). */
export function objToRaw(obj: unknown): RawRecord {
  const rec: RawRecord = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (v == null) continue;
      rec[k.toLowerCase()] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
  }
  return rec;
}

export function isStructured(parsed: any): boolean {
  return parsed && typeof parsed === 'object' &&
    (Array.isArray(parsed.contacts) || Array.isArray(parsed.deals) || Array.isArray(parsed.tasks));
}

export function detectFormat(text: string, hint?: ImportFormat): ImportFormat {
  if (hint) return hint;
  const t = text.trimStart();
  return t.startsWith('{') || t.startsWith('[') ? 'json' : 'csv';
}

/** Single JSON object: no separate deal/task arrays; deals/tasks come from
 * the same record via column detection, so mirror contact records. */
export function perObjectContactsOnly(recs: RawRecord[]): RawRecord[] {
  return recs;
}