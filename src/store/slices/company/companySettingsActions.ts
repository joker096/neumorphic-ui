import * as idb from '../../../lib/idb';
import type { CompanySlice } from '../companySlice';
import type { SiteChat, WebsiteContactRecord } from './siteChatTypes';

/**
 * Company profile + persisted bootstrap: settings mutations, the office-only
 * visibility flag, and `loadCompanySettings` — the mount-time reader that
 * restores the company id, group key, channels, CRM envelopes, channel keys,
 * site chats and website contacts from IndexedDB.
 */
export const createCompanySettingsActions = (set: any, get: any): Pick<
  CompanySlice,
  | 'setCompanyName'
  | 'setCompanySettings'
  | 'updateCompanyField'
  | 'setHideWhenOfficeOnly'
  | 'loadCompanySettings'
  | 'saveCompanySettings'
> => ({
  setCompanyName: (name) => set((state: any) => ({
    companySettings: state.companySettings ? { ...state.companySettings, name } : { name } as { name: string; logo?: string }
  })),
  setCompanySettings: (settings) => set({ companySettings: settings }),
  updateCompanyField: (field, value) => set((state: any) => ({
    companySettings: state.companySettings ? { ...state.companySettings, [field]: value } : { name: '', [field]: value }
  })),
  setHideWhenOfficeOnly: (hide) => {
    set({ hideWhenOfficeOnly: hide });
    localStorage.setItem('app_hide_when_office_only', String(hide));
  },
  loadCompanySettings: async () => {
    const [stored, storedId, storedMembers] = await Promise.all([
      idb.getCompanySettings(),
      idb.getCompanyId(),
      idb.getCompanyMembers(),
    ]);
    if (stored) {
      set({ companySettings: stored as any });
    }
    if (storedId) {
      set({ companyId: storedId });
      get().joinCompanyChannel();
    }
    if (storedMembers && storedMembers.length > 0) {
      set({ companyMembers: storedMembers });
    }
    if (storedId) {
      const [raw, chans, envs, ck, sc, wc] = await Promise.all([
        idb.getCompanyGroupKey(storedId),
        idb.getCompanyChannels(),
        idb.getCompanyCrmEnvelopes(),
        idb.getCompanyChannelKeys(),
        idb.getCompanySiteChats(),
        idb.getCompanyWebsiteContacts(),
      ]);
      if (wc && wc.length) set({ websiteContacts: wc as WebsiteContactRecord[] });
      if (raw) {
        try {
          const { importRawKey } = await import('../../../lib/company/groupKey');
          set({ activeGroupKey: await importRawKey(raw), activeGroupKeyVersion: 1 });
        } catch {
          /* ignore corrupt key */
        }
      }
      if (chans && chans.length) {
        set({ companyChannels: chans, activeChannelId: get().activeChannelId ?? chans[0].id });
      }
      if (envs && envs.length) set({ companyCrmEnvelopes: envs });
      if (ck) set({ channelKeys: ck as Record<string, { publicKeyB64: string; secretKeyB64: string }> });
      if (sc) set({ siteChats: sc as SiteChat[] });
    }
  },
  saveCompanySettings: async () => {
    const current = get().companySettings;
    if (current) {
      await idb.saveCompanySettings(current as unknown as Record<string, string>);
    }
  },
});