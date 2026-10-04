import type { CrmContactStatus, DealStage, TaskPriority } from './types';
import { CRM_DEFAULT_DEAL_STAGE } from '../../constants/crmConstants';
import type { ImportIssue, RawRecord } from './crmImportTypes';

/**
 * Value-level helpers: header lookup, primitive parsing, handle normalisation
 * and the status / stage / priority vocabularies (unknown values degrade to the
 * default and record a warning issue).
 */

export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);

export function pick(rec: RawRecord, aliases: string[]): string | undefined {
  for (const a of aliases) {
    const v = rec[a];
    if (v != null && v !== '') return v;
  }
  return undefined;
}

export function parseTags(raw?: string): string[] {
  if (!raw) return [];
  return raw.split(/[;,]/).map((s) => s.trim()).filter(Boolean);
}

export function parseAmount(raw: string | undefined, defaultCurrency: string): { amount: number; currency: string } {
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
export function handleFromString(s: string): string {
  const t = s.trim().toLowerCase();
  const digits = t.replace(/\D/g, '');
  if (digits.length >= 6) return `p:${digits}`;
  if (t.includes('@')) return `e:${t}`;
  return `n:${t}`;
}

export function handlesForContact(c: { phone?: string; email?: string; name: string }): string[] {
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
  qualified: 'qualified', квалифицирован: 'qualified', квалифицированный: 'qualified',
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

export function mapStatus(raw: string | undefined, row: number, issues: ImportIssue[]): CrmContactStatus {
  if (!raw) return 'lead';
  const k = raw.trim().toLowerCase();
  const hit = STATUS_MAP[k];
  if (!hit) issues.push({ row, field: 'status', code: 'unknown-status', value: raw, severity: 'warning' });
  return hit ?? 'lead';
}

export function mapStage(raw: string | undefined, row: number, issues: ImportIssue[]): DealStage {
  if (!raw) return CRM_DEFAULT_DEAL_STAGE;
  const k = raw.trim().toLowerCase();
  const hit = STAGE_MAP[k];
  if (!hit) issues.push({ row, field: 'stage', code: 'unknown-stage', value: raw, severity: 'warning' });
  return hit ?? CRM_DEFAULT_DEAL_STAGE;
}

export function mapPriority(raw: string | undefined, row: number, issues: ImportIssue[]): TaskPriority {
  if (!raw) return 'medium';
  const k = raw.trim().toLowerCase();
  const hit = PRIORITY_MAP[k];
  if (!hit) issues.push({ row, field: 'priority', code: 'unknown-priority', value: raw, severity: 'warning' });
  return hit ?? 'medium';
}

export function mapDone(raw: string | undefined): boolean {
  if (!raw) return false;
  const k = raw.trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 'да', 'готово', 'выполнено', 'done', 'complete'].includes(k);
}