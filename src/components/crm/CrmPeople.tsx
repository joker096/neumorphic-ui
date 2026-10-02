import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Users, ListChecks, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, isOpenDealStage } from '../../constants/crmConstants';
import type { CrmContact } from '../../lib/crm/types';
import { ContactCard } from './ContactCard';
import { CrmFilterBar } from './CrmFilterBar';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useCrmPermissions } from '../../lib/crm/permissions';
import { CrmContactGroup } from './people/CrmContactGroup';
import { CrmBulkBar } from './people/CrmBulkBar';

type Props = {
  onOpenRoles?: () => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
  focusContactId?: string | null;
  onFocusHandled?: () => void;
  filtersOpen?: boolean;
  onToggleFilters?: () => void;
};

export const CrmPeople: React.FC<Props> = ({
  onOpenRoles, onCall, onVideoCall, onMessage, focusContactId, onFocusHandled,
  filtersOpen, onToggleFilters,
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
      if (q && !c.displayName.toLowerCase().includes(q) && !(c.email ?? '').toLowerCase().includes(q) && !(c.title ?? '').toLowerCase().includes(q)) return false;
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
    <div className="flex-1 flex flex-col overflow-y-auto px-2 py-2">
      <div className="flex items-center justify-between px-1 mb-1.5">
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

      <CrmFilterBar onOpenRoles={onOpenRoles} open={filtersOpen} onToggle={onToggleFilters} />

      {grouped.length === 0 && (
        <div className="py-10 text-center text-sm text-[var(--text-secondary)]">{t('crm.noContacts', CRM_FALLBACKS.noContacts)}</div>
      )}

      {grouped.map((group) => (
        <CrmContactGroup
          key={group.key}
          group={group}
          collapsed={collapsedGroups.includes(group.key)}
          stats={deptStats(group.key)}
          userId={userId}
          selectMode={selectMode}
          selectedIds={selectedIds}
          highlightId={highlightId}
          t={t}
          resolveManager={managerName}
          onOpen={setSelected}
          onToggleSelect={toggleSelect}
          onToggleGroup={toggleCrmGroup}
        />
      ))}

      {selectMode && (
        <CrmBulkBar
          selectedCount={selectedIds.length}
          bulkManager={bulkManager}
          bulkTag={bulkTag}
          managers={managers}
          canAssignManagers={can('assignManagers')}
          canManageMembers={can('manageMembers')}
          t={t}
          onSetBulkManager={setBulkManager}
          onSetBulkTag={setBulkTag}
          onApplyManager={applyManager}
          onApplyTag={applyTag}
          onOpenDelete={() => setBulkDeleteOpen(true)}
        />
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
