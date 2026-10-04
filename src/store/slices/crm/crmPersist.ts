import type { CrmContact, CustomRole, Department, Deal, CrmTask } from '../../../lib/crm/types';
import {
  MOCK_DEPARTMENTS,
  MOCK_CUSTOM_ROLES,
} from '../../../constants/crmMockData';

export const CRM_STORAGE_KEY = 'neumorphic.crm.v1';
const CRM_INVITE_KEY = 'neumorphic.crm.invite';

interface PersistedCrm {
  contacts: CrmContact[];
  departments: Department[];
  customRoles: CustomRole[];
  deals: Deal[];
  tasks: CrmTask[];
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const out: string[] = [];
  try {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    bytes.forEach((b) => out.push(chars[b % chars.length]));
  } catch {
    for (let i = 0; i < 8; i += 1) out.push(chars[Math.floor(Math.random() * chars.length)]);
  }
  return `INV-${out.join('')}`;
}

export async function loadCrmPersisted(): Promise<PersistedCrm | null> {
  try {
    const raw = localStorage.getItem(CRM_STORAGE_KEY);
    if (!raw) return null;
    const { isEncryptedPayload, decryptCrmData } = await import('../../../lib/crm/atRest');
    let json: string;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isEncryptedPayload(parsed)) {
        json = await decryptCrmData(parsed);
      } else {
        // Legacy plaintext blob (pre-encryption) — re-saved encrypted on next change.
        json = raw;
      }
    } catch {
      json = raw;
    }
    const data = JSON.parse(json) as Partial<PersistedCrm>;
    if (!Array.isArray(data.contacts) || data.contacts.length === 0) return null;
    return {
      contacts: data.contacts,
      departments: Array.isArray(data.departments) ? data.departments : MOCK_DEPARTMENTS,
      customRoles: Array.isArray(data.customRoles) ? data.customRoles : MOCK_CUSTOM_ROLES,
      deals: Array.isArray(data.deals) ? data.deals : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
    };
  } catch {
    return null;
  }
}

export async function saveCrmPersisted(state: {
  crmContacts: CrmContact[];
  crmDepartments: Department[];
  crmCustomRoles: CustomRole[];
  crmDeals: Deal[];
  crmTasks: CrmTask[];
}): Promise<void> {
  try {
    const json = JSON.stringify({
      contacts: state.crmContacts,
      departments: state.crmDepartments,
      customRoles: state.crmCustomRoles,
      deals: state.crmDeals,
      tasks: state.crmTasks,
    });
    const { encryptCrmData } = await import('../../../lib/crm/atRest');
    const enc = await encryptCrmData(json);
    localStorage.setItem(CRM_STORAGE_KEY, JSON.stringify(enc));
  } catch {
    /* storage unavailable — in-memory only */
  }
}

/** Read a previously issued invite code (empty string when storage is unavailable). */
export function readStoredInviteCode(): string {
  try {
    return (localStorage.getItem(CRM_INVITE_KEY) || '').trim();
  } catch {
    return '';
  }
}

/** Persist a freshly generated invite code; failures stay in-memory only. */
export function storeInviteCode(code: string): void {
  try {
    localStorage.setItem(CRM_INVITE_KEY, code);
  } catch {
    /* storage unavailable — in-memory only */
  }
}