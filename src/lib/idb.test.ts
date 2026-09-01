import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

// In-memory store backing the idb-keyval mock
const kvStore = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  set: vi.fn(async (key: string, value: unknown) => { kvStore.set(key, value); }),
  get: vi.fn(async (key: string) => kvStore.get(key)),
  del: vi.fn(async (key: string) => { kvStore.delete(key); }),
  clear: vi.fn(async () => { kvStore.clear(); }),
  keys: vi.fn(async () => [...kvStore.keys()]),
}));

vi.mock('./crm/atRest', () => ({
  isEncryptedPayload: vi.fn((v: unknown) =>
    typeof v === 'object' && v !== null && 'cipher' in (v as any) && 'iv' in (v as any),
  ),
  encryptCrmData: vi.fn(async (plain: string) => ({ cipher: plain, iv: 'mock-iv' })),
  decryptCrmData: vi.fn(async (payload: { cipher: string }) => payload.cipher),
}));

type IdbModule = typeof import('./idb');
let idb: IdbModule;

describe('idb', () => {
  beforeAll(() => {
    // Ensure hasIdb guard is true so idb-keyval mock path is used
    vi.stubGlobal('indexedDB', {});
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    kvStore.clear();
    vi.clearAllMocks();
    vi.resetModules();
    // Re-import after stub so hasIdb (captured at module eval) is true
    idb = await import('./idb');
  });

  // --- Basic CRUD ---

  it('set stores a value retrievable by get', async () => {
    await idb.set('k1', 'v1');
    expect(await idb.get('k1')).toBe('v1');
  });

  it('get returns undefined for missing key', async () => {
    expect(await idb.get('missing')).toBeUndefined();
  });

  it('del removes a key', async () => {
    await idb.set('k2', 42);
    await idb.del('k2');
    expect(await idb.get('k2')).toBeUndefined();
  });

  it('clear empties all keys', async () => {
    await idb.set('a', 1);
    await idb.set('b', 2);
    await idb.clear();
    expect(await idb.get('a')).toBeUndefined();
    expect(await idb.get('b')).toBeUndefined();
  });

  it('keys returns all stored keys', async () => {
    await idb.set('x', 10);
    await idb.set('y', 20);
    const k = await idb.keys();
    expect(k).toContain('x');
    expect(k).toContain('y');
  });

  // --- Chat operations ---

  it('saveChat + getAllChats stores and retrieves chats', async () => {
    await idb.saveChat({ id: 'c1', name: 'Chat 1', unread: 2 });
    const chats = await idb.getAllChats();
    expect(chats).toHaveLength(1);
    expect(chats[0].id).toBe('c1');
    expect(chats[0].name).toBe('Chat 1');
  });

  it('saveChat updates existing chat', async () => {
    await idb.saveChat({ id: 'c1', name: 'V1' });
    await idb.saveChat({ id: 'c1', name: 'V2' });
    const chats = await idb.getAllChats();
    expect(chats).toHaveLength(1);
    expect(chats[0].name).toBe('V2');
  });

  it('deleteChat removes a chat', async () => {
    await idb.saveChat({ id: 'c1', name: 'C1' });
    await idb.saveChat({ id: 'c2', name: 'C2' });
    await idb.deleteChat('c1');
    const chats = await idb.getAllChats();
    expect(chats).toHaveLength(1);
    expect(chats[0].id).toBe('c2');
  });

  it('clearChats removes all chats', async () => {
    await idb.saveChat({ id: 'c1', name: 'C1' });
    await idb.saveChat({ id: 'c2', name: 'C2' });
    await idb.clearChats();
    expect(await idb.getAllChats()).toEqual([]);
  });

  // --- Contact operations ---

  it('saveContact + getAllContacts', async () => {
    await idb.saveContact({ id: 'ct1', name: 'Alice', phone: '123' });
    const contacts = await idb.getAllContacts();
    expect(contacts).toHaveLength(1);
    expect(contacts[0].name).toBe('Alice');
  });

  // --- Channel operations ---

  it('saveChannel + getAllChannels', async () => {
    await idb.saveChannel({ id: 'ch1', name: 'General', subscriberCount: 10 });
    const channels = await idb.getAllChannels();
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe('General');
  });

  // --- Bot operations ---

  it('saveBot + getAllBots', async () => {
    await idb.saveBot({ id: 'b1', name: 'Bot' });
    const bots = await idb.getAllBots();
    expect(bots).toHaveLength(1);
    expect(bots[0].name).toBe('Bot');
  });

  it('saveBot updates existing bot', async () => {
    await idb.saveBot({ id: 'b1', name: 'V1' });
    await idb.saveBot({ id: 'b1', name: 'V2' });
    const bots = await idb.getAllBots();
    expect(bots).toHaveLength(1);
    expect(bots[0].name).toBe('V2');
  });

  // --- Scheduled messages ---

  it('addScheduledMessage + getAllScheduledMessages (future only)', async () => {
    const future = Date.now() + 60000;
    await idb.addScheduledMessage({ id: 's1', scheduledAt: future });
    const all = await idb.getAllScheduledMessages();
    expect(all).toHaveLength(1);
  });

  it('getAllScheduledMessages excludes past messages', async () => {
    await idb.addScheduledMessage({ id: 's1', scheduledAt: Date.now() - 1000 });
    expect(await idb.getAllScheduledMessages()).toEqual([]);
  });

  it('removeScheduledMessage', async () => {
    await idb.addScheduledMessage({ id: 's1', scheduledAt: Date.now() + 60000 });
    await idb.addScheduledMessage({ id: 's2', scheduledAt: Date.now() + 60000 });
    await idb.removeScheduledMessage('s1');
    const all = await idb.getAllScheduledMessages();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('s2');
  });

  it('clearScheduledMessages', async () => {
    await idb.addScheduledMessage({ id: 's1', scheduledAt: Date.now() + 60000 });
    await idb.clearScheduledMessages();
    expect(await idb.getAllScheduledMessages()).toEqual([]);
  });

  // --- Recording operations ---

  it('saveRecording + getAllRecordings', async () => {
    await idb.saveRecording({ id: 'r1', duration: 30 });
    const all = await idb.getAllRecordings();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('r1');
  });

  it('deleteRecording', async () => {
    await idb.saveRecording({ id: 'r1' });
    await idb.saveRecording({ id: 'r2' });
    await idb.deleteRecording('r1');
    const all = await idb.getAllRecordings();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('r2');
  });

  it('clearRecordings', async () => {
    await idb.saveRecording({ id: 'r1' });
    await idb.clearRecordings();
    expect(await idb.getAllRecordings()).toEqual([]);
  });

  // --- Call history ---

  it('addCallHistoryEntry + getAllCallHistory (sorted desc)', async () => {
    await idb.addCallHistoryEntry({ id: 'h1', timestamp: 100 });
    await idb.addCallHistoryEntry({ id: 'h2', timestamp: 300 });
    await idb.addCallHistoryEntry({ id: 'h3', timestamp: 200 });
    const all = await idb.getAllCallHistory();
    expect(all.map((e: any) => e.id)).toEqual(['h2', 'h3', 'h1']);
  });

  it('clearCallHistory', async () => {
    await idb.addCallHistoryEntry({ id: 'h1' });
    await idb.clearCallHistory();
    expect(await idb.getAllCallHistory()).toEqual([]);
  });

  // --- Company messages ---

  it('addCompanyMessage + getAllCompanyMessages', async () => {
    await idb.addCompanyMessage({ id: 'cm1', text: 'hi' });
    const all = await idb.getAllCompanyMessages();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe('hi');
  });

  // --- Company settings (encrypted at rest) ---

  it('saveCompanySettings + getCompanySettings round-trips via encryption', async () => {
    const settings = { theme: 'dark', lang: 'en' };
    await idb.saveCompanySettings(settings);
    const result = await idb.getCompanySettings();
    expect(result).toEqual(settings);
  });

  it('getCompanySettings returns null when empty', async () => {
    expect(await idb.getCompanySettings()).toBeNull();
  });

  // --- Company ID ---

  it('saveCompanyId + getCompanyId', async () => {
    await idb.saveCompanyId('comp-123');
    expect(await idb.getCompanyId()).toBe('comp-123');
  });

  it('getCompanyId returns null when empty', async () => {
    expect(await idb.getCompanyId()).toBeNull();
  });

  // --- Company members (encrypted at rest) ---

  it('saveCompanyMembers + getCompanyMembers round-trips', async () => {
    const members = [{ id: 'm1', name: 'Alice', role: 'admin' }] as any[];
    await idb.saveCompanyMembers(members);
    const result = await idb.getCompanyMembers();
    expect(result).toEqual(members);
  });

  it('getCompanyMembers returns null when empty', async () => {
    expect(await idb.getCompanyMembers()).toBeNull();
  });
});
