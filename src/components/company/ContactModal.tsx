import React, { useState } from 'react';
import { X, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyContact, CompanyDepartment } from '../../types/constants';
import { useI18n } from '../../lib/i18n';
import { FormField } from '../ui/FormField';
import { ConfirmDialog } from '../ui/ConfirmDialog';

type ContactModalProps = {
  contact: CompanyContact | null;
  departments: CompanyDepartment[];
  isDark?: boolean;
  canManage: boolean;
  onClose: () => void;
  onSave: (input: { name: string; title?: string; phone?: string; email?: string; departmentId?: string | null; notes?: string }) => void;
  onRemove?: (id: string) => void;
};

export const ContactModal: React.FC<ContactModalProps> = ({
  contact,
  departments,
  isDark = false,
  canManage,
  onClose,
  onSave,
  onRemove,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(contact?.name || '');
  const [title, setTitle] = useState(contact?.title || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [departmentId, setDepartmentId] = useState<string | null>(contact?.departmentId ?? null);
  const [notes, setNotes] = useState(contact?.notes || '');
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t('company.contactName', 'Name'));
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(t('company.contactEmail', 'Email'));
      return;
    }
    setSaving(true);
    try {
      onSave({
        name: trimmed,
        title: title.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        departmentId,
        notes: notes.trim() || undefined,
      });
      toast.success(t('company.memberSaved', 'Saved'));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (contact && onRemove) {
      setConfirmRemove(true);
    }
  };

  const handleConfirmRemove = () => {
    if (contact && onRemove) {
      onRemove(contact.id);
      toast.success(t('company.memberRemoved', 'Removed'));
      setConfirmRemove(false);
      onClose();
    }
  };

  const panelBg = isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl ${panelBg}`}>
<button
  type="button"
  aria-label={t('common.close')}
  onClick={onClose}
  className="absolute top-4 right-4 z-10 w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
>
  <X size={18} />
</button>
        <h3 className="text-xl font-bold mb-5 text-[var(--text-primary)]">
          {contact ? t('company.editContact', 'Edit contact') : t('company.addContact', 'Add contact')}
        </h3>

        <div className="flex flex-col gap-4">
          <FormField
            label={t('company.contactName', 'Name')}
            placeholder={t('company.contactNamePlaceholder', 'Full name or company')}
            value={name}
            onChange={setName}
            theme={isDark ? 'dark' : 'light'}
            required
            autoFocus
          />
          <FormField
            label={t('company.contactTitle', 'Title / Role')}
            placeholder={t('company.contactTitlePlaceholder', 'e.g. Procurement manager')}
            value={title}
            onChange={setTitle}
            theme={isDark ? 'dark' : 'light'}
          />
          <FormField
            label={t('company.contactPhone', 'Phone')}
            placeholder={t('company.contactPhonePlaceholder', '+7 ...')}
            value={phone}
            onChange={setPhone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            theme={isDark ? 'dark' : 'light'}
          />
          <FormField
            label={t('company.contactEmail', 'Email')}
            placeholder={t('company.contactEmailPlaceholder', 'name@example.com')}
            value={email}
            onChange={setEmail}
            type="email"
            inputMode="email"
            autoComplete="email"
            theme={isDark ? 'dark' : 'light'}
          />

          <div className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t('company.contactDepartment', 'Department')}
            </label>
            <select
              value={departmentId ?? ''}
              onChange={(e) => setDepartmentId(e.target.value || null)}
              className="w-full min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-sm"
            >
              <option value="">{t('company.contactDepartmentNone', 'No department')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t('company.contactNotes', 'Notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('company.contactNotesPlaceholder', 'Any extra details...')}
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-sm resize-none"
            />
          </div>

          {contact && canManage && onRemove && (
            <button
              onClick={handleRemove}
              aria-label={t('company.removeMember', 'Remove')}
              title={t('company.removeMember', 'Remove')}
              className="w-9 h-9 min-w-11 min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-110"
            >
              <Trash2 size={16} />
              <span className="sr-only">{t('company.removeMember', 'Remove')}</span>
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            aria-label={t('company.save', 'Save')}
            title={t('company.save', 'Save')}
            className="w-full min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            <span>{t('company.save', 'Save')}</span>
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmRemove}
        title={t('company.confirmRemoveContact', 'Remove this contact?')}
        message={contact?.name ?? ''}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        zIndex="z-[130]"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
};
