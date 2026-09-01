import { useAppStore } from '../store';
import { get, set } from '../lib/idb';
import { computeCrmAnalytics } from '../lib/crm/analytics';
import {
  ServiceNotConfiguredError,
  type Services,
  type BotService,
  type PaymentsService,
  type TranslateService,
  type TasksService,
  type AutomationService,
  type AnalyticsService,
  type ModerationService,
  type KnowledgeBaseService,
  type BotProfile,
  type MiniAppDescriptor,
  type Invoice,
  type Task,
  type AutomationRule,
  type ModerationItem,
  type KbArticle,
} from './types';

/**
 * Local-first service adapters. No external network, no telemetry — every
 * adapter reads/writes device-local state (IndexedDB or the CRM store). This
 * makes the Workplace and Bot surfaces functional offline; swapping in a real
 * backend later only requires replacing the relevant adapter.
 */

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 10)}`;

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await get(key);
    return v == null ? fallback : (v as T);
  } catch {
    return fallback;
  }
}

async function save<T>(key: string, val: T): Promise<void> {
  try {
    await set(key, val);
  } catch {
    /* storage unavailable — in-memory only */
  }
}

// ---- bot (backed by idb bots_list persisted by CreateBotModal) ----
const localBot: BotService = {
  async getBotProfile(botId) {
    const bots = (await load<any[]>('bots_list', [])) || [];
    const b = bots.find((x) => x.id === botId);
    if (!b) throw new ServiceNotConfiguredError('bot');
    return {
      id: b.id,
      name: b.name ?? 'Bot',
      username: b.username,
      description: b.description,
      avatarColor: b.avatarColor,
      avatarUrl: b.avatarUrl,
      verified: false,
      commands: Array.isArray(b.commands)
        ? b.commands.map((c: any) => ({ command: c.command ?? c.name, description: c.description ?? '' }))
        : [],
      canOpenMiniApp: Boolean(b.miniApp),
    } as BotProfile;
  },
  async getInlineKeyboard() {
    return [];
  },
  async handleInlineButton() {
    /* local no-op */
  },
  async getMiniApp(botId) {
    const bots = (await load<any[]>('bots_list', [])) || [];
    const b = bots.find((x) => x.id === botId);
    if (!b || !b.miniApp) return null;
    return { name: b.miniApp.name ?? b.name, url: b.miniApp.url } as MiniAppDescriptor;
  },
};

// ---- payments (local ledger; no payment processor network calls) ----
const localPayments: PaymentsService = {
  async getInvoices() {
    return load<Invoice[]>('local_invoices', []);
  },
  async createInvoice(input) {
    const inv: Invoice = { id: uid('inv'), status: 'pending', ...input };
    const all = await load<Invoice[]>('local_invoices', []);
    all.push(inv);
    await save('local_invoices', all);
    return inv;
  },
  async payInvoice(id) {
    const all = await load<Invoice[]>('local_invoices', []);
    const next = all.map((i) => (i.id === id ? { ...i, status: 'paid' as const } : i));
    await save('local_invoices', next);
    const f = next.find((i) => i.id === id);
    if (!f) throw new Error('invoice not found');
    return f;
  },
};

// ---- translate (offline pass-through, no telemetry) ----
const localTranslate: TranslateService = {
  async translate(text: string) {
    return text;
  },
  async detectLang() {
    return 'und';
  },
};

// ---- tasks (backed by the CRM task store) ----
function mapTask(t: any): Task {
  return {
    id: t.id,
    title: t.title,
    done: Boolean(t.done),
    due: t.dueAt ? new Date(t.dueAt).toISOString() : undefined,
    assignee: t.assigneeId ?? undefined,
  };
}

const localTasks: TasksService = {
  async listTasks(filter) {
    const tasks = useAppStore.getState().crmTasks.map(mapTask);
    return filter?.done != null ? tasks.filter((t) => t.done === filter.done) : tasks;
  },
  async createTask(input) {
    useAppStore.getState().addTask({
      title: input.title,
      dueAt: input.due ? new Date(input.due).getTime() : null,
      assigneeId: input.assignee ?? null,
      priority: 'medium',
      contactId: null,
      dealId: null,
    });
    const all = useAppStore.getState().crmTasks;
    const t = all[all.length - 1];
    if (!t) throw new Error('task not created');
    return mapTask(t);
  },
  async updateTask(id, patch) {
    const s = useAppStore.getState();
    const cur = s.crmTasks.find((x) => x.id === id);
    if (!cur) throw new Error('task not found');
    if (patch.done != null && patch.done !== cur.done) s.toggleTask(id);
    if (patch.title != null) s.updateTask(id, { title: patch.title });
    if (patch.due != null) s.updateTask(id, { dueAt: new Date(patch.due).getTime() });
    const t = useAppStore.getState().crmTasks.find((x) => x.id === id);
    if (!t) throw new Error('task not found');
    return mapTask(t);
  },
};

// ---- automation (local rule ledger) ----
const localAutomation: AutomationService = {
  async listRules() {
    return load<AutomationRule[]>('local_automation', []);
  },
  async toggleRule(id, enabled) {
    const all = await load<AutomationRule[]>('local_automation', []);
    const next = all.map((r) => (r.id === id ? { ...r, enabled } : r));
    await save('local_automation', next);
    const f = next.find((r) => r.id === id);
    if (!f) throw new Error('rule not found');
    return f;
  },
};

// ---- analytics (derived from CRM data) ----
const localAnalytics: AnalyticsService = {
  async getChannelMetrics() {
    const s = useAppStore.getState();
    const a = computeCrmAnalytics(s.crmContacts, s.crmDeals, s.crmTasks);
    return [
      { label: 'contacts', value: a.totalContacts },
      { label: 'pipeline', value: a.pipelineValue },
      { label: 'open_deals', value: a.dealsOpen },
      { label: 'tasks_open', value: a.tasksOpen },
      { label: 'churn_risk', value: a.churnRisk.length },
    ];
  },
};

// ---- moderation (local queue) ----
const localModeration: ModerationService = {
  async listQueue() {
    return load<ModerationItem[]>('local_moderation', []);
  },
  async resolve(id) {
    const all = await load<ModerationItem[]>('local_moderation', []);
    const next = all.map((m) => (m.id === id ? { ...m, status: 'resolved' as const } : m));
    await save('local_moderation', next);
    const f = next.find((m) => m.id === id);
    if (!f) throw new Error('item not found');
    return f;
  },
};

// ---- knowledge base (local articles) ----
const localKb: KnowledgeBaseService = {
  async search(query) {
    const all = await load<KbArticle[]>('local_kb', []);
    const q = String(query).toLowerCase();
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.body.toLowerCase().includes(q),
    );
  },
  async getArticle(id) {
    const all = await load<KbArticle[]>('local_kb', []);
    const a = all.find((x) => x.id === id);
    if (!a) throw new Error('article not found');
    return a;
  },
};

export function createLocalServices(): Services {
  return {
    bot: localBot,
    payments: localPayments,
    translate: localTranslate,
    tasks: localTasks,
    automation: localAutomation,
    analytics: localAnalytics,
    moderation: localModeration,
    kb: localKb,
  };
}
