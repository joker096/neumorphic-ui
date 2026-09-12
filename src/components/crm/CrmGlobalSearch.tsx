import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, User, TrendingUp, CheckSquare, X } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../store';
import { CRM_FALLBACKS } from '../../constants/crmConstants';
import type { CrmContact, Deal, CrmTask, CrmFocusKind } from '../../lib/crm/types';

type Hit = { kind: CrmFocusKind; id: string; title: string; subtitle: string };

type Props = {
  contacts: CrmContact[];
  deals: Deal[];
  tasks: CrmTask[];
  onPick: (kind: CrmFocusKind, id: string) => void;
};

const GROUP_ICONS: Record<CrmFocusKind, React.ReactNode> = {
  people: <User size={14} />,
  deals: <TrendingUp size={14} />,
  tasks: <CheckSquare size={14} />,
};

export const CrmGlobalSearch: React.FC<Props> = ({ contacts, deals, tasks, onPick }) => {
  const { t } = useI18n();
  const search = useAppStore((s) => s.crmFilters.search);
  const setFilter = useAppStore((s) => s.setCrmFilter);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const q = search.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!q) return null;
    const contactName = (id?: string | null) => (id ? contacts.find((c) => c.userId === id)?.displayName ?? '' : '');
    const people: Hit[] = contacts
      .filter((c) =>
        c.displayName.toLowerCase().includes(q)
        || (c.email || '').toLowerCase().includes(q)
        || (c.title || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((c) => ({ kind: 'people' as CrmFocusKind, id: c.userId, title: c.displayName, subtitle: c.title || c.email || '' }));
    const dealHits: Hit[] = deals
      .filter((d) => d.title.toLowerCase().includes(q) || contactName(d.contactId).toLowerCase().includes(q))
      .slice(0, 5)
      .map((d) => ({ kind: 'deals' as CrmFocusKind, id: d.id, title: d.title, subtitle: contactName(d.contactId) || d.stage }));
    const taskHits: Hit[] = tasks
      .filter((x) => {
        const taskName = contactName(x.assigneeId) || contactName(x.contactId);
        return x.title.toLowerCase().includes(q) || taskName.toLowerCase().includes(q);
      })
      .slice(0, 5)
      .map((x) => ({ kind: 'tasks' as CrmFocusKind, id: x.id, title: x.title, subtitle: contactName(x.assigneeId) || contactName(x.contactId) || x.priority }));
    return { people, deals: dealHits, tasks: taskHits };
  }, [q, contacts, deals, tasks]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const pick = (hit: Hit) => {
    onPick(hit.kind, hit.id);
    setOpen(false);
  };

  const hasAny = groups ? groups.people.length + groups.deals.length + groups.tasks.length > 0 : false;

  const renderGroup = (kind: CrmFocusKind, items: Hit[], label: string) => {
    if (items.length === 0) return null;
    return (
      <div>
        <div className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
          {GROUP_ICONS[kind]}
          {label}
        </div>
        {items.map((hit) => (
          <button
            key={`${kind}-${hit.id}`}
            onClick={() => pick(hit)}
            className="w-full text-left px-2.5 py-2 hover:bg-[var(--list-item-hover-bg)] transition-colors"
          >
            <div className="text-xs font-semibold text-[var(--text-primary)]">{hit.title}</div>
            {hit.subtitle && <div className="text-[11px] text-[var(--text-secondary)] truncate">{hit.subtitle}</div>}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div ref={boxRef} className="relative flex-1 min-w-0">
      <div className="flex items-center gap-2 px-3 min-h-11 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus-within:border-[var(--accent)]">
        <Search size={16} className="text-[var(--text-secondary)] shrink-0" />
        <input
          value={search}
          onChange={(e) => { setFilter('search', e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={t('crm.searchPlaceholder', CRM_FALLBACKS.searchPlaceholder)}
          aria-label={t('crm.searchPlaceholder', CRM_FALLBACKS.searchPlaceholder)}
          className="flex-1 min-h-11 bg-transparent outline-none text-sm text-[var(--text-primary)]"
        />
        {search.trim() ? (
          <button
            type="button"
            onClick={() => setFilter('search', '')}
            aria-label={t('crm.clearSearch', CRM_FALLBACKS.clearSearch)}
            title={t('crm.clearSearch', CRM_FALLBACKS.clearSearch)}
            className="min-h-11 min-w-11 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>
      {open && q && groups && (
        <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-lg z-[var(--z-dropdown)] overflow-hidden">
          {!hasAny && (
            <div className="px-3 py-3 text-xs text-[var(--text-secondary)]">{t('crm.noResults', CRM_FALLBACKS.noResults)}</div>
          )}
          {hasAny && (
            <div className="max-h-72 overflow-y-auto py-1">
              {renderGroup('people', groups.people, t('crm.tabPeople', CRM_FALLBACKS.tabPeople))}
              {renderGroup('deals', groups.deals, t('crm.tabDeals', CRM_FALLBACKS.tabDeals))}
              {renderGroup('tasks', groups.tasks, t('crm.tabTasks', CRM_FALLBACKS.tabTasks))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};