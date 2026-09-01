import { useState } from "react";
import {
  CheckSquare,
  Workflow,
  BarChart3,
  ShieldAlert,
  BookOpen,
  CreditCard,
  Plus,
  Search,
  CheckCheck,
} from "lucide-react";
import { useI18n } from "../../../lib/i18n";
import { useServices, useServiceData, NotConfiguredState } from "../../../services";
import { DataState } from "../../ui/DataState";
import { Skeleton } from "../../ui/Skeleton";

type TabId = "tasks" | "automation" | "analytics" | "moderation" | "kb" | "payments";

const TAB_LABEL: Record<TabId, string> = {
  tasks: "workplace.tabTasks",
  automation: "workplace.tabAutomation",
  analytics: "workplace.tabAnalytics",
  moderation: "workplace.tabModeration",
  kb: "workplace.tabKb",
  payments: "workplace.tabPayments",
};

const TABS: { id: TabId; icon: typeof CheckSquare }[] = [
  { id: "tasks", icon: CheckSquare },
  { id: "automation", icon: Workflow },
  { id: "analytics", icon: BarChart3 },
  { id: "moderation", icon: ShieldAlert },
  { id: "kb", icon: BookOpen },
  { id: "payments", icon: CreditCard },
];

export interface WorkplaceViewProps {
  isDark?: boolean;
  channelId?: string;
}

export function WorkplaceView({ isDark, channelId = "demo" }: WorkplaceViewProps) {
  const { t } = useI18n();
  const [tab, setTab] = useState<TabId>("tasks");

  return (
    <div className={`flex-1 flex flex-col h-full min-h-0 ${isDark ? "text-gray-100" : "text-slate-800"}`}>
      <div className="flex items-center gap-2 p-3 border-b border-[var(--border-color)] overflow-x-auto">
        {TABS.map((tabItem) => {
          const Icon = tabItem.icon;
          const active = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              onClick={() => setTab(tabItem.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                active ? "bg-[var(--accent)] text-white" : isDark ? "bg-[var(--bg-tertiary)]" : "bg-white border border-[var(--border-color)]"
              }`}
            >
              <Icon size={16} /> {t(TAB_LABEL[tabItem.id])}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "tasks" && <TasksTab isDark={isDark} />}
        {tab === "automation" && <AutomationTab isDark={isDark} />}
        {tab === "analytics" && <AnalyticsTab isDark={isDark} channelId={channelId} />}
        {tab === "moderation" && <ModerationTab isDark={isDark} />}
        {tab === "kb" && <KbTab isDark={isDark} />}
        {tab === "payments" && <PaymentsTab isDark={isDark} />}
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto flex flex-col gap-3">{children}</div>;
}

function TasksTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { tasks } = useServices();
  const state = useServiceData(() => tasks.listTasks(), []);
  const [title, setTitle] = useState("");

  if (state.status === "notConfigured") {
    return <NotConfiguredState isDark={isDark} feature="tasks" />;
  }
  if (state.status === "error") {
    return <DataState status="error" isDark={isDark} title={t('workplace.tasksError')} description={state.error} />;
  }

  return (
    <Panel>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await tasks.createTask({ title });
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('workplace.newTask')}
          className="flex-1 px-3 py-2 rounded-xl border border-[var(--border-color)] bg-transparent"
        />
        <button type="submit" className="px-3 py-2 rounded-xl bg-[var(--accent)] text-white" aria-label={t('workplace.add')}>
          <Plus size={18} />
        </button>
      </form>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.noTasks')} description={t('workplace.createFirstTask')} />
      ) : (
        state.data.map((t) => (
          <label key={t.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <input type="checkbox" checked={t.done} onChange={() => tasks.updateTask(t.id, { done: !t.done })} />
            <span className={t.done ? "line-through opacity-60" : ""}>{t.title}</span>
            {t.assignee && <span className="ml-auto text-xs opacity-60">{t.assignee}</span>}
          </label>
        ))
      )}
    </Panel>
  );
}

function AutomationTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { automation } = useServices();
  const state = useServiceData(() => automation.listRules(), []);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="automation" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.automationError')} description={state.error} />;

  return (
    <Panel>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.noRules')} description={t('workplace.addRules')} />
      ) : (
        state.data.map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <div className="flex-1">
              <div className="font-semibold text-sm">{r.name}</div>
              <div className="text-xs opacity-60">{r.trigger} → {r.action}</div>
            </div>
            <input type="checkbox" checked={r.enabled} onChange={() => automation.toggleRule(r.id, !r.enabled)} aria-label={t('workplace.on')} />
          </div>
        ))
      )}
    </Panel>
  );
}

function AnalyticsTab({ isDark, channelId }: { isDark?: boolean; channelId: string }) {
  const { t } = useI18n();
  const { analytics } = useServices();
  const state = useServiceData(() => analytics.getChannelMetrics(channelId), [channelId]);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="analytics" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.analyticsError')} description={state.error} />;

  const max = state.status === "loaded" ? Math.max(1, ...state.data.map((m) => m.value)) : 1;
  return (
    <Panel>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.noData')} description={t('workplace.metricsAppear')} />
      ) : (
        state.data.map((m) => (
          <div key={m.label} className="px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <div className="flex justify-between text-sm mb-1">
              <span>{m.label}</span>
              <span className="opacity-70">{m.value}</span>
            </div>
            <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-[var(--accent)]" style={{ width: `${(m.value / max) * 100}%` }} />
            </div>
          </div>
        ))
      )}
    </Panel>
  );
}

function ModerationTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { moderation } = useServices();
  const state = useServiceData(() => moderation.listQueue(), []);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="moderation" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.moderationError')} description={state.error} />;

  return (
    <Panel>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.queueEmpty')} description={t('workplace.complaintsHere')} />
      ) : (
        state.data.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <span className="text-xs uppercase opacity-60">{item.type}</span>
            <span className="flex-1 text-sm">{item.summary}</span>
            <button
              onClick={() => moderation.resolve(item.id)}
              aria-label={t('workplace.resolve')}
              title={t('workplace.resolve')}
              className="w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-lg bg-[var(--accent)] text-white text-xs"
            >
              <CheckCheck size={18} />
              <span className="sr-only">{t('workplace.resolve')}</span>
            </button>
          </div>
        ))
      )}
    </Panel>
  );
}

function KbTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { kb } = useServices();
  const [q, setQ] = useState("");
  const state = useServiceData(() => (q.trim() ? kb.search(q) : Promise.resolve([])), [q]);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="knowledge_base" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.kbError')} description={state.error} />;

  return (
    <Panel>
      <div className="flex items-center gap-2 px-3 rounded-xl border border-[var(--border-color)]">
        <Search size={16} className="opacity-60" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('workplace.searchKb')}
          className="flex-1 bg-transparent py-2 outline-none"
        />
      </div>
      {q.trim() === "" ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.enterQuery')} description={t('workplace.searchKbArticles')} />
      ) : state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} emptyIcon="search" title={t('workplace.nothingFound')} description={t('workplace.nothingFoundHint')} />
      ) : (
        state.data.map((a) => (
          <article key={a.id} className="px-3 py-2 rounded-xl border border-[var(--border-color)]">
            <h4 className="font-semibold text-sm">{a.title}</h4>
            <p className="text-xs opacity-70 line-clamp-2">{a.body}</p>
          </article>
        ))
      )}
    </Panel>
  );
}

export interface PaymentCardProps {
  invoice: { id: string; title: string; amount: number; currency: string; description?: string; status: string };
  isDark?: boolean;
  onPay?: (id: string) => void;
}

export function PaymentCard({ invoice, isDark, onPay }: PaymentCardProps) {
  const { t } = useI18n();
  return (
    <div className={`p-4 rounded-2xl border border-[var(--border-color)] ${isDark ? "bg-[var(--bg-tertiary)]" : "bg-white"}`}>
      <div className="flex items-center gap-2 mb-1">
        <CreditCard size={18} className="text-[var(--accent)]" />
        <span className="font-semibold">{invoice.title}</span>
      </div>
      {invoice.description && <p className="text-xs opacity-70 mb-2">{invoice.description}</p>}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">
          {invoice.amount} {invoice.currency}
        </span>
        {invoice.status === "paid" ? (
          <span className="text-green-500 text-sm font-semibold">{t('workplace.paid')}</span>
        ) : (
          <button
            onClick={() => onPay?.(invoice.id)}
            aria-label={t('workplace.pay')}
            title={t('workplace.pay')}
            className="w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-[var(--accent)] text-white text-sm font-semibold"
          >
            <CreditCard size={18} />
            <span className="sr-only">{t('workplace.pay')}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentsTab({ isDark }: { isDark?: boolean }) {
  const { t } = useI18n();
  const { payments } = useServices();
  const state = useServiceData(() => payments.getInvoices(), []);

  if (state.status === "notConfigured") return <NotConfiguredState isDark={isDark} feature="payments" />;
  if (state.status === "error") return <DataState status="error" isDark={isDark} title={t('workplace.paymentsError')} description={state.error} />;

  return (
    <Panel>
      {state.status === "loading" ? (
        <Skeleton />
      ) : state.data.length === 0 ? (
        <DataState status="empty" isDark={isDark} title={t('workplace.noInvoices')} description={t('workplace.invoicesAppear')} />
      ) : (
        state.data.map((inv) => (
          <PaymentCard
            key={inv.id}
            invoice={inv}
            isDark={isDark}
            onPay={(id) => payments.payInvoice(id)}
          />
        ))
      )}
    </Panel>
  );
}
