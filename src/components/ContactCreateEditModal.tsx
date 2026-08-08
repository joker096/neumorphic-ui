import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { X, UserPlus, Edit, Check, Loader2 } from 'lucide-react';
import type { Contact, ContactField, ContactTag } from '../types/contact';
import { AppModal } from './ui/AppModal';
import { ContactCRMFields, ContactCustomField } from './contacts/ContactFormFields';

type ContactFormProps = {
  contact?: Contact;
  isDark?: boolean;
  onClose: () => void;
  onSave: (name: string, id: string, color?: string, localFields?: ContactField[], extra?: { company?: string; position?: string; tags?: ContactTag[]; notes?: string }) => void;
  isLoading?: boolean;
};

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) {
      setError(t('contacts.fillBothFields', 'Please fill in both fields'));
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
    <AppModal isOpen={true} onClose={onClose} isDark={isDark} title={t(isEditing ? 'contacts.editContact' : 'contacts.addContact')} maxWidth="max-w-[380px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col items-center mb-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
            {isEditing ? <Edit size={32} /> : <UserPlus size={32} />}
          </div>
          <p className={`text-xs text-center mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            {isEditing ? t('contacts.updateContactHint', 'Update contact details below.') : t('contacts.enterContactHint', 'Enter their name and unique network ID.')}
          </p>
        </div>

        {error && (
          <div className={`text-xs text-center p-2 rounded-lg ${isDark ? "bg-red-500/20 text-red-400" : "bg-red-50 text-red-600"}`}>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="text"
            autoFocus
            placeholder={t('contacts.contactName')}
            value={name}
            onChange={e => setName(e.target.value)}
            className={`w-full h-12 px-4 rounded-xl text-sm outline-none border-2 transition-colors ${isDark ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500" : "bg-slate-50 text-slate-800 border-[var(--border-color)] focus:border-orange-500"}`}
          />
          <div className="relative">
            <input
              type="text"
              placeholder={t('contacts.networkId')}
              value={id}
              onChange={e => setId(e.target.value)}
              className={`w-full h-12 pl-4 pr-12 rounded-xl text-sm font-mono outline-none border-2 transition-colors ${isDark ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500" : "bg-slate-50 text-slate-800 border-[var(--border-color)] focus:border-orange-500"}`}
            />
            {!isEditing && (
              <button
                type="button"
                className={`absolute right-2 top-2 bottom-2 w-10 h-10 flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]`}
                title={t('header.scanQR')}
                aria-label={t('header.scanQR')}
              >
                <Edit size={16} />
              </button>
            )}
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

        <div className="flex flex-col gap-3 mt-2">
          <div className={`flex items-center justify-between ${isDark ? "text-gray-300" : "text-slate-700"}`}>
            <span className="text-xs font-bold uppercase tracking-widest">{t('contacts.localInfo')}</span>
            <button
              type="button"
              onClick={addField}
              className={`text-[10px] font-bold px-2 py-1 rounded-full cursor-pointer transition-all ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-white/10 hover:text-[var(--text-primary)]" : "bg-orange-100 text-orange-600 hover:bg-black/5 hover:text-slate-800"}`}
            >
              {t('contacts.addField')}
            </button>
          </div>
          {localFields.map((field) => (
            <ContactCustomField
              key={field.id}
              isDark={isDark}
              field={field}
              updateField={updateField}
              removeField={removeField}
              t={t}
            />
          ))}
          {localFields.length === 0 && (
            <div className={`text-[10px] text-center py-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
              {t('contacts.noLocalFields')}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!name.trim() || !id.trim() || isLoading}
          className={`w-full h-12 rounded-xl font-bold mt-4 transition-all flex items-center justify-center gap-2 ${(!name.trim() || !id.trim()) ? "opacity-50 cursor-not-allowed text-white/50 bg-gray-500" : "bg-orange-500 text-[var(--text-primary)] hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20"}`}
        >
          {isLoading && <Loader2 size={18} className="animate-spin" />}
          <Check size={18} />
          {t(isEditing ? 'contacts.saveChanges' : 'contacts.saveContact')}
        </button>
      </form>
    </AppModal>
  );
};
