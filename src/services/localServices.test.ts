// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const idbStore = new Map<string, any>();
const storeState = {
  crmTasks: [] as any[],
  crmContacts: [] as any[],
  crmDeals: [] as any[],
  addTask: (t: any) => {
    storeState.crmTasks.push({ ...t, id: `task_${storeState.crmTasks.length}`, done: false, createdAt: 1 });
  },
  updateTask: () => {},
  toggleTask: () => {},
};

vi.mock('../lib/idb', () => ({
  get: async (k: string) => (idbStore.has(k) ? idbStore.get(k) : null),
  set: async (k: string, v: any) => {
    idbStore.set(k, v);
  },
}));

vi.mock('../store', () => ({
  useAppStore: {
    getState: () => storeState,
  },
}));

import { createLocalServices } from './localServices';
import { ServiceNotConfiguredError } from './types';

describe('createLocalServices', () => {
  beforeEach(() => {
    idbStore.clear();
    storeState.crmTasks = [];
  });

  it('returns all eight adapters', () => {
    const s = createLocalServices();
    expect(Object.keys(s).sort()).toEqual(
      ['analytics', 'automation', 'bot', 'kb', 'moderation', 'payments', 'tasks', 'translate'].sort(),
    );
  });

  it('translate is offline pass-through, no telemetry', async () => {
    const s = createLocalServices();
    await expect(s.translate.translate('привет', 'ru', 'en')).resolves.toBe('привет');
    await expect(s.translate.detectLang('x')).resolves.toBe('und');
  });

  it('payments creates and marks paid', async () => {
    const s = createLocalServices();
    const inv = await s.payments.createInvoice({ title: 'T', amount: 10, currency: 'USD' });
    expect(inv.status).toBe('pending');
    const all = await s.payments.getInvoices();
    expect(all).toHaveLength(1);
    const paid = await s.payments.payInvoice(inv.id);
    expect(paid.status).toBe('paid');
  });

  it('automation/kb/moderation fall back to empty', async () => {
    const s = createLocalServices();
    await expect(s.automation.listRules()).resolves.toEqual([]);
    await expect(s.kb.search('q')).resolves.toEqual([]);
    await expect(s.moderation.listQueue()).resolves.toEqual([]);
  });

  it('bot profile throws ServiceNotConfiguredError when none stored', async () => {
    const s = createLocalServices();
    await expect(s.bot.getBotProfile('missing')).rejects.toBeInstanceOf(ServiceNotConfiguredError);
  });

  it('tasks list/create map to CRM store', async () => {
    const s = createLocalServices();
    const created = await s.tasks.createTask({ title: 'Follow up' });
    expect(created.title).toBe('Follow up');
    expect(created.done).toBe(false);
    const list = await s.tasks.listTasks();
    expect(list).toHaveLength(1);
  });

  it('analytics derives metric points from CRM state', async () => {
    const s = createLocalServices();
    const metrics = await s.analytics.getChannelMetrics('c1');
    expect(metrics.find((m) => m.label === 'contacts')?.value).toBe(0);
    expect(Array.isArray(metrics)).toBe(true);
  });
});
