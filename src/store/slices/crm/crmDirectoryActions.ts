import type { CrmPermission, CustomRole, Department } from '../../../lib/crm/types';
import { uid } from './crmShared';
import type { CrmSlice } from '../crmSlice';

/** Directory mutations: departments (org units) and custom roles (permission sets). */
export const createCrmDirectoryActions = (set: any): Pick<
  CrmSlice,
  | 'addDepartment'
  | 'updateDepartment'
  | 'removeDepartment'
  | 'addCustomRole'
  | 'updateCustomRole'
  | 'toggleCustomRolePermission'
  | 'removeCustomRole'
> => ({
  addDepartment: (name, color) => set((s: any) => ({
    crmDepartments: [...s.crmDepartments, { id: uid('dep'), name, color }],
  })),
  updateDepartment: (id, patch) => set((s: any) => ({
    crmDepartments: s.crmDepartments.map((d: Department) => (d.id === id ? { ...d, ...patch } : d)),
  })),
  removeDepartment: (id) => set((s: any) => ({
    crmDepartments: s.crmDepartments.filter((d: Department) => d.id !== id),
  })),

  addCustomRole: (name) => set((s: any) => ({
    crmCustomRoles: [...s.crmCustomRoles, { id: uid('role'), name, permissions: [] }],
  })),
  updateCustomRole: (id, patch) => set((s: any) => ({
    crmCustomRoles: s.crmCustomRoles.map((r: CustomRole) => (r.id === id ? { ...r, ...patch } : r)),
  })),
  toggleCustomRolePermission: (id, perm: CrmPermission) => set((s: any) => ({
    crmCustomRoles: s.crmCustomRoles.map((r: CustomRole) => {
      if (r.id !== id) return r;
      const has = r.permissions.includes(perm);
      return {
        ...r,
        permissions: has ? r.permissions.filter((p: CrmPermission) => p !== perm) : [...r.permissions, perm],
      };
    }),
  })),
  removeCustomRole: (id) => set((s: any) => ({
    crmCustomRoles: s.crmCustomRoles.filter((r: CustomRole) => r.id !== id),
  })),
});