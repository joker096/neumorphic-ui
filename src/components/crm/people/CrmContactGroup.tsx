import { ChevronDown, Building2, Users } from 'lucide-react';
import { CRM_FALLBACKS } from '../../../constants/crmConstants';
import type { CrmContact } from '../../../lib/crm/types';
import { CrmContactRow, type CrmTranslate } from './CrmContactRow';

interface CrmGroup {
  key: string;
  label: string;
  items: CrmContact[];
}

interface CrmDeptStats {
  openTasks: number;
  openDeals: number;
  lead: string | null;
}

interface CrmContactGroupProps {
  group: CrmGroup;
  collapsed: boolean;
  stats: CrmDeptStats | null;
  userId: string;
  selectMode: boolean;
  selectedIds: string[];
  highlightId: string | null;
  t: CrmTranslate;
  resolveManager: (id?: string | null) => string | null;
  onOpen: (contact: CrmContact) => void;
  onMessage?: (contact: CrmContact) => void;
  onToggleSelect: (id: string) => void;
  onToggleGroup: (key: string) => void;
}

/** Collapsible department/clients group with its contact rows. */
export function CrmContactGroup({
  group, collapsed, stats, userId, selectMode, selectedIds, highlightId, t,
  resolveManager, onOpen, onMessage, onToggleSelect, onToggleGroup,
}: CrmContactGroupProps) {
  return (
    <div className="mb-2">
      <button
        type="button"
        aria-expanded={!collapsed}
        onClick={() => onToggleGroup(group.key)}
        className="w-full flex items-center gap-2 px-2 py-1 mb-1 min-h-11 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ChevronDown size={14} className={`transition-transform ${collapsed ? '-rotate-90' : ''}`} />
        {group.key === 'clients' ? <Building2 size={14} /> : <Users size={14} />}
        <span className="truncate">{group.label} ({group.items.length})</span>
        {stats && (
          <span className="normal-case tracking-normal font-medium text-[var(--text-secondary)] flex items-center gap-2 truncate">
            {stats.lead && <span>{t('crm.lead', CRM_FALLBACKS.lead)}: {stats.lead}</span>}
            <span>{stats.openTasks} {t('crm.tabTasks', CRM_FALLBACKS.tabTasks)}</span>
            <span>{stats.openDeals} {t('crm.tabDeals', CRM_FALLBACKS.tabDeals)}</span>
          </span>
        )}
      </button>
      {!collapsed && <div className="flex flex-col gap-1.5">
        {group.items.map((c, i) => (
          <CrmContactRow
            key={c.userId}
            contact={c}
            index={i}
            userId={userId}
            selectMode={selectMode}
            isSelected={selectedIds.includes(c.userId)}
            highlighted={highlightId === c.userId}
            t={t}
            resolveManager={resolveManager}
            onOpen={onOpen}
            onMessage={onMessage}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>}
    </div>
  );
}
