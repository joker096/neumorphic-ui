/**
 * Universal CRM importer (M1.1).
 *
 * Parses competitor / spreadsheet exports (CSV or JSON) and maps them to the
 * Mess&Anger CRM domain model (CrmContact / Deal / CrmTask). Designed for
 * privacy-first, local-only migration — no network, no cloud, no telemetry.
 *
 * Two source shapes are supported:
 *  - Flat rows (CSV, or JSON array of flat objects, or single JSON object):
 *    each row becomes one contact, optionally with one deal + one task.
 *  - Structured JSON: { contacts: [...], deals: [...], tasks: [...] }.
 */

import type {
  CrmContact,
  CrmContactStatus,
  CrmTask,
  Deal,
  DealStage,
  SystemRole,
  TaskPriority,
} from './types';
import { CRM_DEFAULT_DEAL_STAGE } from '../../constants/crmConstants';

export type ImportFormat = 'csv' | 'json';

export interface RawRecord {
  [key: string]: string;
}

export type ImportIssueCode =
  | 'unknown-status'
  | 'unknown-stage'
  | 'unknown-priority'
  | 'row-skipped';

export interface ImportIssue {
  row: number;
  field?: string;
  code: ImportIssueCode;
  value?: string;
  severity: 'error' | 'warning';
}

export interface DraftContact {
  displayName: string;
  phone?: string;
  email?: string;
  status: CrmContactStatus;
  tags: string[];
  title?: string;
  notes?: string;
  role: SystemRole;
}

export interface DraftDeal {
  title: string;
  contactRef?: string;
  stage: DealStage;
  amount: number;
  currency: string;
  notes?: string;
  expectedClose?: number | null;
}

export interface DraftTask {
  title: string;
  contactRef?: string;
  dealRef?: string;
  priority: TaskPriority;
  due?: string;
  done: boolean;
}

export interface ImportPlan {
  contacts: DraftContact[];
  deals: DraftDeal[];
  tasks: DraftTask[];
  issues: ImportIssue[];
  stats: { contacts: number; deals: number; tasks: number; errors: number; warnings: number };
}

export interface ImportOptions {
  defaultOwnerId?: string;
  defaultCurrency?: string;
  existingContacts?: CrmContact[];
  skipDuplicates?: boolean;
  formatHint?: ImportFormat;
  source?: string;
}

export interface ImportResult {
  contacts: CrmContact[];
  mergedContacts: CrmContact[];
  deals: Deal[];
  tasks: CrmTask[];
  issues: ImportIssue[];
  stats: {
    importedContacts: number;
    mergedContacts: number;
    importedDeals: number;
    importedTasks: number;
    duplicatesSkipped: number;
    errors: number;
    warnings: number;
  };
}

// ---------------------------------------------------------------------------
// Alias tables (lowercase keys; headers are normalised to lowercase)
// ---------------------------------------------------------------------------

const NAME_ALIASES = [
  'name', 'fullname', 'full name', 'displayname', 'display name', 'contact',
  'contactname', 'client', 'clientname', 'customer', 'фио', 'имя', 'контакт', 'клиент',
];
const FIRST_ALIASES = ['firstname', 'имя'];
const LAST_ALIASES = ['lastname', 'фамилия'];
const PHONE_ALIASES = ['phone', 'tel', 'telephone', 'mobile', 'phone number', 'мобильный', 'телефон', 'номер'];
const EMAIL_ALIASES = ['email', 'e-mail', 'mail', 'email address', 'почта', 'емейл'];
const STATUS_ALIASES = ['status', 'state', 'type', 'статус', 'тип', 'статус клиента'];
const TAGS_ALIASES = ['tags', 'tag', 'labels', 'label', 'category', 'categories', 'group', 'groups', 'теги', 'категория', 'группа'];
const TITLE_ALIASES = ['title', 'position', 'job', 'jobtitle', 'role', 'должность', 'позиция'];
const NOTES_ALIASES = ['notes', 'note', 'comment', 'comments', 'description', 'описание', 'комментарий', 'заметки'];

const DEAL_SPECIFIC_ALIASES = [
  'deal', 'dealtitle', 'deal title', 'offer', 'opportunity', 'сделка',
  'название сделки', 'предложение', 'commercial',
];
const DEAL_TITLE_FALLBACK = ['title', 'name', 'offer'];
const AMOUNT_ALIASES = ['amount', 'sum', 'total', 'value', 'price', 'budget', 'cost', 'сумма', 'стоимость', 'бюджет', 'цена'];
const STAGE_ALIASES = ['stage', 'phase', 'status', 'step', 'стадия', 'этап', 'статус сделки'];
const DEAL_NOTES_ALIASES = ['dealnotes', 'deal notes', 'dealdescription', 'описание сделки'];
const DEAL_CLOSE_ALIASES = ['expectedclose', 'expected close', 'closedate', 'close date', 'duedate', 'дата закрытия', 'план закрытия'];
const DEAL_CONTACT_ALIASES = ['contact', 'contactid', 'contactemail', 'client', 'clientname', 'customer', 'customername', 'email', 'phone', 'имя клиента', 'контакт'];

const TASK_SPECIFIC_ALIASES = ['task', 'tasktitle', 'task title', 'todo', 'action', 'activity', 'задача', 'название задачи', 'дело'];
const TASK_CONTACT_ALIASES = ['contact', 'client', 'customer', 'email', 'phone', 'контакт', 'клиент'];
const TASK_DEAL_ALIASES = ['deal', 'dealname', 'сделка'];
const TASK_PRIORITY_ALIASES = ['priority', 'prio', 'важность', 'приоритет'];
const TASK_DUE_ALIASES = ['due', 'duedate', 'deadline', 'due date', 'дата', 'срок', 'дедлайн'];
const TASK_DONE_ALIASES = ['done', 'complete', 'completed', 'finished', 'готово', 'выполнено'];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

function pick(rec: RawRecord, aliases: string[]): string | undefined {
  for (const a of aliases) {
    const v = rec[a];
    if (v != null && v !== '') return v;
  }
  return undefined;
}

function parseTags(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

function parseAmount(raw: string | undefined, defaultCurrency: string): { amount: number; currency: string } {
  if (!raw) return { amount: 0, currency: defaultCurrency };
  const curMatch = raw.match(/[A-Za-z]{3}/);
  const currency = curMatch ? curMatch[0].toUpperCase() : defaultCurrency;
  const num = raw.replace(/[^0-9.\-]/g, '');
  const amount = num ? parseFloat(num) : 0;
  return { amount: Number.isNaN(amount) ? 0 : amount, currency };
}

export function parseDate(raw?: string): number | null {
  if (!raw) return null;
  const t = raw.trim();
  const dm = t.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})$/);
  if (dm) {
    const d = parseInt(dm[1], 10);
    const m = parseInt(dm[2], 10);
    let y = parseInt(dm[3], 10);
    if (y < 100) y += 2000;
    const dt = new Date(y, m - 1, d);
    if (!Number.isNaN(dt.getTime())) return dt.getTime();
  }
  const ts = Date.parse(t);
  return Number.isNaN(ts) ? null : ts;
}

// Handle normalisation: prefix keeps phone/email/name spaces distinct.
function handleFromString(s: string): string {
  const t = s.trim().toLowerCase();
  const digits = t.replace(/\D/g, '');
  if (digits.length >= 6) return `p:${digits}`;
  if (t.includes('@')) return `e:${t}`;
  return `n:${t}`;
}

function handlesForContact(c: { phone?: string; email?: string; name: string }): string[] {
  const out: string[] = [];
  if (c.phone) {
    const d = c.phone.replace(/\D/g, '');
    if (d) out.push(`p:${d}`);
  }
  if (c.email) out.push(`e:${c.email.trim().toLowerCase()}`);
  if (c.name) out.push(`n:${c.name.trim().toLowerCase()}`);
  return out;
}

const STATUS_MAP: Record<string, CrmContactStatus> = {
  lead: 'lead', лид: 'lead', 'новый': 'lead', 'новая': 'lead', prospect: 'lead',
  client: 'client', клиент: 'client', customer: 'client', покупатель: 'client',
  partner: 'partner', партнёр: 'partner', партнер: 'partner',
  vendor: 'vendor', поставщик: 'vendor', supplier: 'vendor',
  internal: 'internal', сотрудник: 'internal', staff: 'internal',
  vip: 'vip',
};

const STAGE_MAP: Record<string, DealStage> = {
  new: 'new', новый: 'new', новая: 'new', 'новый лид': 'new',
  qualified: 'qualified', квалифицирован: 'qualified', 'квалифицированный': 'qualified',
  proposal: 'proposal', предложение: 'proposal', коммерческое: 'proposal', кп: 'proposal',
  negotiation: 'negotiation', переговор: 'negotiation', переговоры: 'negotiation',
  won: 'won', выигран: 'won', выиграна: 'won', закрыт: 'won', 'closed won': 'won',
  lost: 'lost', проигран: 'lost', отклонён: 'lost', отклонен: 'lost', 'closed lost': 'lost',
};

const PRIORITY_MAP: Record<string, TaskPriority> = {
  low: 'low', низкий: 'low', низкая: 'low', l: 'low',
  medium: 'medium', средний: 'medium', средняя: 'medium', m: 'medium',
  high: 'high', высокий: 'high', высокая: 'high', h: 'high',
};

function mapStatus(raw: string | undefined, row: number, issues: ImportIssue[]): CrmContactStatus {
  if (!raw) return 'lead';
  const k = raw.trim().toLowerCase();
  const hit = STATUS_MAP[k];
  if (!hit) issues.push({ row, field: 'status', code: 'unknown-status', value: raw, severity: 'warning' });
  return hit ?? 'lead';
}

function mapStage(raw: string | undefined, row: number, issues: ImportIssue[]): DealStage {
  if (!raw) return CRM_DEFAULT_DEAL_STAGE;
  const k = raw.trim().toLowerCase();
  const hit = STAGE_MAP[k];
  if (!hit) issues.push({ row, field: 'stage', code: 'unknown-stage', value: raw, severity: 'warning' });
  return hit ?? CRM_DEFAULT_DEAL_STAGE;
}

function mapPriority(raw: string | undefined, row: number, issues: ImportIssue[]): TaskPriority {
  if (!raw) return 'medium';
  const k = raw.trim().toLowerCase();
  const hit = PRIORITY_MAP[k];
  if (!hit) issues.push({ row, field: 'priority', code: 'unknown-priority', value: raw, severity: 'warning' });
  return hit ?? 'medium';
}

function mapDone(raw: string | undefined): boolean {
  if (!raw) return false;
  const k = raw.trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 'да', 'готово', 'выполнено', 'done', 'complete'].includes(k);
}

// ---------------------------------------------------------------------------
// Record extraction
// ---------------------------------------------------------------------------

function extractContact(rec: RawRecord, row: number, issues: ImportIssue[]): DraftContact | null {
  let name = pick(rec, NAME_ALIASES);
  if (!name) {
    const f = pick(rec, FIRST_ALIASES);
    const l = pick(rec, LAST_ALIASES);
    if (f || l) name = `${f ?? ''} ${l ?? ''}`.trim();
  }
  if (!name) return null;

  const phone = pick(rec, PHONE_ALIASES)?.trim() || undefined;
  const email = pick(rec, EMAIL_ALIASES)?.trim() || undefined;
  const statusRaw = pick(rec, STATUS_ALIASES)?.trim();
  const status = mapStatus(statusRaw, row, issues);
  const tags = parseTags(pick(rec, TAGS_ALIASES));
  const title = pick(rec, TITLE_ALIASES)?.trim() || undefined;
  const notes = pick(rec, NOTES_ALIASES)?.trim() || undefined;

  return { displayName: name, phone, email, status, tags, title, notes, role: 'member' as SystemRole };
}

function extractDeal(rec: RawRecord, contactRef: string | undefined, row: number, issues: ImportIssue[], opts: ImportOptions): DraftDeal | null {
  const dealSpecific = pick(rec, DEAL_SPECIFIC_ALIASES);
  const amountRaw = pick(rec, AMOUNT_ALIASES);
  const stageRaw = pick(rec, STAGE_ALIASES);
  if (!dealSpecific && !(amountRaw && stageRaw)) return null;

  const title = (dealSpecific ?? pick(rec, DEAL_TITLE_FALLBACK) ?? 'Сделка').trim();
  const stage = mapStage(stageRaw, row, issues);
  const { amount, currency } = parseAmount(amountRaw, opts.defaultCurrency ?? 'USD');
  const notes = pick(rec, DEAL_NOTES_ALIASES)?.trim() || undefined;
  const expectedClose = parseDate(pick(rec, DEAL_CLOSE_ALIASES)) ?? null;

  const explicit = pick(rec, DEAL_CONTACT_ALIASES)?.trim();
  const ref = explicit ? handleFromString(explicit) : contactRef;

  return { title, contactRef: ref, stage, amount, currency, notes, expectedClose };
}

function extractTask(rec: RawRecord, contactRef: string | undefined, row: number, issues: ImportIssue[]): DraftTask | null {
  const taskSpecific = pick(rec, TASK_SPECIFIC_ALIASES);
  if (!taskSpecific) return null;

  const title = taskSpecific.trim();
  const priority = mapPriority(pick(rec, TASK_PRIORITY_ALIASES), row, issues);
  const due = pick(rec, TASK_DUE_ALIASES)?.trim();
  const done = mapDone(pick(rec, TASK_DONE_ALIASES));

  const explicit = pick(rec, TASK_CONTACT_ALIASES)?.trim();
  const ref = explicit ? handleFromString(explicit) : contactRef;
  const dealRef = pick(rec, TASK_DEAL_ALIASES)?.trim();

  return { title, contactRef: ref, dealRef, priority, due, done };
}

// ---------------------------------------------------------------------------
// CSV / JSON parsing
// ---------------------------------------------------------------------------

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

function parseCsvToRecords(text: string): RawRecord[] {
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

function objToRaw(obj: unknown): RawRecord {
  const rec: RawRecord = {};
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (v == null) continue;
      rec[k.toLowerCase()] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
  }
  return rec;
}

function isStructured(parsed: any): boolean {
  return parsed && typeof parsed === 'object' &&
    (Array.isArray(parsed.contacts) || Array.isArray(parsed.deals) || Array.isArray(parsed.tasks));
}

function detectFormat(text: string, hint?: ImportFormat): ImportFormat {
  if (hint) return hint;
  const t = text.trimStart();
  return t.startsWith('{') || t.startsWith('[') ? 'json' : 'csv';
}

// ---------------------------------------------------------------------------
// Plan building
// ---------------------------------------------------------------------------

function buildPlan(
  contactRecs: RawRecord[],
  dealRecs: RawRecord[],
  taskRecs: RawRecord[],
  opts: ImportOptions,
  structured: boolean,
): ImportPlan {
  const issues: ImportIssue[] = [];
  const contacts: DraftContact[] = [];
  const deals: DraftDeal[] = [];
  const tasks: DraftTask[] = [];

  if (!structured) {
    contactRecs.forEach((rec, idx) => {
      const row = idx + 1;
      const c = extractContact(rec, row, issues);
      if (c) {
        contacts.push(c);
        const d = extractDeal(rec, undefined, row, issues, opts);
        if (d) deals.push(d);
        const t = extractTask(rec, undefined, row, issues);
        if (t) tasks.push(t);
      } else {
        const d = extractDeal(rec, undefined, row, issues, opts);
        const t = extractTask(rec, undefined, row, issues);
        if (!d && !t) {
          issues.push({ row, code: 'row-skipped', severity: 'warning' });
        }
      }
    });
  } else {
    contactRecs.forEach((rec, idx) => {
      const c = extractContact(rec, idx + 1, issues);
      if (c) contacts.push(c);
    });
    dealRecs.forEach((rec, idx) => {
      const d = extractDeal(rec, undefined, idx + 1, issues, opts);
      if (d) deals.push(d);
    });
    taskRecs.forEach((rec, idx) => {
      const t = extractTask(rec, undefined, idx + 1, issues);
      if (t) tasks.push(t);
    });
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  return { contacts, deals, tasks, issues, stats: { contacts: contacts.length, deals: deals.length, tasks: tasks.length, errors, warnings } };
}

// ---------------------------------------------------------------------------
// Apply plan → final domain objects
// ---------------------------------------------------------------------------

export function applyPlan(plan: ImportPlan, opts: ImportOptions = {}): ImportResult {
  const existingHandleToId = new Map<string, string>();
  const existingByHandle = new Map<string, CrmContact>();
  (opts.existingContacts ?? []).forEach((c) => {
    handlesForContact({ phone: c.phone, email: c.email, name: c.displayName }).forEach((h) => {
      existingHandleToId.set(h, c.userId);
      existingByHandle.set(h, c);
    });
  });

  const skip = opts.skipDuplicates ?? true;
  const sourceTag = opts.source ? `imported:${opts.source}` : undefined;
  const handleToId = new Map<string, string>();
  const seen = new Set<string>();
  const contacts: CrmContact[] = [];
  const mergedContacts: CrmContact[] = [];
  let duplicatesSkipped = 0;
  let mergedCount = 0;

  for (const d of plan.contacts) {
    const handles = handlesForContact({ phone: d.phone, email: d.email, name: d.displayName });
    const primary = handles[0];
    if (!primary) continue;

    if (seen.has(primary)) {
      if (skip) { duplicatesSkipped += 1; continue; }
    }
    if (skip) {
      const existing = primary ? existingByHandle.get(primary) : undefined;
      if (existing) {
        const tags = Array.from(new Set([...(existing.tags ?? []), ...(d.tags ?? []), ...(sourceTag ? [sourceTag] : [])]));
        const merged: CrmContact = {
          ...existing,
          phone: existing.phone ?? d.phone,
          email: existing.email ?? d.email,
          title: existing.title ?? d.title,
          notes: existing.notes ?? d.notes,
          avatarColor: existing.avatarColor ?? undefined,
          status: existing.status !== 'lead' ? existing.status : d.status,
          tags,
          lastActive: Date.now(),
        };
        handles.forEach((h) => { if (!handleToId.has(h)) handleToId.set(h, existing.userId); });
        mergedContacts.push(merged);
        mergedCount += 1;
        duplicatesSkipped += 1;
        continue;
      }
    }

    const id = `usr_${uid()}`;
    seen.add(primary);
    handles.forEach((h) => handleToId.set(h, id));
    contacts.push({
      userId: id,
      displayName: d.displayName,
      role: d.role,
      departmentId: null,
      title: d.title,
      phone: d.phone,
      email: d.email,
      tags: sourceTag ? [...(d.tags ?? []), sourceTag] : d.tags,
      notes: d.notes,
      status: d.status,
      online: false,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    });
  }

  const dealTitleMap = new Map<string, string>();
  const deals: Deal[] = [];
  for (const d of plan.deals) {
    const id = `deal_${uid()}`;
    let contactId = '';
    if (d.contactRef && handleToId.has(d.contactRef)) contactId = handleToId.get(d.contactRef)!;
    deals.push({
      id,
      title: d.title,
      contactId,
      stage: d.stage,
      amount: d.amount,
      currency: d.currency,
      ownerId: opts.defaultOwnerId ?? '',
      expectedClose: d.expectedClose ?? null,
      createdAt: Date.now(),
      notes: d.notes,
    });
    dealTitleMap.set(d.title.trim().toLowerCase(), id);
  }

  const tasks: CrmTask[] = [];
  for (const t of plan.tasks) {
    const id = `task_${uid()}`;
    let contactId: string | null = null;
    if (t.contactRef && handleToId.has(t.contactRef)) contactId = handleToId.get(t.contactRef)!;
    let dealId: string | null = null;
    if (t.dealRef && dealTitleMap.has(t.dealRef.trim().toLowerCase())) dealId = dealTitleMap.get(t.dealRef.trim().toLowerCase())!;
    tasks.push({
      id,
      title: t.title,
      done: t.done,
      priority: t.priority,
      dueAt: parseDate(t.due),
      assigneeId: null,
      contactId,
      dealId,
      createdAt: Date.now(),
    });
  }

  return {
    contacts,
    mergedContacts,
    deals,
    tasks,
    issues: plan.issues,
    stats: {
      importedContacts: contacts.length,
      mergedContacts: mergedCount,
      importedDeals: deals.length,
      importedTasks: tasks.length,
      duplicatesSkipped,
      errors: plan.issues.filter((i) => i.severity === 'error').length,
      warnings: plan.issues.filter((i) => i.severity === 'warning').length,
    },
  };
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function importFromText(
  text: string,
  opts: ImportOptions = {},
): { format: ImportFormat; plan: ImportPlan; result: ImportResult } {
  const format = detectFormat(text, opts.formatHint);
  let contactRecs: RawRecord[] = [];
  let dealRecs: RawRecord[] = [];
  let taskRecs: RawRecord[] = [];
  let structured = false;

  if (format === 'json') {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const recs = parsed.map(objToRaw);
      contactRecs = recs; dealRecs = recs; taskRecs = recs;
    } else if (isStructured(parsed)) {
      const p = parsed as Record<string, unknown[]>;
      contactRecs = (p.contacts ?? []).map(objToRaw);
      dealRecs = (p.deals ?? []).map(objToRaw);
      taskRecs = (p.tasks ?? []).map(objToRaw);
      structured = true;
    } else {
      const recs = [objToRaw(parsed)];
      contactRecs = recs; dealRecs = recs; taskRecs = perObjectContactsOnly(recs);
    }
  } else {
    const recs = parseCsvToRecords(text);
    contactRecs = recs; dealRecs = recs; taskRecs = recs;
  }

  const plan = buildPlan(contactRecs, dealRecs, taskRecs, opts, structured);
  const result = applyPlan(plan, opts);
  return { format, plan, result };
}

function perObjectContactsOnly(recs: RawRecord[]): RawRecord[] {
  // Single JSON object: no separate deal/task arrays; deals/tasks come from
  // the same record via column detection, so mirror contact records.
  return recs;
}
