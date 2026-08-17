import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Check, Loader2 } from 'lucide-react';
import type { Contact, ContactField, ContactTag } from '../types/contact';
import { AppModal } from './ui/AppModal';
import { ContactCRMFields, ContactCustomField } from './contacts/ContactFormFields';
import { isValidEmail, isValidPhone } from '../constants/validation';

type ContactFormProps = {
  contact?: Contact;
  isDark?: boolean;
  onClose: () => void;
  onSave: (name: string, id: string, color?: string, localFields?: ContactField[], extra?: { company?: string; position?: string; tags?: ContactTag[]; notes?: string }) => void;
  isLoading?: boolean;
};

const FIELD_TYPES_WITH_VALIDATION: ContactField['type'][] = ['phone', 'email'];

export const ContactCreateEditModal = ({ contact, isDark = false, onClose, onSave, isLoading }: ContactFormProps) => {
  const isEditing = !!contact;
  const { t } = useI18n();
  const [name, setName] = useState(contact?.name || '');
  const [id, setId] = useState(contact?.id || '');
  const [error, setError] = useState('');
  const [localFields, setLocalFields] = useState<ContactField[]>(contact?.localFields || []);
  const [company, setCompany] = useState(contact?.company || '');
  const [position, setPosition] = useState(contact?.position || '');
  const [notes, setNotes] = useState(contact?.notes || '');
  const [tags, setTags] = useState<ContactTag[]>(contact?.tags || []);
  const [showTags, setShowTags] = useState(false);

  const hasFieldErrors = localFields.some(f =>
    FIELD_TYPES_WITH_VALIDATION.includes(f.type) && f.value.trim() !== '' && !validateField(f.type, f.value)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) {
      setError(t('contacts.fillBothFields', 'Please fill in both fields'));
      return;
    }
    if (hasFieldErrors) {
      setError(t('contacts.fixFieldErrors', 'Please fix the highlighted fields'));
      return;
    }
    setError('');
    onSave(name.trim(), id.trim(), contact?.color, localFields, { company: company || undefined, position: position || undefined, tags: tags || undefined, notes: notes || undefined });
    onClose();
  };

  const addField = () => {
    const newField: ContactField = {
      id: `field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'custom',
      label: '',
      value: '',
    };
    setLocalFields([...localFields, newField]);
  };

  const updateField = (fid: string, updates: Partial<ContactField>) => {
    setLocalFields(localFields.map(f => f.id === fid ? { ...f, ...updates } : f));
  };

  const removeField = (fid: string) => {
    setLocalFields(localFields.filter(f => f.id !== fid));
  };

  return (
    <AppModal
      isOpen={true}
      onClose={onClose}
      isDark={isDark}
      title={t(isEditing ? 'contacts.editContact' : 'contacts.addContact')}
      subtitle={isEditing ? t('contacts.updateContactHint') : t('contacts.enterContactHint')}
      maxWidth="max-w-[380px]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="text-xs text-center p-3 rounded-xl bg-[var(--danger-soft)] text-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('contacts.contactName')}
            </label>
            <input
              type="text"
              autoFocus
              autoComplete="name"
              placeholder={t('contacts.contactName')}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl text-sm outline-none transition-colors bg-input-bg text-input-text placeholder:text-input-placeholder"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('contacts.networkId')}
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder={t('contacts.networkId')}
              value={id}
              onChange={e => setId(e.target.value)}
              className="w-full h-12 px-4 rounded-xl text-sm font-mono outline-none transition-colors bg-input-bg text-input-text placeholder:text-input-placeholder"
            />
          </div>
        </div>

        <ContactCRMFields
          isDark={isDark}
          company={company}
          setCompany={setCompany}
          position={position}
          setPosition={setPosition}
          tags={tags}
          setTags={setTags}
          showTags={showTags}
          setShowTags={setShowTags}
          t={t}
        />

        <div className="flex flex-col gap-3 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t('contacts.localInfo')}</span>
            <button
              type="button"
              onClick={addField}
              className="text-[10px] font-bold px-2.5 py-1.5 rounded-full cursor-pointer transition-colors bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground"
            >
              {t('contacts.addField')}
            </button>
          </div>
          {localFields.length === 0 ? (
            <div className="text-[10px] text-center py-2 text-muted-foreground">
              {t('contacts.noLocalFields')}
            </div>
          ) : (
            localFields.map((field) => (
              <ContactCustomField
                key={field.id}
                isDark={isDark}
                field={field}
                updateField={updateField}
                removeField={removeField}
                t={t}
              />
            ))
          )}
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !id.trim() || hasFieldErrors || isLoading}
          className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 bg-accent text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_-8px_var(--accent)]"
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          <Check size={18} />
          {t(isEditing ? 'contacts.saveChanges' : 'contacts.saveContact')}
        </button>
      </form>
    </AppModal>
  );
};

function validateField(type: ContactField['type'], value: string): boolean {
  if (type === 'email') return isValidEmail(value);
  if (type === 'phone') return isValidPhone(value);
  return true;
}
