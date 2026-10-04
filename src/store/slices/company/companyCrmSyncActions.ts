import * as idb from '../../../lib/idb';
import type { CompanyEnvelope } from '../../../lib/company/types';
import type { CrmContact, Deal, CrmTask } from '../../../lib/crm/types';
import type { CompanySlice } from '../companySlice';
import { getActiveRoster } from './companyRosterState';

/** Encrypted CRM snapshot sync over the company group key (envelope queue). */
export const createCompanyCrmSyncActions = (set: any, get: any): Pick<
  CompanySlice,
  'pushCrmSyncEnvelope' | 'syncCrmOutbound' | 'applyCrmEnvelope'
> => ({
  pushCrmSyncEnvelope: (env) => {
    set((s: any) => ({ companyCrmEnvelopes: [...s.companyCrmEnvelopes, env] }));
    idb.saveCompanyCrmEnvelopes(get().companyCrmEnvelopes).catch(() => {});
  },
  syncCrmOutbound: async () => {
    const gk = get().activeGroupKey;
    const companyId = get().companyId;
    if (!gk || !companyId) return { ok: false };
    try {
      const { getMasterKeySet } = await import('../../../lib/identity/masterKey');
      const { b64encode } = await import('../../../lib/crypto/cryptoCore');
      const { sealCrmSnapshot } = await import('../../../lib/company/companyCrmSync');
      const master = await getMasterKeySet();
      const meta = {
        companyId,
        senderPubKey: b64encode(master.x25519Public),
        groupKeyVersion: get().activeGroupKeyVersion,
      };
      const payload = {
        contacts: (get().crmContacts as CrmContact[] | undefined) ?? [],
        deals: (get().crmDeals as Deal[] | undefined) ?? [],
        tasks: (get().crmTasks as CrmTask[] | undefined) ?? [],
      };
      const env = await sealCrmSnapshot(gk, meta, payload);
      get().pushCrmSyncEnvelope(env);
      getActiveRoster()?.notify('CRM sync', 'encrypted');
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },
  applyCrmEnvelope: async (env) => {
    const gk = get().activeGroupKey;
    if (!gk) return;
    try {
      const { openCrmSnapshot } = await import('../../../lib/company/companyCrmSync');
      const payload = await openCrmSnapshot(gk, env);
      get().importBatch(payload);
    } catch {
      /* corrupt envelope — ignore */
    }
  },
});