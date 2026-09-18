import { Users, Plus, Loader2, AlertCircle, Mail, Phone, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { CompanyContact, CompanyDepartment } from '../../types/constants';

type ContactListProps = {
  isDark?: boolean;
  contacts: CompanyContact[];
  departments: CompanyDepartment[];
  canManage?: boolean;
  onAdd?: () => void;
  onContactClick?: (contact: CompanyContact) => void;
  contactsLabel: string;
  addLabel: string;
  t: (key: string, args?: Record<string, string | number> | string) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export const ContactList = ({
  isDark = false,
  contacts,
  departments,
  canManage = false,
  onAdd,
  onContactClick,
  contactsLabel,
  addLabel,
  t,
  loading = false,
  error = null,
  onRetry,
}: ContactListProps) => {
  const deptName = (id?: string | null) =>
    id ? departments.find((d) => d.id === id)?.name : undefined;

  return (
    <div className="w-full mb-4">
      <div className="flex items-center justify-between px-2 mb-3">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-[var(--accent)]">
          <Users size={14} />
          <span className="truncate">{contactsLabel} ({contacts.length})</span>
        </div>
        {canManage && onAdd && (
          <button
            onClick={onAdd}
            aria-label={addLabel}
            title={addLabel}
            className="w-9 h-9 min-w-11 min-h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110"
          >
            <Plus size={16} />
            <span className="sr-only">{addLabel}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[var(--text-secondary)]">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-xs">{t('company.loading', 'Loading...')}</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <AlertCircle size={20} className="text-[var(--color-warning)]" />
          <span className="text-xs text-[var(--text-secondary)]">{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              aria-label={t('company.retry', 'Retry')}
              title={t('company.retry', 'Retry')}
              className="w-9 h-9 min-w-11 min-h-11 rounded-xl flex items-center justify-center text-xs font-bold cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110"
            >
              <RefreshCw size={16} />
              <span className="sr-only">{t('company.retry', 'Retry')}</span>
            </button>
          )}
        </div>
      ) : contacts.length === 0 ? (
        <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
          {t('company.contactsEmpty', 'No contacts yet')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {contacts.map((contact, i) => {
              const dept = deptName(contact.departmentId);
              return (
                <motion.button
                  key={contact.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  onClick={() => onContactClick?.(contact)}
                  className="w-full text-left p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all bg-[var(--bg-tertiary)] hover:brightness-110"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-400 to-cyan-500 text-white font-bold">
                    {String(contact.name || '').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-[var(--text-primary)] truncate">{contact.name}</div>
                    {contact.title ? (
                      <div className="text-xs text-[var(--text-secondary)] truncate">{contact.title}</div>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-xs text-[var(--text-secondary)]">
                      {contact.phone && (
                        <span className="inline-flex items-center gap-1"><Phone size={12} />{contact.phone}</span>
                      )}
                      {contact.email && (
                        <span className="inline-flex items-center gap-1 truncate"><Mail size={12} />{contact.email}</span>
                      )}
                    </div>
                    {dept && (
                      <span className="inline-block mt-1 text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)]">
                        {dept}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
