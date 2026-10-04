import type { CompanyMember } from '../../../types/constants';
import type { CompanySlice } from '../companySlice';

/** Roster mutations (role / rename / remove) and the local presence flag. */
export const createCompanyMemberActions = (set: any, get: any): Pick<
  CompanySlice,
  'setCompanyMembers' | 'updateMemberRole' | 'renameMember' | 'removeMember' | 'setOnlineStatus'
> => ({
  setCompanyMembers: (members) => set({ companyMembers: members }),
  updateMemberRole: (userId, role) => {
    const next = get().companyMembers.map((m: CompanyMember) =>
      m.userId === userId ? { ...m, role } : m,
    );
    set({ companyMembers: next });
    import('../../../lib/company/companyUser')
      .then(({ saveMembers }) => saveMembers(next))
      .catch(() => {});
    get().broadcastRoster();
  },
  renameMember: (userId, displayName) => set((state: any) => ({
    companyMembers: state.companyMembers.map((m: CompanyMember) =>
      m.userId === userId ? { ...m, displayName } : m,
    ),
  })),
  removeMember: (userId) => {
    const next = get().companyMembers.filter((m: CompanyMember) => m.userId !== userId);
    set({ companyMembers: next });
    import('../../../lib/company/companyUser')
      .then(({ saveMembers }) => saveMembers(next))
      .catch(() => {});
    get().broadcastRoster();
  },
  setOnlineStatus: (online) => set({ isOnline: online }),
});