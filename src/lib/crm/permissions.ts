import { useMemo } from 'react';
import { useAppStore } from '../../store';
import { resolvePermissions } from '../../store/slices/crmSlice';
import type { CrmPermission } from './types';

/**
 * Returns the effective permissions of the current user within the CRM and a
 * `can()` predicate used to gate UI and actions.
 */
export function useCrmPermissions() {
  const contacts = useAppStore((s) => s.crmContacts);
  const customRoles = useAppStore((s) => s.crmCustomRoles);
  const userId = useAppStore((s) => s.userProfile.id);

  return useMemo(() => {
    const me = contacts.find((c) => c.userId === userId);
    const perms = resolvePermissions(me, customRoles);
    const set = new Set<CrmPermission>(perms);
    return {
      me,
      permissions: perms,
      can: (p: CrmPermission) => set.has(p),
    };
  }, [contacts, customRoles, userId]);
}
