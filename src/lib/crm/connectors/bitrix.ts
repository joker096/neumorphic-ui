/**
 * Bitrix24 → CRM connector (local-first, OPT-IN).
 *
 * Mappers are pure and tested. No network transport is wired up: no telemetry,
 * no cloud storage of CRM data.
 */

import type { CrmContact, CrmContactStatus } from '../types';

export interface BitrixContactRow {
  ID?: string | number;
  NAME?: string;
  LAST_NAME?: string;
  EMAIL?: string;
  PHONE?: string;
  COMPANY_TITLE?: string;
  POST?: string;
  COMMENTS?: string;
  STATUS_ID?: string; // e.g. 'CLIENT' | 'LEAD' | 'PARTNER'
}

const STATUS_MAP: Record<string, CrmContactStatus> = {
  LEAD: 'lead',
  CLIENT: 'client',
  PARTNER: 'partner',
  VENDOR: 'vendor',
  EMPLOYEE: 'internal',
  VIP: 'vip',
};

export function bitrixStatusToCrm(status?: string): CrmContactStatus {
  if (!status) return 'lead';
  return STATUS_MAP[String(status).toUpperCase()] ?? 'lead';
}

let bxSeq = 0;

export function bitrixContactToCrm(row: BitrixContactRow): CrmContact {
  const name = [row.NAME, row.LAST_NAME].filter(Boolean).join(' ').trim() || 'Unknown';
  const status = bitrixStatusToCrm(row.STATUS_ID);
  return {
    userId: `bx_${row.ID ?? `gen${bxSeq++}`}`,
    displayName: name,
    role: 'member',
    title: row.POST,
    phone: row.PHONE,
    email: row.EMAIL,
    tags: [status],
    notes: row.COMMENTS,
    status,
    avatarColor: '#6b7280',
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };
}

export function bitrixContactsToCrm(rows: BitrixContactRow[]): CrmContact[] {
  return rows.map(bitrixContactToCrm);
}
