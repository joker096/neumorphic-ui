/**
 * Suggests turning an incoming messenger contact into a CRM lead.
 *
 * Privacy-first, local-only: the check runs entirely against the local
 * contact and CRM stores — no network, no telemetry. A suggestion is offered
 * only for a direct chat whose peer has written to us and whose phone/email
 * is not already covered by a CRM record.
 */

import type { Contact } from '../../types/contact';
import type { CrmContact } from './types';
import { findExistingCrmContact, pickPhone } from './bridge';

interface SuggestionChat {
  id?: string | number;
  name?: string;
  type?: string;
  isChannel?: boolean;
  isBot?: boolean;
  history?: Array<{ sender?: string }>;
}

export interface LeadSuggestion {
  /** Messenger contact that should become a CRM lead. */
  contact: Contact;
  /** Phone, email or display name — shown in the hint. */
  detail: string;
}

export function resolveLeadSuggestion(
  chat: SuggestionChat | undefined | null,
  contacts: Contact[],
  crmContacts: CrmContact[],
): LeadSuggestion | null {
  if (!chat || chat.isChannel || chat.isBot) return null;
  if (chat.type === 'group' || chat.type === 'channel' || chat.type === 'bot') return null;
  const history = chat.history ?? [];
  if (!history.some((m) => m && m.sender !== 'me')) return null;
  const id = chat.id;
  const byId = id != null ? contacts.find((c) => String(c.id) === String(id)) : undefined;
  const contact = byId ?? (chat.name != null ? contacts.find((c) => c.name === chat.name) : undefined);
  if (!contact) return null;
  if (findExistingCrmContact(crmContacts, contact)) return null;
  const detail = pickPhone(contact) || contact.email || contact.name;
  return { contact, detail };
}
