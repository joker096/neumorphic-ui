/**
 * Telegram → CRM connector (local-first, OPT-IN).
 *
 * Telegram exposes no safe public REST endpoint for contact lists, and this
 * app forbids cloud mirroring. Migration is therefore a one-time, user-driven
 * import of an exported contacts file (Telegram Desktop "contacts.json"):
 *   [ { first_name, last_name, phone_number, username, about }, ... ]
 *
 * Mappers are pure and tested. No network, no telemetry, no automatic sync.
 */

import type { CrmContact, CrmContactStatus } from '../types';

export interface TelegramContactRow {
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  username?: string;
  about?: string;
}

let tgSeq = 0;

/** Telegram exports carry no CRM pipeline status — treat every row as a fresh lead. */
export function telegramStatusToCrm(_row?: TelegramContactRow): CrmContactStatus {
  return 'lead';
}

export function telegramContactToCrm(row: TelegramContactRow): CrmContact {
  const name =
    [row.first_name, row.last_name].filter(Boolean).join(' ').trim() ||
    row.username ||
    row.phone_number ||
    'Unknown';
  const handle = (row.username ?? row.phone_number ?? `gen${tgSeq++}`).toString();
  const status = telegramStatusToCrm(row);
  return {
    userId: `tg_${handle.replace(/[^A-Za-z0-9_]/g, '')}`,
    displayName: name,
    role: 'member',
    title: undefined,
    phone: row.phone_number,
    email: undefined,
    tags: ['telegram', status],
    notes: row.about,
    status,
    avatarColor: '#6b7280',
    joinedAt: Date.now(),
    lastActive: Date.now(),
  };
}

export function telegramContactsToCrm(rows: TelegramContactRow[]): CrmContact[] {
  return rows.map(telegramContactToCrm);
}

/** Parse a Telegram Desktop contacts export (array, or { contacts: [...] }). */
export function parseTelegramExport(text: string): TelegramContactRow[] {
  const parsed: unknown = JSON.parse(text);
  if (Array.isArray(parsed)) return parsed as TelegramContactRow[];
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).contacts)) {
    return (parsed as { contacts: TelegramContactRow[] }).contacts;
  }
  throw new Error('Invalid Telegram export: expected an array of contacts');
}
