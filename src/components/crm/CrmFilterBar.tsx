import React from 'react';
import { Search, SlidersHorizontal, Settings2 } from 'lucide-react';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, SYSTEM_ROLES, CONTACT_STATUSES } from '../../constants/crmConstants';
import type { CrmContactStatus, SystemRole } from '../../lib/crm/types';

const selectCls =
  'min-h-[40px] px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-sm';

export const CrmFilterBar: React.FC<{ onOpenRoles?: () => void }> = ({ onOpenRoles }) => {
  const { t } = useI18n();
  const filters = useAppStore((s) => s.crmFilters);
  const setFilter = useAppStore((s) => s.setCrmFilter);
  const departments = useAppStore((s) => s.crmDepartments);
  const contacts = useAppStore((s) => s.crmContacts);

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags))).filter(Boolean);

  return (
    <div className="flex flex-col gap-2 px-2 mb-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 min-h-[40px] rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <Search size={15} className="text-[var(--text-secondary)] shrink-0" />
          <input
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder={t('crm.search', CRM_FALLBACKS.search)}
            className="flex-1 bg-transparent outline-none text-sm text-[var(--text-primary)]"
          />
        </div>
        <button
          onClick={() => setFilter('assignedToMe', !filters.assignedToMe)}
          className={`min-h-[40px] px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filters.assignedToMe
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
          }`}
        >
          {t('crm.assignedToMe', CRM_FALLBACKS.assignedToMe)}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <select value={filters.role} onChange={(e) => setFilter('role', e.target.value as SystemRole | 'all')} className={selectCls}>
          <option value="all">{t('crm.role', CRM_FALLBACKS.role)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {SYSTEM_ROLES.map((r) => (
            <option key={r.id} value={r.id}>{t(r.labelKey, (CRM_FALLBACKS as any)[r.labelKey.replace('crm.', '')])}</option>
          ))}
        </select>
        <select value={filters.departmentId} onChange={(e) => setFilter('departmentId', e.target.value)} className={selectCls}>
          <option value="all">{t('crm.department', CRM_FALLBACKS.department)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value as CrmContactStatus | 'all')} className={selectCls}>
          <option value="all">{t('crm.status', CRM_FALLBACKS.status)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {CONTACT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{t(s.labelKey, (CRM_FALLBACKS as any)[s.labelKey.replace('crm.', '')])}</option>
          ))}
        </select>
        <select value={filters.tag} onChange={(e) => setFilter('tag', e.target.value)} className={selectCls}>
          <option value="all">{t('crm.tag', CRM_FALLBACKS.tag)}: {t('crm.all', CRM_FALLBACKS.all)}</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
        {onOpenRoles && (
          <button
            type="button"
            onClick={() => onOpenRoles()}
            title={t('crm.manageCategories', CRM_FALLBACKS.manageCategories)}
            aria-label={t('crm.manageCategories', CRM_FALLBACKS.manageCategories)}
            className="min-h-[40px] w-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer self-center"
          >
            <Settings2 size={14} />
          </button>
        )}
        <SlidersHorizontal size={16} className="self-center text-[var(--text-secondary)]" />
      </div>
    </div>
  );
};
