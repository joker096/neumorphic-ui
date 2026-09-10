import React, { useState } from 'react';
import { SlidersHorizontal, Settings2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, SYSTEM_ROLES, CONTACT_STATUSES } from '../../constants/crmConstants';
import type { CrmContactStatus, SystemRole } from '../../lib/crm/types';

const selectCls =
  'min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-xs';

export const CrmFilterBar: React.FC<{ onOpenRoles?: () => void }> = ({ onOpenRoles }) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const filters = useAppStore((s) => s.crmFilters);
  const setFilter = useAppStore((s) => s.setCrmFilter);
  const resetFilters = useAppStore((s) => s.resetCrmFilters);
  const departments = useAppStore((s) => s.crmDepartments);
  const contacts = useAppStore((s) => s.crmContacts);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags))).filter(Boolean);
  const activeCount =
    (filters.role !== 'all' ? 1 : 0) +
    (filters.departmentId !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.tag !== 'all' ? 1 : 0) +
    (filters.assignedToMe ? 1 : 0);

  const assignedCls = `min-h-11 px-3 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
    filters.assignedToMe
      ? 'bg-[var(--accent)] text-white'
      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
  }`;

  const renderSelects = (fullWidth: boolean) => {
    const cls = fullWidth ? `${selectCls} w-full` : selectCls;
    return (
      <>
        <select value={filters.role} onChange={(e) => setFilter('role', e.target.value as SystemRole | 'all')} className={cls}>
          <option value="all">{t('crm.role', CRM_FALLBACKS.role)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {SYSTEM_ROLES.map((r) => (
            <option key={r.id} value={r.id}>{t(r.labelKey, (CRM_FALLBACKS as any)[r.labelKey.replace('crm.', '')])}</option>
          ))}
        </select>
        <select value={filters.departmentId} onChange={(e) => setFilter('departmentId', e.target.value)} className={cls}>
          <option value="all">{t('crm.department', CRM_FALLBACKS.department)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value as CrmContactStatus | 'all')} className={cls}>
          <option value="all">{t('crm.status', CRM_FALLBACKS.status)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{t(s.labelKey, (CRM_FALLBACKS as any)[s.labelKey.replace('crm.', '')])}</option>
          ))}
        </select>
        <select value={filters.tag} onChange={(e) => setFilter('tag', e.target.value)} className={cls}>
          <option value="all">{t('crm.tag', CRM_FALLBACKS.tag)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </>
    );
  };

  return (
    <div className="flex flex-col gap-2 px-2 mb-3">
      <div className="hidden md:flex flex-wrap items-center gap-2">
        {renderSelects(false)}
        <button
          type="button"
          onClick={() => setFilter('assignedToMe', !filters.assignedToMe)}
          className={assignedCls}
        >
          {t('crm.assignedToMe', CRM_FALLBACKS.assignedToMe)}
        </button>
        {onOpenRoles && (
          <button
            type="button"
            onClick={() => onOpenRoles()}
            title={t('crm.manageCategories', CRM_FALLBACKS.manageCategories)}
            aria-label={t('crm.manageCategories', CRM_FALLBACKS.manageCategories)}
            className="min-h-11 w-11 shrink-0 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer self-center"
          >
            <Settings2 size={14} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('crm.filters', CRM_FALLBACKS.filters)}
        className="md:hidden flex items-center gap-2 min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] cursor-pointer"
      >
        <SlidersHorizontal size={16} className="text-[var(--text-secondary)]" />
        <span className="text-xs font-bold">{t('crm.filters', CRM_FALLBACKS.filters)}</span>
        {activeCount > 0 && (
          <span data-testid="crm-filter-badge" className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-white">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t('crm.filters', CRM_FALLBACKS.filters)}
          className="md:hidden fixed bottom-0 left-0 right-0 z-[140] bg-[var(--bg-secondary)] border-t border-[var(--border-color)] rounded-t-2xl p-3 flex flex-col gap-3"
        >
          <div className="flex flex-col gap-2">
            {renderSelects(true)}
          </div>
          <button
            type="button"
            onClick={() => setFilter('assignedToMe', !filters.assignedToMe)}
            className={`${assignedCls} w-full`}
          >
            {t('crm.assignedToMe', CRM_FALLBACKS.assignedToMe)}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { resetFilters(); setOpen(false); }}
              className="flex-1 min-h-11 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] text-xs font-bold cursor-pointer"
            >
              {t('crm.resetFilters', CRM_FALLBACKS.resetFilters)}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 min-h-11 rounded-xl bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] text-xs font-bold cursor-pointer"
            >
              {t('crm.done', CRM_FALLBACKS.done)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};