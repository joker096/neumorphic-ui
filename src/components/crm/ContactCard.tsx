import React, { useState } from 'react';
import { Trash2, Tag as TagIcon, X, Phone, Video, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { CRM_FALLBACKS, SYSTEM_ROLES, CONTACT_STATUSES } from '../../constants/crmConstants';
import type { CrmContact, CrmContactStatus, SystemRole } from '../../lib/crm/types';
import { CrmModal } from './CrmModal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useTheme } from '../../contexts/ThemeContext';
import { useCrmPermissions } from '../../lib/crm/permissions';

const inputCls =
  'w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)] text-xs';
const labelCls = 'text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block';
const selectCls = inputCls;

type Props = {
  contact?: CrmContact;
  onClose: () => void;
  onCall?: (name: string, color?: string) => void;
  onVideoCall?: (name: string, color?: string) => void;
  onMessage?: (name: string, color?: string) => void;
};

export const ContactCard: React.FC<Props> = ({ contact, onClose, onCall, onVideoCall, onMessage }) => {
  const { t } = useI18n();
  const { isDark } = useTheme();
  const contacts = useAppStore((s) => s.crmContacts);
  const departments = useAppStore((s) => s.crmDepartments);
  const contactAvatars = useAppStore((s) => s.contactAvatars);
  const overrideAvatar = contact ? contactAvatars[contact.displayName] : undefined;
  const customRoles = useAppStore((s) => s.crmCustomRoles);
  const userId = useAppStore((s) => s.userProfile.id);
  const updateContact = useAppStore((s) => s.updateContact);
  const addContact = useAppStore((s) => s.addContact);
  const removeContact = useAppStore((s) => s.removeContact);
  const { can, me } = useCrmPermissions();

  const isNew = !contact;
  const isSelf = contact?.userId === userId;
  const editable = isNew ? can('manageMembers') : (can('manageMembers') || isSelf);

  const [form, setForm] = useState({
    displayName: contact?.displayName ?? '',
    title: contact?.title ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    notes: contact?.notes ?? '',
    role: (contact?.role ?? 'member') as SystemRole,
    customRoleId: contact?.customRoleId ?? '',
    departmentId: contact?.departmentId ?? '',
    status: (contact?.status ?? 'lead') as CrmContactStatus,
    assignedManagerId: contact?.assignedManagerId ?? (can('assignManagers') ? userId : ''),
    tags: [...(contact?.tags ?? [])],
  });
  const [tagInput, setTagInput] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) set('tags', [...form.tags, tag]);
    setTagInput('');
  };

  const handleSave = () => {
    const name = form.displayName.trim();
    if (!name) { toast.error(t('crm.nameRequired', 'Name is required')); return; }
    const payload = {
      displayName: name,
      title: form.title,
      phone: form.phone,
      email: form.email,
      notes: form.notes,
      role: form.role,
      customRoleId: form.customRoleId || null,
      departmentId: form.departmentId || null,
      status: form.status,
      assignedManagerId: form.assignedManagerId || null,
      tags: form.tags.filter((x) => x !== 'me'),
    };
    if (isNew) {
      addContact(payload);
      toast.success(t('crm.contactCreated', 'Contact created'));
    } else if (contact) {
      updateContact(contact.userId, payload);
      toast.success(t('crm.contactSaved', 'Contact saved'));
    }
    onClose();
  };

  const handleRemove = () => {
    if (!contact) return;
    if (isSelf) { toast.error(t('crm.youCantRemoveSelf', CRM_FALLBACKS.youCantRemoveSelf)); return; }
    setConfirmRemove(true);
  };

  const handleConfirmRemove = () => {
    if (!contact) return;
    removeContact(contact.userId);
    toast.success(t('crm.contactRemoved', 'Contact removed'));
    setConfirmRemove(false);
    onClose();
  };

  return (
    <>
    <CrmModal
      onClose={onClose}
      title={isNew ? t('crm.newContact', CRM_FALLBACKS.newContact) : t('crm.editContact', CRM_FALLBACKS.editContact)}
      footer={
        <div className="flex items-center gap-2">
          {editable ? (
            <button onClick={handleSave} className="flex-1 min-h-[44px] rounded-xl font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110">
              {t('crm.save', CRM_FALLBACKS.save)}
            </button>
          ) : (
            <div className="flex-1 text-center text-xs text-[var(--text-secondary)] py-2">{t('crm.readOnly', 'Read only — admins can edit')}</div>
          )}
          {!isNew && (can('manageMembers')) && (
            <button onClick={handleRemove} className="min-h-[44px] px-4 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer transition-all bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-110">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {isNew && (
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {t('crm.demoNote', CRM_FALLBACKS.demoNote)}
          </p>
        )}
        {contact && (
          <>
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xl shrink-0 ${contact.avatarColor ? `bg-gradient-to-br ${contact.avatarColor}` : 'bg-[var(--accent)]'}`}>
                {overrideAvatar ? (
                  <img src={overrideAvatar} alt="" role="presentation" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  contact.displayName.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold truncate text-[var(--text-primary)]">{contact.displayName}</div>
                <div className="flex items-center gap-1.5 text-xs mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${contact.online ? 'bg-green-500' : 'bg-gray-400'}`} aria-hidden="true" />
                  <span className={isDark ? 'text-gray-400' : 'text-[var(--text-secondary)]'}>{contact.online ? t('crm.online', 'Online') : t('crm.offline', 'Offline')}</span>
                </div>
                {contact.title && <div className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{contact.title}</div>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                type="button"
                onClick={() => { onCall?.(contact.displayName, contact.avatarColor); onClose(); }}
                className="min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl border border-green-500/20 bg-green-500/15 text-green-500 text-xs font-bold cursor-pointer transition-all hover:bg-green-500/25"
              >
                <Phone size={18} />
                {t('crm.call', CRM_FALLBACKS.call)}
              </button>
              <button
                type="button"
                onClick={() => { onVideoCall?.(contact.displayName, contact.avatarColor); onClose(); }}
                className="min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl border border-teal-500/20 bg-teal-500/15 text-teal-500 text-xs font-bold cursor-pointer transition-all hover:bg-teal-500/25"
              >
                <Video size={18} />
                {t('crm.videoCall', CRM_FALLBACKS.videoCall)}
              </button>
              <button
                type="button"
                onClick={() => { onMessage?.(contact.displayName, contact.avatarColor); onClose(); }}
                className="min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--accent-soft)] bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-bold cursor-pointer transition-all hover:brightness-110"
              >
                <MessageSquare size={18} />
                {t('crm.message', CRM_FALLBACKS.message)}
              </button>
            </div>
          </>
        )}
        <div>
          <label className={labelCls}>{t('crm.fullName', CRM_FALLBACKS.fullName)}</label>
          <input value={form.displayName} disabled={!editable} onChange={(e) => set('displayName', e.target.value)} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('crm.jobTitle', CRM_FALLBACKS.jobTitle)}</label>
            <input value={form.title} disabled={!editable} onChange={(e) => set('title', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>{t('crm.status', CRM_FALLBACKS.status)}</label>
            <select value={form.status} disabled={!editable} onChange={(e) => set('status', e.target.value as CrmContactStatus)} className={selectCls}>
              {CONTACT_STATUSES.map((s) => <option key={s.id} value={s.id}>{t(s.labelKey, (CRM_FALLBACKS as any)[s.labelKey.replace('crm.', '')])}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>{t('crm.phone', CRM_FALLBACKS.phone)}</label>
            <input value={form.phone} disabled={!editable} onChange={(e) => set('phone', e.target.value)} className={inputCls} inputMode="tel" />
          </div>
          <div>
            <label className={labelCls}>{t('crm.email', CRM_FALLBACKS.email)}</label>
            <input value={form.email} disabled={!editable} onChange={(e) => set('email', e.target.value)} className={inputCls} inputMode="email" />
          </div>
        </div>
        {editable && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('crm.role', CRM_FALLBACKS.role)}</label>
              <select value={form.role} onChange={(e) => set('role', e.target.value as SystemRole)} className={selectCls}>
                {SYSTEM_ROLES.map((r) => <option key={r.id} value={r.id}>{t(r.labelKey, (CRM_FALLBACKS as any)[r.labelKey.replace('crm.', '')])}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('crm.department', CRM_FALLBACKS.department)}</label>
              <select value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        )}
        {editable && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>{t('crm.manager', CRM_FALLBACKS.manager)}</label>
              <select value={form.assignedManagerId} onChange={(e) => set('assignedManagerId', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {contacts.filter((c) => c.role === 'manager' || c.role === 'admin').map((c) => <option key={c.userId} value={c.userId}>{c.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('crm.customRole', 'Custom role')}</label>
              <select value={form.customRoleId} onChange={(e) => set('customRoleId', e.target.value)} className={selectCls}>
                <option value="">—</option>
                {customRoles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
        )}
        <div>
          <label className={labelCls}>{t('crm.tagsPlaceholder', CRM_FALLBACKS.tagsPlaceholder)}</label>
          <div className="flex gap-2">
            <input
              value={tagInput}
              disabled={!editable}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder={t('crm.tagsPlaceholder', CRM_FALLBACKS.tagsPlaceholder)}
              className={inputCls}
            />
            {editable && <button onClick={addTag} className="min-h-[44px] px-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] font-bold cursor-pointer">+</button>}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
                <TagIcon size={10} />{tag}
                {editable && <button onClick={() => set('tags', form.tags.filter((x) => x !== tag))} className="ml-0.5"><X size={10} /></button>}
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>{t('crm.notes', CRM_FALLBACKS.notes)}</label>
          <textarea value={form.notes} disabled={!editable} onChange={(e) => set('notes', e.target.value)} rows={3} className={`${inputCls} py-2 resize-none`} />
        </div>
      </div>
    </CrmModal>

      <ConfirmDialog
        isOpen={confirmRemove}
        title={t('crm.confirmDeleteContact', 'Delete contact?')}
        message={contact?.displayName ?? ''}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        zIndex="z-[130]"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </>
  );
};
