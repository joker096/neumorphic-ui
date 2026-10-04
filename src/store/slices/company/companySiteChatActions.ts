import * as idb from '../../../lib/idb';
import type { CompanyChannel } from '../../../types/constants';
import { siteContactTag, type CrmContact } from '../../../lib/crm/types';
import type { CompanySlice } from '../companySlice';
import { DEFAULT_SITE_CHAT_CONFIG, type SiteChat, type SiteChatWidgetConfig, type WebsiteContactRecord } from './siteChatTypes';

/**
 * Embedded site chats: widget channels (embed token + keypair + snippet) and the
 * website contacts captured by those widgets, mirrored into CRM as website leads.
 */
export const createCompanySiteChatActions = (set: any, get: any): Pick<
  CompanySlice,
  'createSiteChat' | 'updateSiteChatConfig' | 'ingestWebsiteContact' | 'removeWebsiteContact'
> => ({
  createSiteChat: async (name) => {
    const companyId = get().companyId;
    if (!companyId) return null;
    const channelId = `chan_${companyId}_site_${Math.random().toString(36).slice(2, 8)}`;
    const channel: CompanyChannel = {
      id: channelId,
      companyId,
      name: `Site: ${name}`,
      description: 'Embedded website chat',
      unread: 0,
      memberCount: 1,
      createdAt: Date.now(),
    };
    const { generateChannelKeyPair } = await import('../../../lib/embed/embedCrypto');
    const { createEmbedToken, generateEmbedSnippet } = await import('../../../lib/embed/token');
    const kp = generateChannelKeyPair();
    const channelKeys = { ...get().channelKeys, [channelId]: kp };
    const token = createEmbedToken({
      companyId,
      channelId,
      channelPubKeyB64: kp.publicKeyB64,
      label: name,
      config: { ...DEFAULT_SITE_CHAT_CONFIG, greeting: `Hello! Welcome to ${name}.` },
    });
    const snippet = generateEmbedSnippet(token);
    const siteChat: SiteChat = {
      id: channelId,
      name,
      token,
      snippet,
      createdAt: Date.now(),
      config: { ...DEFAULT_SITE_CHAT_CONFIG, greeting: `Hello! Welcome to ${name}.` },
    };
    const siteChats = [...get().siteChats, siteChat];
    set((s: any) => ({
      companyChannels: [...s.companyChannels, channel],
      channelKeys,
      siteChats,
      activeChannelId: channelId,
    }));
    await idb.saveCompanyChannels(get().companyChannels);
    await idb.saveCompanyChannelKeys(channelKeys);
    await idb.saveCompanySiteChats(siteChats);
    get().joinCompanyChannel();
    return { channelId, token, snippet };
  },
  updateSiteChatConfig: async (id, patch) => {
    const sc = get().siteChats.find((x: SiteChat) => x.id === id);
    if (!sc) return null;
    const { createEmbedToken, generateEmbedSnippet } = await import('../../../lib/embed/token');
    const config: SiteChatWidgetConfig = { ...sc.config, ...patch };
    const token = createEmbedToken({
      companyId: get().companyId!,
      channelId: sc.id,
      channelPubKeyB64: get().channelKeys[sc.id].publicKeyB64,
      label: sc.name,
      config,
    });
    const snippet = generateEmbedSnippet(token);
    const siteChats = get().siteChats.map((x: SiteChat) => (x.id === id ? { ...x, token, snippet, config } : x));
    set({ siteChats });
    await idb.saveCompanySiteChats(siteChats);
    return { token, snippet };
  },
  ingestWebsiteContact: (data) => {
    const domain = String(data.domain || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    if (!domain) return null;
    const contacts = [...get().websiteContacts];
    const existing = contacts.find(
      (c: WebsiteContactRecord) =>
        c.siteChatId === data.siteChatId &&
        (Boolean(data.email && data.email === c.email) ||
          Boolean(data.phone && data.phone === c.phone) ||
          (Boolean(data.name) && data.name === c.name)),
    );
    let record: WebsiteContactRecord;
    if (existing) {
      record = { ...existing, visitCount: existing.visitCount + 1, ts: data.ts ?? Date.now() };
      contacts[contacts.indexOf(existing)] = record;
    } else {
      record = {
        id: `wc_${Math.random().toString(36).slice(2, 10)}`,
        siteChatId: data.siteChatId,
        domain,
        name: data.name || 'Website visitor',
        email: data.email,
        phone: data.phone,
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle,
        referrer: data.referrer,
        ts: data.ts ?? Date.now(),
        visitCount: 1,
      };
      contacts.push(record);
      // Mirror into CRM as a website-sourced lead (merge by userId on re-import).
      const tag = siteContactTag(domain);
      const crmId = record.id;
      record.crmUserId = crmId;
      get().importBatch({
        contacts: [],
        deals: [],
        tasks: [],
        mergedContacts: [
          {
            userId: crmId,
            displayName: record.name,
            role: 'member',
            email: record.email,
            phone: record.phone,
            tags: [tag, 'lead'],
            status: 'lead',
            source: 'website',
            websiteDomain: domain,
            lastActive: record.ts,
            joinedAt: record.ts,
          } as CrmContact,
        ],
      });
    }
    set({ websiteContacts: contacts });
    idb.saveCompanyWebsiteContacts(contacts).catch(() => {});
    return record;
  },
  removeWebsiteContact: (id) => {
    const contacts = get().websiteContacts.filter((c: WebsiteContactRecord) => c.id !== id);
    set({ websiteContacts: contacts });
    idb.saveCompanyWebsiteContacts(contacts).catch(() => {});
  },
});