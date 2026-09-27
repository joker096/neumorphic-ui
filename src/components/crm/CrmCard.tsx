import React from 'react';
import { UserCircle2, Briefcase, CheckSquare, AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { CrmContact, Deal, CrmTask } from '../../lib/crm/types';
import { useI18n } from '../../lib/i18n';
import { formatCurrency } from '../../utils/currency';
import { isOpenDealStage } from '../../constants/crmConstants';

interface CrmCardProps {
  contact: CrmContact;
  deals?: Deal[];
  tasks?: CrmTask[];
  onOpen?: () => void;
  isDark?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  lead: 'bg-slate-500/15 text-slate-400',
  client: 'bg-emerald-500/15 text-emerald-400',
  partner: 'bg-sky-500/15 text-sky-400',
  vendor: 'bg-amber-500/15 text-amber-400',
  internal: 'bg-violet-500/15 text-violet-400',
  vip: 'bg-rose-500/15 text-rose-400',
};

export const CrmCard: React.FC<CrmCardProps> = ({ contact, deals = [], tasks = [], onOpen, isDark }) => {
  const { t, lang } = useI18n();
  const STATUS_LABEL: Record<string, string> = {
    lead: t('crm.statusLead'),
    client: t('crm.statusClient'),
    partner: t('crm.statusPartner'),
    vendor: t('crm.statusVendor'),
    internal: t('crm.statusInternal'),
    vip: t('crm.statusVip'),
  };
  const myDeals = deals.filter((d) => d.contactId === contact.userId);
  const openDeals = myDeals.filter((d) => isOpenDealStage(d.stage));
  const dealValue = openDeals.reduce((sum, d) => sum + d.amount, 0);
  // The pipeline is a sum over deals that may carry different currencies, and
  // no FX table exists — so only label it when every open deal agrees, instead
  // of the old hardcoded `$` that mislabelled every non-dollar pipeline.
  const dealCurrencies = new Set(
    openDeals.map((d) => (typeof d.currency === 'string' ? d.currency.trim().toUpperCase() : '')).filter(Boolean),
  );
  const pipelineCurrency = dealCurrencies.size === 1 ? [...dealCurrencies][0] : '';
  const myTasks = tasks.filter((t) => t.contactId === contact.userId);
  const openTasks = myTasks.filter((t) => !t.done);

  return (
    <div
      className={`rounded-xl border border-[var(--border-color)] overflow-hidden ${
        isDark ? 'bg-[var(--bg-tertiary)]' : 'bg-white shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <UserCircle2 size={16} className="text-[var(--accent)]" />
          <span className={`text-sm font-semibold ${isDark ? 'text-[var(--text-primary)]' : 'text-slate-900'}`}>
            {t('crm.title')}
          </span>
        </div>
        {onOpen && (
          <button
            onClick={onOpen}
            className="flex items-center gap-1 text-xs font-medium text-[var(--accent)] active:scale-95 transition-transform"
          >
            {t('common.open')} <ArrowUpRight size={14} />
          </button>
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[contact.status] ?? STATUS_COLOR.lead}`}>
            {STATUS_LABEL[contact.status] ?? contact.status}
          </span>
          {contact.tags.map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
              #{tag}
            </span>
          ))}
        </div>

        {contact.title && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Briefcase size={14} /> {contact.title}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          <Metric label={t('crm.tabDeals')} value={String(openDeals.length)} />
          <Metric label={t('crm.pipeline')} value={dealValue > 0 ? formatCurrency(dealValue, pipelineCurrency, lang, 0) : '—'} />
          <Metric label={t('crm.tabTasks')} value={String(openTasks.length)} highlight={openTasks.length > 0} />
        </div>

        {openTasks.length > 0 && (
          <ul className="space-y-1 pt-1">
            {openTasks.slice(0, 3).map((task) => (
              <li key={task.id} className="flex items-center gap-2 text-xs text-gray-400">
                <CheckSquare size={14} /> {task.title}
                {task.dueAt != null && task.dueAt < Date.now() && (
                  <span className="text-rose-400 flex items-center gap-0.5"><AlertTriangle size={12} /> {t('crm.overdue')}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="rounded-lg bg-white/5 px-2 py-1.5 text-center">
    <div className={`text-sm font-bold ${highlight ? 'text-amber-400' : 'text-[var(--text-primary)]'}`}>{value}</div>
    <div className="text-[11px] uppercase tracking-wide opacity-50">{label}</div>
  </div>
);
