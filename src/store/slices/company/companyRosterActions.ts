import type { CompanyMember } from '../../../types/constants';
import type { CompanyRosterHandlers, RosterMember } from '../../../lib/company/relayRoster';
import type { CompanySlice } from '../companySlice';
import { toast } from 'sonner';
import { getActiveRoster, replaceActiveRoster } from './companyRosterState';

const toRosterMembers = (members: CompanyMember[]): RosterMember[] =>
  members.map((m: CompanyMember) => ({
    userId: m.userId,
    displayName: m.displayName,
    role: m.role,
    publicKey: m.publicKey,
    online: m.online,
  }));

/**
 * Serverless roster/presence sync over the relay: joins the company channel,
 * merges incoming rosters/presence into `companyMembers`, and publishes the
 * local roster. The live connection itself is owned by `companyRosterState`
 * (one per store instance) so `leaveCompanyChannel` and the CRM sync notice can
 * reach it without importing this module.
 */
export const createCompanyRosterActions = (set: any, get: any): Pick<
  CompanySlice,
  'joinCompanyChannel' | 'broadcastRoster'
> => ({
  broadcastRoster: () => {
    const roster = getActiveRoster();
    if (!roster) return;
    roster.publishRoster(toRosterMembers(get().companyMembers));
  },
  joinCompanyChannel: async (token?: string) => {
    const companyId = get().companyId;
    if (!companyId) return;
    try {
      const { getMasterKeySet } = await import('../../../lib/identity/masterKey');
      const { b64encode } = await import('../../../lib/crypto/cryptoCore');
      const { CompanyRosterSync } = await import('../../../lib/company/relayRoster');
      const { saveMembers } = await import('../../../lib/company/companyUser');
      const master = await getMasterKeySet();
      const myPublicKey = b64encode(master.x25519Public);
      const handlers: CompanyRosterHandlers = {
        onRoster: (incoming) => {
          const current = get().companyMembers;
          const byId = new Map<string, CompanyMember>(current.map((m) => [m.userId, m] as [string, CompanyMember]));
          const merged = [...current];
          let changed = false;
          for (const inc of incoming) {
            const existing = byId.get(inc.userId);
            if (!existing) {
              merged.push({
                userId: inc.userId,
                displayName: inc.displayName,
                role: inc.role,
                publicKey: inc.publicKey,
                joinedAt: Date.now(),
                lastActive: Date.now(),
                online: inc.online,
              });
              changed = true;
              toast.success(`${inc.displayName} joined the company`);
            } else if (existing.online !== inc.online || existing.displayName !== inc.displayName || existing.role !== inc.role) {
              const idx = merged.findIndex((m) => m.userId === inc.userId);
              merged[idx] = { ...existing, online: inc.online, displayName: inc.displayName, role: inc.role };
              changed = true;
            }
          }
          if (changed) {
            set({ companyMembers: merged });
            saveMembers(merged).catch(() => {});
          }
        },
        onPresence: (userId, online) => {
          const current = get().companyMembers;
          if (current.some((m) => m.userId === userId && m.online !== online)) {
            set({ companyMembers: current.map((m) => (m.userId === userId ? { ...m, online } : m)) });
          }
        },
        onNotification: (n) => {
          toast.info(n.body ? `${n.title}: ${n.body}` : n.title);
        },
      };
      const sync = new CompanyRosterSync(companyId, myPublicKey, handlers);
      replaceActiveRoster(sync);
      sync.start(token);
      sync.publishRoster(toRosterMembers(get().companyMembers));
      sync.publishPresence(true);
    } catch {
      /* identity not ready — skip sync */
    }
  },
});