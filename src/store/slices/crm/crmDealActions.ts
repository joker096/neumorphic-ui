import type { Deal, DealStage } from '../../../lib/crm/types';
import { uid } from './crmShared';
import type { CrmSlice } from '../crmSlice';

/** Deal (pipeline) mutations. */
export const createCrmDealActions = (set: any): Pick<
  CrmSlice,
  'addDeal' | 'updateDeal' | 'setDealStage' | 'removeDeal'
> => ({
  addDeal: (deal) => set((s: any) => ({
    crmDeals: [...s.crmDeals, { ...deal, id: uid('deal'), createdAt: Date.now() }],
  })),
  updateDeal: (id, patch) => set((s: any) => ({
    crmDeals: s.crmDeals.map((d: Deal) => (d.id === id ? { ...d, ...patch } : d)),
  })),
  setDealStage: (id, stage: DealStage) => set((s: any) => ({
    crmDeals: s.crmDeals.map((d: Deal) => (d.id === id ? { ...d, stage } : d)),
  })),
  removeDeal: (id) => set((s: any) => ({
    crmDeals: s.crmDeals.filter((d: Deal) => d.id !== id),
  })),
});