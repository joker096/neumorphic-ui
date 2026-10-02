import { useState } from "react";
import {
  CheckSquare,
  Workflow,
  BarChart3,
  ShieldAlert,
  BookOpen,
  CreditCard,
} from "lucide-react";
import { useI18n } from "../../../lib/i18n";
import { formatCurrency } from "../../../utils/currency";
import { useServices, useServiceData, NotConfiguredState } from "../../../services";
import { DataState } from "../../ui/DataState";
import { Skeleton } from "../../ui/Skeleton";
import { Panel } from "./shared";
import { TasksTab, AutomationTab, AnalyticsTab, ModerationTab, KbTab } from "./tabs";

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
              className={`flex items-center gap-1.5 min-h-11 px-3 rounded-lg text-sm font-medium whitespace-nowrap ${
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

export interface PaymentCardProps {
  invoice: { id: string; title: string; amount: number; currency: string; description?: string; status: string };
  isDark?: boolean;
  onPay?: (id: string) => void;
}

export function PaymentCard({ invoice, isDark, onPay }: PaymentCardProps) {
  const { t, lang } = useI18n();
  return (
    <div className={`p-4 rounded-2xl border border-[var(--border-color)] ${isDark ? "bg-[var(--bg-tertiary)]" : "bg-white"}`}>
      <div className="flex items-center gap-2 mb-1">
        <CreditCard size={18} className="text-[var(--accent)]" />
        <span className="font-semibold">{invoice.title}</span>
      </div>
      {invoice.description && <p className="text-xs opacity-70 mb-2">{invoice.description}</p>}
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold">
          {formatCurrency(Number(invoice.amount), invoice.currency, lang, 2)}
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
