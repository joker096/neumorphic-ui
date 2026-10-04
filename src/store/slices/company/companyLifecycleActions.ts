import * as idb from '../../../lib/idb';
import type { CompanyChannel, CompanyMember } from '../../../types/constants';
import type { InviteQRPayload } from '../../../lib/company/types';
import type { CompanySlice } from '../companySlice';

/**
 * Company lifecycle: creating a company (admin key + group key + General channel),
 * invite QR payloads, joining via invite, and accepting a stored invite code.
 */
export const createCompanyLifecycleActions = (set: any, get: any): Pick<
  CompanySlice,
  'initCompanyFromInvite' | 'createCompany' | 'createCompanyInvite' | 'joinCompanyFromInvite' | 'acceptInvite'
> => ({
  initCompanyFromInvite: async (payload) => {
    const { initializeJoinFlow } = await import('../../../lib/company/onboarding/joinFlow');
    await initializeJoinFlow(payload, '');
    set({ pendingInvite: payload });
  },
  createCompany: async (name, displayName) => {
    const { generateCompanyId, createCompanyUser, saveMembers } = await import('../../../lib/company/companyUser');
    const { b64encode } = await import('../../../lib/crypto/cryptoCore');
    const { generateGroupKey, exportRawKey } = await import('../../../lib/company/groupKey');
    const companyId = generateCompanyId();
    const user = await createCompanyUser(displayName, companyId, 'admin');
    const currentUserId = get().userProfile?.id || user.userId;
    const members: CompanyMember[] = [{
      userId: currentUserId,
      displayName: user.displayName,
      role: 'admin',
      publicKey: b64encode(user.publicKey),
      joinedAt: Date.now(),
      lastActive: Date.now(),
      online: true,
    }];
    const settings = { name, phone: '', email: '', address: '', website: '', taxId: '' };
    const groupKey = await generateGroupKey();
    const groupRaw = await exportRawKey(groupKey);
    const channel: CompanyChannel = {
      id: `chan_${companyId}_general`,
      companyId,
      name: 'General',
      description: 'Team channel',
      unread: 0,
      memberCount: members.length,
      createdAt: Date.now(),
    };
    set({
      companyId,
      companySettings: settings,
      companyMembers: members,
      activeGroupKey: groupKey,
      activeGroupKeyVersion: 1,
      companyChannels: [channel],
      activeChannelId: channel.id,
    });
    await idb.saveCompanySettings(settings as unknown as Record<string, string>);
    await idb.saveCompanyId(companyId);
    await saveMembers(members);
    await idb.saveCompanyGroupKey(companyId, groupRaw);
    await idb.saveCompanyChannels([channel]);
    get().joinCompanyChannel();
  },
  createCompanyInvite: async () => {
    const id = get().companyId;
    if (!id) return null;
    const { generateInviteCode } = await import('../../../lib/company/companyUser');
    const code = generateInviteCode();
    const name = get().companySettings?.name || 'Company';
    const adminKey = get().companyMembers.find((m: CompanyMember) => m.role === 'admin')?.publicKey || '';
    const payload: InviteQRPayload = { org: id, code, name, adminKey };
    return payload;
  },
  joinCompanyFromInvite: async (payload, displayName) => {
    const { createCompanyUser, saveMembers } = await import('../../../lib/company/companyUser');
    const { b64encode } = await import('../../../lib/crypto/cryptoCore');
    const { generateGroupKey, exportRawKey, importRawKey } = await import('../../../lib/company/groupKey');
    const user = await createCompanyUser(displayName, payload.org, 'member');
    const currentUserId = get().userProfile?.id || user.userId;
    const member: CompanyMember = {
      userId: currentUserId,
      displayName: user.displayName,
      role: 'member',
      publicKey: b64encode(user.publicKey),
      joinedAt: Date.now(),
      lastActive: Date.now(),
      online: true,
    };
    const members = [...get().companyMembers, member];
    // NOTE: in production the admin delivers a wrapped group key over the
    // relay; here we reuse an existing local key or generate a fresh one so a
    // second local profile can still participate in the demo.
    let groupKey: CryptoKey | null = null;
    try {
      const existing = await idb.getCompanyGroupKey(payload.org);
      if (existing) groupKey = await importRawKey(existing);
    } catch {
      groupKey = null;
    }
    if (!groupKey) {
      groupKey = await generateGroupKey();
      await idb.saveCompanyGroupKey(payload.org, await exportRawKey(groupKey));
    }
    set({ companyId: payload.org, companyMembers: members, activeGroupKey: groupKey, activeGroupKeyVersion: 1 });
    await idb.saveCompanyId(payload.org);
    await saveMembers(members);
    get().joinCompanyChannel();
  },
  acceptInvite: async (code: string) => {
    const invites = (await idb.get('company_invites')) as
      | Record<string, { companyId: string }>
      | null;
    const rec = invites?.[code];
    if (!rec) return false;
    try {
      const groupRaw = await idb.getCompanyGroupKey(rec.companyId);
      const { importRawKey } = await import('../../../lib/company/groupKey');
      const groupKey = groupRaw ? await importRawKey(groupRaw) : null;
      set({
        companyId: rec.companyId,
        activeGroupKey: groupKey,
        activeGroupKeyVersion: groupKey ? 1 : 0,
      });
      await idb.saveCompanyId(rec.companyId);
      return true;
    } catch {
      return false;
    }
  },
});