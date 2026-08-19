import React, { useMemo, useState } from 'react';
import { Plus, Building2, Users, Phone, Mail, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, crmAvatarAt, CONTACT_STATUSES } from '../../constants/crmConstants';
import type { CrmContact, CrmContactStatus } from '../../lib/crm/types';
import { RoleBadge } from './RoleBadge';
import { ContactCard } from './ContactCard';
import { CrmFilterBar } from './CrmFilterBar';
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

export const CrmPeople: React.FC<{ onOpenRoles?: () => void }> = ({ onOpenRoles }) => {
  const { t } = useI18n();
  const contacts = useAppStore((s) => s.crmContacts);
  const departments = useAppStore((s) => s.crmDepartments);
  const filters = useAppStore((s) => s.crmFilters);
  const userId = useAppStore((s) => s.userProfile.id);
  const addContact = useAppStore((s) => s.addContact);
  const { can } = useCrmPermissions();

  const [selected, setSelected] = useState<CrmContact | null>(null);
  const [showAdd, setShowAdd] = useState(false);

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

  return (
    <div className="flex-1 flex flex-col overflow-y-auto px-3 py-3">
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">
          <Users size={14} /> {filtered.length}
        </div>
        {can('manageMembers') && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110"
          >
            <Plus size={15} /> {t('crm.addContact', CRM_FALLBACKS.addContact)}
          </button>
        )}
      </div>

      <CrmFilterBar onOpenRoles={onOpenRoles} />

      {grouped.length === 0 && (
        <div className="py-10 text-center text-sm text-[var(--text-secondary)]">{t('crm.noContacts', CRM_FALLBACKS.noContacts)}</div>
      )}

      {grouped.map((group) => (
        <div key={group.key} className="mb-4">
          <div className="flex items-center gap-2 px-2 mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            {group.key === 'clients' ? <Building2 size={13} /> : <Users size={13} />}
            {group.label} ({group.items.length})
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((c, i) => (
              <motion.button
                key={c.userId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelected(c)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left cursor-pointer transition-all hover:bg-[var(--list-item-hover-bg)] min-h-[60px]"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${crmAvatarAt(i)} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shrink-0`}>
                  {c.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-[var(--text-primary)] break-words leading-snug">{c.displayName}</span>
                    {c.userId === userId && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">{t('crm.you', 'You')}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <RoleBadge contact={c} />
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusColor[c.status]}`}>
                      {statusLabel(c.status, t)}
                    </span>
                  </div>
                  {c.title && <div className="text-[11px] text-[var(--text-secondary)] truncate">{c.title}</div>}
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-[var(--text-secondary)] flex-wrap">
                    {c.assignedManagerId && c.assignedManagerId !== c.userId && (
                      <span>👤 {managerName(c.assignedManagerId)}</span>
                    )}
                    {c.phone && <span className="inline-flex items-center gap-1"><Phone size={10} />{c.phone}</span>}
                    {c.email && <span className="inline-flex items-center gap-1 truncate max-w-[160px]"><Mail size={10} />{c.email}</span>}
                  </div>
                  {c.tags.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {c.tags.filter((x) => x !== 'me').map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                          <Tag size={9} />{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      ))}

      {selected && (
        <ContactCard contact={selected} onClose={() => setSelected(null)} />
      )}
      {showAdd && (
        <ContactCard onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
};
