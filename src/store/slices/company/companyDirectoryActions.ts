import * as idb from '../../../lib/idb';
import type { CompanyContact, CompanyDepartment } from '../../../types/constants';
import type { CompanySlice } from '../companySlice';

/** Internal company directory: departments and company contacts (persisted). */
export const createCompanyDirectoryActions = (set: any, get: any): Pick<
  CompanySlice,
  | 'setCompanyDepartments'
  | 'setCompanyContacts'
  | 'addCompanyDepartment'
  | 'updateCompanyDepartment'
  | 'removeCompanyDepartment'
  | 'addCompanyContact'
  | 'updateCompanyContact'
  | 'removeCompanyContact'
  | 'loadCompanyData'
> => ({
  setCompanyDepartments: (departments) => set({ companyDepartments: departments }),
  setCompanyContacts: (contacts) => set({ companyContacts: contacts }),
  addCompanyDepartment: (input) => {
    const dept: CompanyDepartment = {
      id: `dep_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`,
      name: input.name,
      description: input.description,
      color: input.color,
      memberIds: input.memberIds || [],
      createdAt: Date.now(),
    };
    set((state: any) => ({ companyDepartments: [...state.companyDepartments, dept] }));
    const { saveCompanyDepartments } = idb;
    saveCompanyDepartments(get().companyDepartments).catch(() => {});
  },
  updateCompanyDepartment: (id, patch) => {
    set((state: any) => ({
      companyDepartments: state.companyDepartments.map((d: CompanyDepartment) =>
        d.id === id ? { ...d, ...patch } : d,
      ),
    }));
    idb.saveCompanyDepartments(get().companyDepartments).catch(() => {});
  },
  removeCompanyDepartment: (id) => {
    set((state: any) => ({
      companyDepartments: state.companyDepartments.filter((d: CompanyDepartment) => d.id !== id),
      companyContacts: state.companyContacts.map((c: CompanyContact) =>
        c.departmentId === id ? { ...c, departmentId: null } : c,
      ),
    }));
    idb.saveCompanyDepartments(get().companyDepartments).catch(() => {});
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  addCompanyContact: (input) => {
    const contact: CompanyContact = {
      id: `con_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`,
      name: input.name,
      title: input.title,
      phone: input.phone,
      email: input.email,
      departmentId: input.departmentId ?? null,
      notes: input.notes,
      createdAt: Date.now(),
    };
    set((state: any) => ({ companyContacts: [...state.companyContacts, contact] }));
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  updateCompanyContact: (id, patch) => {
    set((state: any) => ({
      companyContacts: state.companyContacts.map((c: CompanyContact) =>
        c.id === id ? { ...c, ...patch, departmentId: patch.departmentId ?? null } : c,
      ),
    }));
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  removeCompanyContact: (id) => {
    set((state: any) => ({
      companyContacts: state.companyContacts.filter((c: CompanyContact) => c.id !== id),
    }));
    idb.saveCompanyContacts(get().companyContacts).catch(() => {});
  },
  loadCompanyData: async () => {
    try {
      const storedDepts = await idb.getCompanyDepartments();
      if (storedDepts && storedDepts.length > 0) {
        set({ companyDepartments: storedDepts });
      }
      const storedContacts = await idb.getCompanyContacts();
      if (storedContacts && storedContacts.length > 0) {
        set({ companyContacts: storedContacts });
      }
    } catch {
      /* ignore */
    }
  },
});