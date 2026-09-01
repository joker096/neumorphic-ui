/**
 * amoCRM → CRM connector (local-first, OPT-IN).
 *
 * Mappers are pure and tested. Network transport (`connectAmo`) is
 * explicit-only: it requires a user-supplied token and is NEVER called
 * automatically. No telemetry, no cloud storage of CRM data.
 */

import type { CrmContact, CrmContactStatus } from '../types';

export interface AmoCustomFieldValue {
  field_name?: string;
  values?: Array<{ value?: string }>;
}

export interface AmoContactRow {
  id?: string | number;
  name?: string;
  status_id?: number;
  custom_fields_values?: AmoCustomFieldValue[];
  notes?: string;
}

const AMO_STATUS: Record<number, CrmContactStatus> = {
  1: 'lead',
  2: 'client',
  3: 'partner',
  4: 'vendor',
  5: 'internal',
  6: 'vip',
};

export function amoStatusToCrm(statusId?: number): CrmContactStatus {
  if (statusId == null) return 'lead';
  return AMO_STATUS[statusId] ?? 'lead';
}

function firstFieldValue(row: AmoContactRow, ...names: string[]): string | undefined {
  const f = row.custom_fields_values?.find((c) => c.field_name && names.includes(c.field_name));
  return f?.values?.[0]?.value;
}

let amoSeq = 0;

export function amoContactToCrm(row: AmoContactRow): CrmContact {
  const status = amoStatusToCrm(row.status_id);
  return {
    userId: `amo_${row.id ?? `gen${amoSeq++}`}`,
    displayName: row.name?.trim() || 'Unknown',
    role: 'member',
    phone: firstFieldValue(row, 'PHONE', 'ТЕЛЕФОН', 'Phone'),
    email: firstFieldValue(row, 'EMAIL', 'EMAIL2', 'Email'),
    tags: [status],
    notes: row.notes,
    status,
    avatarColor: '#6b7280',
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };
}

export function amoContactsToCrm(rows: AmoContactRow[]): CrmContact[] {
  return rows.map(amoContactToCrm);
}

export interface AmoConnectOptions {
  domain: string;
  token: string;
}

/** Explicit opt-in transport. Throws without a token. Never auto-called. */
export async function connectAmo(opts: AmoConnectOptions): Promise<unknown> {
  if (!opts.token) throw new Error('amoCRM token required (opt-in, no automatic sync)');
  const url = `https://${opts.domain}/api/v4/contacts?auth_token=${encodeURIComponent(opts.token)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`amoCRM request failed: ${res.status}`);
  return res.json();
}
