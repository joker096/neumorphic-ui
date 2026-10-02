import { Check, Trash2 } from 'lucide-react';
import { CRM_FALLBACKS } from '../../../constants/crmConstants';
import type { CrmContact } from '../../../lib/crm/types';
import type { CrmTranslate } from './CrmContactRow';

interface CrmBulkBarProps {
  selectedCount: number;
  bulkManager: string;
  bulkTag: string;
  managers: CrmContact[];
  canAssignManagers: boolean;
  canManageMembers: boolean;
  t: CrmTranslate;
  onSetBulkManager: (id: string) => void;
  onSetBulkTag: (tag: string) => void;
  onApplyManager: () => void;
  onApplyTag: () => void;
  onOpenDelete: () => void;
}

/** Sticky bulk-action bar shown while selection mode is active. */
export function CrmBulkBar({
  selectedCount, bulkManager, bulkTag, managers, canAssignManagers, canManageMembers,
  t, onSetBulkManager, onSetBulkTag, onApplyManager, onApplyTag, onOpenDelete,
}: CrmBulkBarProps) {
  return (
    <div className="sticky bottom-2 mt-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2.5 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-[var(--text-primary)]">
        {t('crm.selectedCount', { count: selectedCount })}
      </span>
      {canAssignManagers && (
        <select
          aria-label={t('crm.bulkAssign', CRM_FALLBACKS.bulkAssign)}
          value={bulkManager}
          onChange={(e) => onSetBulkManager(e.target.value)}
          className="min-h-11 px-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-xs"
        >
          <option value="">{t('crm.bulkAssign', CRM_FALLBACKS.bulkAssign)}</option>
          {managers.map((m) => (
            <option key={m.userId} value={m.userId}>{m.displayName}</option>
          ))}
        </select>
      )}
      {canAssignManagers && bulkManager && (
        <button
          type="button"
          onClick={onApplyManager}
          aria-label={t('crm.apply', CRM_FALLBACKS.apply)}
          title={t('crm.apply', CRM_FALLBACKS.apply)}
          className="min-h-11 min-w-11 w-9 h-9 p-0 rounded-xl bg-[var(--accent)] text-[var(--ink-on-saturate)] inline-flex items-center justify-center active:scale-95 transition-transform"
        >
          <Check size={18} aria-hidden="true" />
          <span className="sr-only">{t('crm.apply', CRM_FALLBACKS.apply)}</span>
        </button>
      )}
      {canManageMembers && (
        <div className="flex items-center gap-1.5">
          <input
            aria-label={t('crm.bulkTagPlaceholder', CRM_FALLBACKS.bulkTagPlaceholder)}
            value={bulkTag}
            onChange={(e) => onSetBulkTag(e.target.value)}
            placeholder={t('crm.bulkTagPlaceholder', CRM_FALLBACKS.bulkTagPlaceholder)}
            className="min-h-11 px-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent)] outline-none text-xs text-[var(--text-primary)]"
          />
          <button
            type="button"
            onClick={onApplyTag}
            aria-label={t('crm.apply', CRM_FALLBACKS.apply)}
            title={t('crm.apply', CRM_FALLBACKS.apply)}
            className="min-h-11 min-w-11 w-9 h-9 p-0 rounded-xl bg-[var(--accent)] text-[var(--ink-on-saturate)] inline-flex items-center justify-center active:scale-95 transition-transform"
          >
            <Check size={18} aria-hidden="true" />
            <span className="sr-only">{t('crm.apply', CRM_FALLBACKS.apply)}</span>
          </button>
        </div>
      )}
      {canManageMembers && selectedCount > 0 && (
        <button
          onClick={onOpenDelete}
          aria-label={t('crm.bulkDelete', CRM_FALLBACKS.bulkDelete)}
          title={t('crm.bulkDelete', CRM_FALLBACKS.bulkDelete)}
          className="min-h-11 px-3 rounded-xl bg-rose-500/15 text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5"
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>{t('crm.bulkDelete', CRM_FALLBACKS.bulkDelete)}</span>
        </button>
      )}
    </div>
  );
}
