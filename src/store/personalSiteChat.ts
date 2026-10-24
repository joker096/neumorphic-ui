/**
 * Standalone (company-independent) website-chat embedding.
 *
 * Each site chat is a self-contained widget: its own embed token, X25519
 * channel keypair, widget config and snippet. It does NOT require a company,
 * a roster or a group key — this store is a separate zustand instance and is
 * persisted under its own IndexedDB keys, so it is fully isolated from the
 * company model.
 *
 * The embed runtime (EmbedWidget) publishes sealed frames to the relay topic
 * `company:<ns>:channel:<id>` where `<ns>` is this installation's personal
 * namespace id. The receiving side (PersonalSiteChatManager) subscribes to the
 * same topic and decrypts with the locally stored channel secret.
 */

import { create } from 'zustand';
import { set, get as idbGet } from '../lib/idb';
import { generateChannelKeyPair, type ChannelKeyPair } from '../lib/embed/embedCrypto';
import { createEmbedToken, generateEmbedSnippet, type EmbedWidgetConfig } from '../lib/embed/token';

export interface PersonalSiteChatConfig extends EmbedWidgetConfig {}

export interface PersonalSiteChat {
  id: string;
  name: string;
  token: string;
  snippet: string;
  config: PersonalSiteChatConfig;
  createdAt: number;
  /** Operator prefilled quick replies shown as chips above the conversation thread. */
  cannedReplies?: string[];
}

export interface PersonalWebsiteContact {
  id: string;
  siteChatId: string;
  domain: string;
  name?: string;
  email?: string;
  phone?: string;
  pageUrl?: string;
  referrer?: string;
  ts: number;
  visitCount: number;
}

export interface PersonalSiteMessage {
  id: string;
  text: string;
  from: 'visitor' | 'me';
  ts: number;
}

const CHATS_KEY = 'personal_site_chats';
const KEYS_KEY = 'personal_site_channel_keys';
const CONTACTS_KEY = 'personal_website_contacts';
const MESSAGES_KEY = 'personal_site_messages';
const NS_KEY = 'personal_ns_id';

export const DEFAULT_PERSONAL_CONFIG: PersonalSiteChatConfig = {
  accent: '#2563EB',
  position: 'bottom-right',
  greeting: 'Hello! How can we help?',
  collectContact: false,
  hideBrand: false,
};

function rid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

interface PersonalSiteChatState {
  hydrated: boolean;
  ns: string;
  siteChats: PersonalSiteChat[];
  channelKeys: Record<string, ChannelKeyPair>;
  websiteContacts: PersonalWebsiteContact[];
  messages: Record<string, PersonalSiteMessage[]>;
  /**
   * Latest visitor ephemeral public key per site chat (b64). Kept in memory
   * only — the guest identity itself is ephemeral per browser, so persisting it
   * would serve no purpose. Used to address operator replies back to the
   * specific visitor who last wrote.
   */
  lastGuestKeys: Record<string, string>;
  hydrate: () => Promise<void>;
  createSiteChat: (name: string) => Promise<PersonalSiteChat | null>;
  updateConfig: (id: string, patch: Partial<PersonalSiteChatConfig>) => Promise<boolean>;
  setCannedReplies: (id: string, replies: string[]) => void;
  rememberGuest: (siteChatId: string, pubKeyB64: string) => void;
  removeSiteChat: (id: string) => void;
  ingestContact: (
    data: Omit<PersonalWebsiteContact, 'id' | 'ts' | 'visitCount'> & { ts?: number },
  ) => PersonalWebsiteContact | null;
  appendMessage: (siteChatId: string, msg: Omit<PersonalSiteMessage, 'id' | 'ts'> & { ts?: number }) => void;
  removeContact: (id: string) => void;
}

export const usePersonalSiteChatStore = create<PersonalSiteChatState>((setState, getState) => ({
  hydrated: false,
  ns: '',
  siteChats: [],
  channelKeys: {},
  websiteContacts: [],
  messages: {},
  lastGuestKeys: {},

  hydrate: async () => {
    if (getState().hydrated) return;
    const [ns, chats, keys, contacts, msgs] = await Promise.all([
      idbGet<string>(NS_KEY),
      idbGet<PersonalSiteChat[]>(CHATS_KEY),
      idbGet<Record<string, ChannelKeyPair>>(KEYS_KEY),
      idbGet<PersonalWebsiteContact[]>(CONTACTS_KEY),
      idbGet<Record<string, PersonalSiteMessage[]>>(MESSAGES_KEY),
    ]);
    let effectiveNs = ns;
    if (!effectiveNs) {
      effectiveNs = rid('personal');
      await set(NS_KEY, effectiveNs);
    }
    setState({
      hydrated: true,
      ns: effectiveNs,
      siteChats: Array.isArray(chats) ? chats : [],
      channelKeys: keys && typeof keys === 'object' ? keys : {},
      websiteContacts: Array.isArray(contacts) ? contacts : [],
      messages: msgs && typeof msgs === 'object' ? msgs : {},
    });
  },

  createSiteChat: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    await getState().hydrate();
    const id = rid('psc');
    const kp = generateChannelKeyPair();
    const config: PersonalSiteChatConfig = {
      ...DEFAULT_PERSONAL_CONFIG,
      greeting: `Hello! Welcome to ${trimmed}.`,
    };
    const ns = getState().ns || (await (async () => {
      const next = rid('personal');
      await set(NS_KEY, next);
      return next;
    })());
    const token = createEmbedToken({
      companyId: ns,
      channelId: id,
      channelPubKeyB64: kp.publicKeyB64,
      label: trimmed,
      config,
    });
    const snippet = generateEmbedSnippet(token);
    const chat: PersonalSiteChat = { id, name: trimmed, token, snippet, config, createdAt: Date.now() };
    const chats = [...getState().siteChats, chat];
    const keys = { ...getState().channelKeys, [id]: kp };
    setState({ siteChats: chats, channelKeys: keys });
    await set(CHATS_KEY, chats);
    await set(KEYS_KEY, keys);
    return chat;
  },

  updateConfig: async (id, patch) => {
    const sc = getState().siteChats.find((x) => x.id === id);
    const kp = getState().channelKeys[id];
    if (!sc || !kp) return false;
    const config: PersonalSiteChatConfig = { ...sc.config, ...patch };
    const token = createEmbedToken({
      companyId: getState().ns || 'personal',
      channelId: id,
      channelPubKeyB64: kp.publicKeyB64,
      label: sc.name,
      config,
    });
    const snippet = generateEmbedSnippet(token);
    const chats = getState().siteChats.map((x) => (x.id === id ? { ...x, token, snippet, config } : x));
    setState({ siteChats: chats });
    await set(CHATS_KEY, chats);
    return true;
  },

  removeSiteChat: (id) => {
    const chats = getState().siteChats.filter((x) => x.id !== id);
    const keys = { ...getState().channelKeys };
    delete keys[id];
    const messages = { ...getState().messages };
    delete messages[id];
    const lastGuestKeys = { ...getState().lastGuestKeys };
    delete lastGuestKeys[id];
    setState({ siteChats: chats, channelKeys: keys, messages, lastGuestKeys });
    void set(CHATS_KEY, chats);
    void set(KEYS_KEY, keys);
    void set(MESSAGES_KEY, messages);
  },

  rememberGuest: (siteChatId, pubKeyB64) => {
    if (!pubKeyB64 || !siteChatId) return;
    setState({
      lastGuestKeys: { ...getState().lastGuestKeys, [siteChatId]: pubKeyB64 },
    });
  },

  setCannedReplies: (id, replies) => {
    const chats = getState().siteChats.map((x) => (x.id === id ? { ...x, cannedReplies: replies } : x));
    setState({ siteChats: chats });
    void set(CHATS_KEY, chats);
  },

  ingestContact: (data) => {
    const domain = String(data.domain || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    if (!domain) return null;
    const contacts = [...getState().websiteContacts];
    const existing = contacts.find(
      (c) =>
        c.siteChatId === data.siteChatId &&
        (Boolean(data.email && data.email === c.email) ||
          Boolean(data.phone && data.phone === c.phone) ||
          (Boolean(data.name) && data.name === c.name)),
    );
    let record: PersonalWebsiteContact;
    if (existing) {
      record = { ...existing, visitCount: existing.visitCount + 1, ts: data.ts ?? Date.now() };
      contacts[contacts.indexOf(existing)] = record;
    } else {
      record = {
        id: rid('wc'),
        siteChatId: data.siteChatId,
        domain,
        name: data.name || 'Website visitor',
        email: data.email,
        phone: data.phone,
        pageUrl: data.pageUrl,
        referrer: data.referrer,
        ts: data.ts ?? Date.now(),
        visitCount: 1,
      };
      contacts.push(record);
    }
    setState({ websiteContacts: contacts });
    void set(CONTACTS_KEY, contacts);
    return record;
  },

  appendMessage: (siteChatId, msg) => {
    const list = [...(getState().messages[siteChatId] ?? [])];
    list.push({ id: rid('pm'), text: msg.text, from: msg.from, ts: msg.ts ?? Date.now() });
    if (list.length > 200) list.splice(0, list.length - 200);
    const messages = { ...getState().messages, [siteChatId]: list };
    setState({ messages });
    void set(MESSAGES_KEY, messages);
  },

  removeContact: (id) => {
    const contacts = getState().websiteContacts.filter((c) => c.id !== id);
    setState({ websiteContacts: contacts });
    void set(CONTACTS_KEY, contacts);
  },
}));
