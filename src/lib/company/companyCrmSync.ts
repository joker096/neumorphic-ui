/**
 * E2E-encrypted CRM sync unit for a company.
 *
 * The CRM snapshot (contacts/deals/tasks) is sealed with the company group
 * key into a CompanyEnvelope. That envelope is the portable sync unit: it can
 * be relayed to team members (best-effort, graceful no-op without a relay) or
 * stored locally. Only holders of the group key can open it. No plaintext CRM
 * data ever crosses the transport layer.
 */

import type { CompanyEnvelope } from './types';
import type { CrmContact, Deal, CrmTask } from '../crm/types';
import { sealEnvelope, openEnvelope } from './groupKey';

export interface CrmSyncPayload {
  contacts: CrmContact[];
  deals: Deal[];
  tasks: CrmTask[];
}

export interface CrmSyncMeta {
  companyId: string;
  senderPubKey: string;
  groupKeyVersion: number;
}

/** Seal a CRM snapshot into a team envelope. */
export async function sealCrmSnapshot(
  groupKey: CryptoKey,
  meta: CrmSyncMeta,
  payload: CrmSyncPayload,
): Promise<CompanyEnvelope> {
  return sealEnvelope(groupKey, { ...meta, text: JSON.stringify(payload) });
}

/** Open a CRM sync envelope back into its snapshot. */
export async function openCrmSnapshot(groupKey: CryptoKey, env: CompanyEnvelope): Promise<CrmSyncPayload> {
  const json = await openEnvelope(groupKey, env);
  const data = JSON.parse(json) as Partial<CrmSyncPayload>;
  return {
    contacts: Array.isArray(data.contacts) ? data.contacts : [],
    deals: Array.isArray(data.deals) ? data.deals : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
  };
}
