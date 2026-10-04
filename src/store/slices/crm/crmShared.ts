import type { CrmContact, CrmPermission, CustomRole } from '../../../lib/crm/types';
import { SYSTEM_ROLE_PERMISSIONS } from '../../../constants/crmConstants';

/** Short collision-resistant id, same shape the CRM has always used. */
export const uid = (prefix: string) =>
  `${prefix}_${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10)}`;

/** The local user as a CRM owner contact (seed and demo-reset share it). */
export function ownerContact(currentUserId: string, currentUserName: string): CrmContact {
  return {
    userId: currentUserId,
    displayName: currentUserName || 'You',
    role: 'admin',
    departmentId: null,
    title: 'Owner',
    status: 'internal',
    tags: ['me'],
    online: true,
  };
}

/** Resolve the effective permission set for a given contact. */
export function resolvePermissions(contact: CrmContact | undefined, customRoles: CustomRole[]): CrmPermission[] {
  if (!contact) return [];
  const base = SYSTEM_ROLE_PERMISSIONS[contact.role] ?? [];
  if (contact.customRoleId) {
    const custom = customRoles.find((r) => r.id === contact.customRoleId);
    if (custom) return Array.from(new Set([...base, ...custom.permissions]));
  }
  return base;
}