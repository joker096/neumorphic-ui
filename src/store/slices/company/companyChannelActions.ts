import * as idb from '../../../lib/idb';
import type { CompanyChannel, CompanyMessage } from '../../../types/constants';
import type { CompanySlice } from '../companySlice';
import { stopActiveRoster } from './companyRosterState';

/** Company id / channel list / persisted company messages + roster teardown. */
export const createCompanyChannelActions = (set: any, get: any): Pick<
  CompanySlice,
  | 'setCompanyId'
  | 'setCompanyChannels'
  | 'addCompanyMessage'
  | 'loadCompanyMessages'
  | 'setActiveChannel'
  | 'loadCompanyChannels'
  | 'leaveCompanyChannel'
> => ({
  setCompanyId: (id) => set({ companyId: id }),
  setCompanyChannels: (channels) => set({ companyChannels: channels }),
  addCompanyMessage: (msg) => {
    set((state: any) => ({ companyMessages: [...state.companyMessages, msg] }));
    idb.addCompanyMessage(msg).catch(() => {});
  },
  loadCompanyMessages: async () => {
    try {
      const msgs = await idb.getAllCompanyMessages();
      if (msgs.length > 0) {
        set({ companyMessages: msgs });
      }
    } catch {
      /* ignore */
    }
  },
  setActiveChannel: (id) => set({ activeChannelId: id }),
  loadCompanyChannels: async () => {
    const chans = await idb.getCompanyChannels();
    if (chans && chans.length) {
      set({ companyChannels: chans, activeChannelId: get().activeChannelId ?? chans[0].id });
    }
  },
  leaveCompanyChannel: () => {
    stopActiveRoster();
  },
});