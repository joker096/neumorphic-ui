import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/idb', () => ({
  set: vi.fn(() => Promise.resolve(undefined)),
  get: vi.fn(() => Promise.resolve(null)),
}));

import { usePersonalSiteChatStore } from './personalSiteChat';

beforeEach(() => {
  usePersonalSiteChatStore.setState({
    hydrated: false,
    ns: '',
    siteChats: [],
    channelKeys: {},
    websiteContacts: [],
    messages: {},
  });
});

describe('personalSiteChat store', () => {
  it('creates a site chat with a snippet and stores its channel keypair', async () => {
    const chat = await usePersonalSiteChatStore.getState().createSiteChat('  Sales  ');
    expect(chat).not.toBeNull();
    expect(chat!.name).toBe('Sales');
    expect(chat!.snippet).toContain('<script');
    expect(chat!.token).toBeTruthy();
    expect(usePersonalSiteChatStore.getState().siteChats).toHaveLength(1);
    expect(usePersonalSiteChatStore.getState().channelKeys[chat!.id]).toBeTruthy();
  });

  it('does not create an empty site chat', async () => {
    const chat = await usePersonalSiteChatStore.getState().createSiteChat('   ');
    expect(chat).toBeNull();
    expect(usePersonalSiteChatStore.getState().siteChats).toHaveLength(0);
  });

  it('updateConfig regenerates snippet/token and writes the patch', async () => {
    const chat = await usePersonalSiteChatStore.getState().createSiteChat('Alpha');
    const before = chat!.snippet;
    const ok = await usePersonalSiteChatStore.getState().updateConfig(chat!.id, { accent: '#ff0000' });
    expect(ok).toBe(true);
    const updated = usePersonalSiteChatStore.getState().siteChats[0];
    expect(updated.config.accent).toBe('#ff0000');
    expect(updated.snippet).not.toBe(before);
  });

  it('returns false for updateConfig on unknown id', async () => {
    const ok = await usePersonalSiteChatStore.getState().updateConfig('nope', { accent: '#000000' });
    expect(ok).toBe(false);
  });

  it('ingestContact dedupes per site chat', () => {
    const s = usePersonalSiteChatStore.getState();
    s.ingestContact({ siteChatId: 'a', domain: 'shop.com', name: 'Jane', email: 'j@x.com' });
    s.ingestContact({ siteChatId: 'a', domain: 'shop.com', name: 'Jane', email: 'j@x.com' });
    const list = usePersonalSiteChatStore.getState().websiteContacts.filter((c) => c.siteChatId === 'a');
    expect(list).toHaveLength(1);
    expect(list[0].visitCount).toBe(2);
  });

  it('ingestContact keeps different site chats separate', () => {
    const s = usePersonalSiteChatStore.getState();
    s.ingestContact({ siteChatId: 'a', domain: 'a.com', name: 'Bob' });
    s.ingestContact({ siteChatId: 'b', domain: 'b.com', name: 'Bob' });
    const all = usePersonalSiteChatStore.getState().websiteContacts;
    expect(all).toHaveLength(2);
  });

  it('appendMessage caps thread at 200', () => {
    const s = usePersonalSiteChatStore.getState();
    for (let i = 0; i < 210; i++) s.appendMessage('a', { text: String(i), from: 'visitor' });
    expect(usePersonalSiteChatStore.getState().messages.a).toHaveLength(200);
  });

  it('removeSiteChat clears chat, keypair and thread', async () => {
    const chat = await usePersonalSiteChatStore.getState().createSiteChat('X');
    if (!chat) return;
    usePersonalSiteChatStore.getState().appendMessage(chat.id, { text: 'hi', from: 'visitor' });
    usePersonalSiteChatStore.getState().removeSiteChat(chat.id);
    const st = usePersonalSiteChatStore.getState();
    expect(st.siteChats).toHaveLength(0);
    expect(st.channelKeys[chat.id]).toBeUndefined();
    expect(st.messages[chat.id]).toBeUndefined();
  });
});
