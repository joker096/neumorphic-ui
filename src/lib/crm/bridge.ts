/**
 * Bridge between the messenger contact model (src/types/contact.ts)
 * and the CRM contact model (src/lib/crm/types.ts).
 *
 * Privacy-first, local-only: no network, no telemetry. A messenger
 * contact id is reused as the CRM userId, so one messenger contact can
 * only ever map to one CRM record (no duplicate CRM entries).
 */

import type { Contact, ContactTag } from '../../types/contact';
import type { CrmContact, CrmContactStatus, SystemRole } from './types';

const STATUS_PRIORITY: CrmContactStatus[] = [
  'vip',
  'client',
  'partner',
  'vendor',
  'internal',
  'lead',
];

function normalize(v: string): string {
  return v.trim().toLowerCase();
}

/** Strip everything except digits for lenient phone matching. */
function phoneDigits(v: string): string {
  return v.replace(/\D/g, '');
}

/** Pick a single CRM status from messenger tags (CRM status is singular). */
export function deriveCrmStatus(tags: ContactTag[] | undefined): CrmContactStatus {
  if (!tags || tags.length === 0) return 'lead';
  for (const candidate of STATUS_PRIORITY) {
    if (tags.includes(candidate as ContactTag)) return candidate;
  }
  return 'lead';
}

/** Best phone-like value from a messenger contact. */
export function pickPhone(c: Contact): string | undefined {
  const field = c.localFields?.find((f) => f.type === 'phone' && f.value);
  if (field) return field.value;
  if (c.whatsapp) return c.whatsapp;
  if (c.signal) return c.signal;
  return undefined;
}

/** Convert a messenger Contact into a fresh CRM contact. */
export function contactToCrm(c: Contact): CrmContact {
  const phone = pickPhone(c);
  return {
    userId: c.id,
    displayName: c.name,
    role: 'member' as SystemRole,
    title: c.position,
    phone,
    email: c.email,
    tags: (c.tags ?? []).map((t) => String(t)),
    notes: c.notes,
    status: deriveCrmStatus(c.tags),
    avatarColor: c.color,
    online: false,
    joinedAt: c.lastInteraction ?? Date.now(),
    lastActive: c.lastSeen ?? c.lastInteraction ?? Date.now(),
  };
}

/** Inverse: CRM contact back into a messenger Contact. */
export function crmToContact(c: CrmContact): Contact {
  return {
    name: c.displayName,
    id: c.userId,
    color: c.avatarColor ?? '#6b7280',
    lastSeen: c.lastActive ?? Date.now(),
    localFields: c.phone
      ? [{ id: `f_${c.userId}_phone`, type: 'phone', label: 'Phone', value: c.phone }]
      : undefined,
    email: c.email,
    position: c.title,
    tags: (c.tags as ContactTag[]) ?? [],
    notes: c.notes,
    lastInteraction: c.lastActive,
  };
}

/** Find an existing CRM contact that matches a messenger contact. */
export function findExistingCrmContact(
  contacts: CrmContact[],
  c: Contact,
): CrmContact | undefined {
  const phone = pickPhone(c);
  return contacts.find(
    (x) =>
      x.userId === c.id ||
      (phone != null && x.phone != null && phoneDigits(phone) === phoneDigits(x.phone)) ||
      (c.email != null && x.email != null && normalize(c.email) === normalize(x.email)),
  );
}

/**
 * Resolve a CRM contact from a chat peer descriptor.
 * Matches by userId (stringified id), display name, phone digits, or email.
 */
export function findCrmContactByChat(
  contacts: CrmContact[],
  chat: { id?: any; name?: string; phone?: string; email?: string },
): CrmContact | undefined {
  const id = chat.id != null ? String(chat.id) : undefined;
  const name = chat.name ? normalize(chat.name) : undefined;
  const phone = chat.phone ? phoneDigits(chat.phone) : undefined;
  const email = chat.email ? normalize(chat.email) : undefined;
  return contacts.find(
    (c) =>
      (id != null && c.userId === id) ||
      (name != null && normalize(c.displayName) === name) ||
      (phone != null && c.phone != null && phoneDigits(c.phone) === phone) ||
      (email != null && c.email != null && normalize(c.email) === email),
  );
}

/** Merge a messenger contact into an existing CRM record (fill gaps only). */
export function mergeIntoCrm(existing: CrmContact, c: Contact): CrmContact {
  const phone = pickPhone(c);
  const tags = Array.from(
    new Set([...(existing.tags ?? []), ...(c.tags ?? []).map(String)]),
  );
  return {
    ...existing,
    displayName: existing.displayName || c.name,
    title: existing.title ?? c.position,
    phone: existing.phone ?? phone,
    email: existing.email ?? c.email,
    notes: existing.notes ?? c.notes,
    tags,
    status: existing.status !== 'lead' ? existing.status : deriveCrmStatus(c.tags),
    avatarColor: existing.avatarColor ?? c.color,
    lastActive: c.lastSeen ?? existing.lastActive,
  };
}

export interface BridgeSyncResult {
  contacts: CrmContact[];
  added: CrmContact[];
  updated: CrmContact[];
}

/** Sync a list of messenger contacts into the CRM contact store. */
export function syncMessengerContacts(
  base: CrmContact[],
  messengerContacts: Contact[],
): BridgeSyncResult {
  const contacts = [...base];
  const added: CrmContact[] = [];
  const updated: CrmContact[] = [];

  for (const mc of messengerContacts) {
    const existing = findExistingCrmContact(contacts, mc);
    if (existing) {
      const merged = mergeIntoCrm(existing, mc);
      const idx = contacts.findIndex((x) => x.userId === existing.userId);
      if (idx >= 0) contacts[idx] = merged;
      updated.push(merged);
    } else {
      const fresh = contactToCrm(mc);
      contacts.push(fresh);
      added.push(fresh);
    }
  }

  return { contacts, added, updated };
}
