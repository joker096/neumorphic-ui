import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Building2, Users, Phone, Mail, Tag, ChevronDown, ListChecks, Check, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, crmAvatarAt, CONTACT_STATUSES, isOpenDealStage } from '../../constants/crmConstants';
import type { CrmContact, CrmContactStatus } from '../../lib/crm/types';
import { RoleBadge } from './RoleBadge';
import { ContactCard } from './ContactCard';
import { CrmFilterBar } from './CrmFilterBar';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useCrmPermissions } from '../../lib/crm/permissions';

const statusColor: Record<CrmContactStatus, string> = {
  lead: 'bg-amber-400/15 text-amber-500',
  client: 'bg-sky-400/15 text-sky-500',
  partner: 'bg-violet-400/15 text-violet-500',
  vendor: 'bg-orange-400/15 text-orange-500',
  internal: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  vip: 'bg-rose-400/15 text-rose-500',
};

const statusLabel = (s: CrmContactStatus, t: (k: string, f?: string) => string) =>
  t(CONTACT_STATUSES.find((x) => x.id === s)!.labelKey, (CRM_FALLBACKS as any)[s]);

type Props = {
  onOpenRoles?: () => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  focusContactId?: string | null;
  onFocusHandled?: () => void;
};

export const CrmPeople: React.FC<Props> = ({
  onOpenRoles, onCall, onVideoCall, onMessage, focusContactId, onFocusHandled,
}) => {
  const { t } = useI18n();
  const contacts = useAppStore((s) => s.crmContacts);
  const departments = useAppStore((s) => s.crmDepartments);
  const tasks = useAppStore((s) => s.crmTasks);
  const deals = useAppStore((s) => s.crmDeals);
  const filters = useAppStore((s) => s.crmFilters);
  const collapsedGroups = useAppStore((s) => s.crmCollapsedGroups);
  const toggleCrmGroup = useAppStore((s) => s.toggleCrmGroup);
  const userId = useAppStore((s) => s.userProfile.id);
  const assignManager = useAppStore((s) => s.assignManager);
  const addContactTag = useAppStore((s) => s.addContactTag);
  const removeContact = useAppStore((s) => s.removeContact);
  const { can } = useCrmPermissions();

  const [selected, setSelected] = useState<CrmContact | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkManager, setBulkManager] = useState('');
  const [bulkTag, setBulkTag] = useState('');
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const lastFocus = useRef<string | null>(null);

  useEffect(() => {
    if (!focusContactId || lastFocus.current === focusContactId) return undefined;
    lastFocus.current = focusContactId;
    const target = contacts.find((c) => c.userId === focusContactId);
    const groupKey = target
      ? (target.status === 'internal' ? (target.departmentId ?? 'none') : 'clients')
      : null;
    if (groupKey && collapsedGroups.includes(groupKey)) toggleCrmGroup(groupKey);
    setHighlightId(focusContactId);
    const scrollT = window.setTimeout(() => {
      document.getElementById(`crm-contact-${focusContactId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
    const clearT = window.setTimeout(() => {
      setHighlightId(null);
      onFocusHandled?.();
    }, 2500);
    return () => {
      window.clearTimeout(scrollT);
      window.clearTimeout(clearT);
    };
  }, [focusContactId, contacts, collapsedGroups, toggleCrmGroup, onFocusHandled]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (q && !c.displayName.toLowerCase().includes(q) && !(c.email ?? '').toLowerCase().includes(q)) return false;
      if (filters.role !== 'all' && c.role !== filters.role) return false;
      if (filters.departmentId !== 'all' && (c.departmentId ?? 'none') !== filters.departmentId) return false;
      if (filters.status !== 'all' && c.status !== filters.status) return false;
      if (filters.tag !== 'all' && !c.tags.includes(filters.tag)) return false;
      if (filters.assignedToMe && c.assignedManagerId !== userId) return false;
      return true;
    });
  }, [contacts, filters, userId]);

  const internal = filtered.filter((c) => c.status === 'internal');
  const clients = filtered.filter((c) => c.status !== 'internal');

  const grouped = useMemo(() => {
    const groups: { key: string; label: string; items: CrmContact[] }[] = [];
    departments.forEach((d) => {
      const items = internal.filter((c) => c.departmentId === d.id);
      if (items.length) groups.push({ key: d.id, label: d.name, items });
    });
    const noDept = internal.filter((c) => !c.departmentId);
    if (noDept.length) groups.push({ key: 'none', label: t('crm.noDepartment', 'No department'), items: noDept });
    if (clients.length) groups.push({ key: 'clients', label: t('crm.clients', 'Clients & leads'), items: clients });
    return groups;
  }, [internal, clients, departments, t]);

  const managerName = (id?: string | null) =>
    id ? contacts.find((c) => c.userId === id)?.displayName : null;

  const managers = contacts.filter((c) => c.role === 'admin' || c.role === 'manager');

  const deptStats = (key: string) => {
    if (key === 'clients' || key === 'none') return null;
    const memberIds = new Set(
      contacts.filter((c) => c.status === 'internal' && c.departmentId === key).map((c) => c.userId),
    );
    const openTasks = tasks.filter((x) => !x.done && x.assigneeId && memberIds.has(x.assigneeId)).length;
    const openDeals = deals.filter(
      (d) => isOpenDealStage(d.stage) && d.ownerId && memberIds.has(d.ownerId),
    ).length;
    const leadId = departments.find((d) => d.id === key)?.leadId;
    const lead = leadId ? contacts.find((c) => c.userId === leadId)?.displayName ?? null : null;
    return { openTasks, openDeals, lead };
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const exitSelect = () => {
    setSelectMode(false);
    setSelectedIds([]);
    setBulkManager('');
    setBulkTag('');
  };

  const applyManager = () => {
    if (!bulkManager) return;
    selectedIds.forEach((id) => assignManager(id, bulkManager));
    toast.success(t('crm.managersAssigned', CRM_FALLBACKS.managersAssigned));
    exitSelect();
  };

  const applyTag = () => {
    const tag = bulkTag.trim();
    if (!tag) return;
    selectedIds.forEach((id) => addContactTag(id, tag));
    toast.success(t('crm.tagApplied', CRM_FALLBACKS.tagApplied));
    setBulkTag('');
  };

  const confirmBulkDelete = () => {
    selectedIds.forEach((id) => removeContact(id));
    toast.success(t('crm.bulkDeleted', CRM_FALLBACKS.bulkDeleted));
    setBulkDeleteOpen(false);
    exitSelect();
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-3 py-3">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
          <Users size={14} /> {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          {can('manageMembers') && (
            <button
              onClick={() => (selectMode ? exitSelect() : (setSelectMode(true), setSelectedIds([])))}
              aria-label={t('crm.bulkSelect', CRM_FALLBACKS.bulkSelect)}
              title={t('crm.bulkSelect', CRM_FALLBACKS.bulkSelect)}
              className={`flex items-center justify-center w-11 min-h-[var(--control-height-sm)] rounded-xl font-bold text-[13px] cursor-pointer transition-all ${
                selectMode
                  ? 'bg-[var(--accent)] text-[var(--ink-on-saturate)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <ListChecks size={16} />
            </button>
          )}
          {can('manageMembers') && (
            <button
              onClick={() => setShowAdd(true)}
              aria-label={t('crm.addContact', CRM_FALLBACKS.addContact)}
              title={t('crm.addContact', CRM_FALLBACKS.addContact)}
              className="w-9 h-9 min-w-11 min-h-11 rounded-xl font-bold text-[13px] cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--ink-on-saturate)] hover:brightness-110 flex items-center justify-center"
            >
              <Plus size={16} aria-hidden="true" />
              <span className="sr-only">{t('crm.addContact', CRM_FALLBACKS.addContact)}</span>
            </button>
          )}
        </div>
      </div>

      <CrmFilterBar onOpenRoles={onOpenRoles} />

      {grouped.length === 0 && (
        <div className="py-10 text-center text-sm text-[var(--text-secondary)]">{t('crm.noContacts', CRM_FALLBACKS.noContacts)}</div>
      )}

      {grouped.map((group) => {
        const isCollapsed = collapsedGroups.includes(group.key);
        const stats = deptStats(group.key);
        return (
        <div key={group.key} className="mb-4">
          <button
            type="button"
            aria-expanded={!isCollapsed}
            onClick={() => toggleCrmGroup(group.key)}
            className="w-full flex items-center gap-2 px-2 py-1.5 mb-1 min-h-11 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
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
          {!isCollapsed && <div className="flex flex-col gap-2">
            {group.items.map((c, i) => (
              <motion.button
                key={c.userId}
                id={`crm-contact-${c.userId}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => (selectMode ? toggleSelect(c.userId) : setSelected(c))}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left cursor-pointer transition-all hover:bg-[var(--list-item-hover-bg)] min-h-[60px] ${
                  highlightId === c.userId ? 'ring-2 ring-[var(--accent)]' : ''
                }`}
              >
                {selectMode && (
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      selectedIds.includes(c.userId)
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--ink-on-saturate)]'
                        : 'border-[var(--border-color)]'
                    }`}
                  >
                    {selectedIds.includes(c.userId) && <Check size={14} />}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${crmAvatarAt(i)} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shrink-0`}>
                  {c.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-[var(--text-primary)] break-words leading-snug">{c.displayName}</span>
                    {c.userId === userId && (
                      <span className="text-xs font-bold uppercase px-1.5 py-0.5 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">{t('crm.you', 'You')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <RoleBadge contact={c} />
                    <span className={`text-xs font-bold uppercase px-1.5 py-0.5 rounded-full ${statusColor[c.status]}`}>
                      {statusLabel(c.status, t)}
                    </span>
                  </div>
                  {c.title && <div className="text-xs text-[var(--text-secondary)] truncate">{c.title}</div>}
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-secondary)] flex-wrap">
                    {c.assignedManagerId && c.assignedManagerId !== c.userId && (
                      <span>👤 {managerName(c.assignedManagerId)}</span>
                    )}
                    {c.phone && <span className="inline-flex items-center gap-1"><Phone size={12} />{c.phone}</span>}
                    {c.email && <span className="inline-flex items-center gap-1 truncate max-w-[160px]"><Mail size={12} />{c.email}</span>}
                  </div>
                  {c.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {c.tags.filter((x) => x !== 'me').map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                          <Tag size={12} />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>}
        </div>
        );
      })}

      {selectMode && (
        <div className="sticky bottom-2 mt-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            {t('crm.selectedCount', { count: selectedIds.length })}
          </span>
          {can('assignManagers') && (
            <select
              value={bulkManager}
              onChange={(e) => setBulkManager(e.target.value)}
              className="min-h-11 px-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-xs"
            >
              <option value="">{t('crm.bulkAssign', CRM_FALLBACKS.bulkAssign)}</option>
              {managers.map((m) => (
                <option key={m.userId} value={m.userId}>{m.displayName}</option>
              ))}
            </select>
          )}
          {can('assignManagers') && bulkManager && (
            <button
              type="button"
              onClick={applyManager}
              aria-label={t('crm.apply', CRM_FALLBACKS.apply)}
              title={t('crm.apply', CRM_FALLBACKS.apply)}
              className="min-h-11 min-w-11 w-9 h-9 p-0 rounded-xl bg-[var(--accent)] text-[var(--ink-on-saturate)] inline-flex items-center justify-center active:scale-95 transition-transform"
            >
              <Check size={18} aria-hidden="true" />
              <span className="sr-only">{t('crm.apply', CRM_FALLBACKS.apply)}</span>
            </button>
          )}
          {can('manageMembers') && (
            <div className="flex items-center gap-1.5">
              <input
                value={bulkTag}
                onChange={(e) => setBulkTag(e.target.value)}
                placeholder={t('crm.bulkTagPlaceholder', CRM_FALLBACKS.bulkTagPlaceholder)}
                className="min-h-11 px-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--accent)] outline-none text-xs text-[var(--text-primary)]"
              />
              <button
                type="button"
                onClick={applyTag}
                aria-label={t('crm.apply', CRM_FALLBACKS.apply)}
                title={t('crm.apply', CRM_FALLBACKS.apply)}
                className="min-h-11 min-w-11 w-9 h-9 p-0 rounded-xl bg-[var(--accent)] text-[var(--ink-on-saturate)] inline-flex items-center justify-center active:scale-95 transition-transform"
              >
                <Check size={18} aria-hidden="true" />
                <span className="sr-only">{t('crm.apply', CRM_FALLBACKS.apply)}</span>
              </button>
            </div>
          )}
          {can('manageMembers') && selectedIds.length > 0 && (
            <button
              onClick={() => setBulkDeleteOpen(true)}
              aria-label={t('crm.bulkDelete', CRM_FALLBACKS.bulkDelete)}
              title={t('crm.bulkDelete', CRM_FALLBACKS.bulkDelete)}
              className="min-h-11 px-3 rounded-xl bg-rose-500/15 text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>{t('crm.bulkDelete', CRM_FALLBACKS.bulkDelete)}</span>
            </button>
          )}
        </div>
      )}

      {selected && (
        <ContactCard
          contact={selected}
          onClose={() => setSelected(null)}
          onCall={onCall}
          onVideoCall={onVideoCall}
          onMessage={onMessage}
        />
      )}
      {showAdd && (
        <ContactCard onClose={() => setShowAdd(false)} />
      )}
      <ConfirmDialog
        isOpen={bulkDeleteOpen}
        title={t('crm.bulkDeleteConfirm', { count: selectedIds.length })}
        variant="danger"
        confirmLabel={t('crm.bulkDelete', CRM_FALLBACKS.bulkDelete)}
        cancelLabel={t('crm.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
};
