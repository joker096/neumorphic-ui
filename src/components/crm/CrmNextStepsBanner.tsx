import React from 'react';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';

type Props = {
  onOpenTasks: () => void;
};

/**
 * Compact reminder surface: open CRM tasks that are overdue or due today.
 * Renders nothing when there is nothing actionable.
 */
export const CrmNextStepsBanner: React.FC<Props> = ({ onOpenTasks }) => {
  const { t } = useI18n();
  const tasks = useAppStore((s) => s.crmTasks) ?? [];

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const limit = endOfToday.getTime();
  const now = Date.now();

  let overdue = 0;
  let dueToday = 0;
  for (const task of tasks) {
    if (task.done || task.dueAt == null || task.dueAt > limit) continue;
    if (task.dueAt < now) overdue += 1;
    else dueToday += 1;
  }
  if (overdue + dueToday === 0) return null;

  return (
    <button
      type="button"
      onClick={onOpenTasks}
      className="flex items-center gap-2 mx-2 my-1.5 px-3 min-h-11 rounded-xl border border-[var(--border-color)] bg-[var(--accent-soft)] text-left transition-all hover:brightness-105"
    >
      <AlertTriangle
        size={16}
        aria-hidden="true"
        className={overdue > 0 ? 'shrink-0 text-[var(--color-danger)]' : 'shrink-0 text-amber-500'}
      />
      <span className="flex-1 min-w-0 text-xs font-semibold truncate text-[var(--text-primary)]">
        {t('crm.nextSteps', 'Next steps')}
      </span>
      {overdue > 0 && (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--color-danger)]">
          {t('crm.overdue', 'Overdue')}
          <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[var(--color-danger)] text-white text-[11px]">
            {overdue}
          </span>
        </span>
      )}
      {dueToday > 0 && (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
          <Clock size={12} aria-hidden="true" />
          {t('crm.dueToday', 'Due today')}
          <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-amber-500/20 text-[11px]">
            {dueToday}
          </span>
        </span>
      )}
      <ChevronRight size={16} className="shrink-0 text-[var(--text-secondary)]" aria-hidden="true" />
    </button>
  );
};
