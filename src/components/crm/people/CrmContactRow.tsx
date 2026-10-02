import { motion } from 'motion/react';
import { Check, Phone, Mail, Tag } from 'lucide-react';
import { CRM_FALLBACKS, crmAvatarAt, CONTACT_STATUSES } from '../../../constants/crmConstants';
import type { CrmContact, CrmContactStatus } from '../../../lib/crm/types';
import { RoleBadge } from '../RoleBadge';

export type CrmTranslate = (key: string, options?: any) => string;

const statusColor: Record<CrmContactStatus, string> = {
  lead: 'bg-amber-400/15 text-amber-500',
  client: 'bg-sky-400/15 text-sky-500',
  partner: 'bg-violet-400/15 text-violet-500',
  vendor: 'bg-orange-400/15 text-orange-500',
  internal: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
  vip: 'bg-rose-400/15 text-rose-500',
};

const statusLabel = (s: CrmContactStatus, t: CrmTranslate) =>
  t(CONTACT_STATUSES.find((x) => x.id === s)!.labelKey, (CRM_FALLBACKS as any)[s]);

interface CrmContactRowProps {
  contact: CrmContact;
  index: number;
  userId: string;
  selectMode: boolean;
  isSelected: boolean;
  highlighted: boolean;
  t: CrmTranslate;
  resolveManager: (id?: string | null) => string | null;
  onOpen: (contact: CrmContact) => void;
  onToggleSelect: (id: string) => void;
}

/** One selectable contact row: selection box, avatar, identity, role/status and details. */
export function CrmContactRow({
  contact: c, index, userId, selectMode, isSelected, highlighted, t,
  resolveManager, onOpen, onToggleSelect,
}: CrmContactRowProps) {
  return (
    <motion.button
      id={`crm-contact-${c.userId}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => (selectMode ? onToggleSelect(c.userId) : onOpen(c))}
      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left cursor-pointer transition-all hover:bg-[var(--list-item-hover-bg)] min-h-11 ${
        highlighted ? 'ring-2 ring-[var(--accent)]' : ''
      }`}
    >
      {selectMode && (
        <span
          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
            isSelected
              ? 'bg-[var(--accent)] border-[var(--accent)] text-[var(--ink-on-saturate)]'
              : 'border-[var(--border-color)]'
          }`}
        >
          {isSelected && <Check size={14} />}
        </span>
      )}
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${crmAvatarAt(index)} flex items-center justify-center text-[var(--text-primary)] font-bold text-sm shrink-0`}>
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
          {c.title && <span className="text-xs text-[var(--text-secondary)] truncate max-w-[180px]">{c.title}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-secondary)] flex-wrap">
          {c.assignedManagerId && c.assignedManagerId !== c.userId && (
            <span>👤 {resolveManager(c.assignedManagerId)}</span>
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
  );
}
