import type { CrmFilters } from '../../../lib/crm/types';
import { DEFAULT_CRM_FILTERS } from '../../../lib/crm/types';
import type { CrmSlice } from '../crmSlice';

/** View state: people/deal/task filters and collapsed directory groups. */
export const createCrmFilterActions = (set: any): Pick<
  CrmSlice,
  'setCrmFilter' | 'resetCrmFilters' | 'toggleCrmGroup'
> => ({
  setCrmFilter: (key, value) => set((s: any) => ({
    crmFilters: { ...s.crmFilters, [key]: value },
  })),
  resetCrmFilters: () => set({ crmFilters: { ...DEFAULT_CRM_FILTERS } }),

  toggleCrmGroup: (key) => set((s: any) => ({
    crmCollapsedGroups: s.crmCollapsedGroups.includes(key)
      ? s.crmCollapsedGroups.filter((k: string) => k !== key)
      : [...s.crmCollapsedGroups, key],
  })),
});