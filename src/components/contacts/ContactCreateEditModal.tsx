import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { X, UserPlus, Edit, Scan, Check, Loader2, Trash2, User, Building, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import type { Contact, ContactField, FieldType, PhoneSubtype, ContactTag } from '../../types/contact';

type ContactFormProps = {
  contact?: Contact;
  onClose: () => void;
  onSave: (name: string, id: string, color?: string, localFields?: ContactField[], extra?: { company?: string; position?: string; tags?: ContactTag[]; notes?: string }) => void;
  isLoading?: boolean;
};

export const ContactCreateEditModal = ({ contact, onClose, onSave, isLoading }: ContactFormProps) => {
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

  const allTags: ContactTag[] = ['client', 'lead', 'partner', 'vendor', 'internal', 'vip'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) {
      setError('Please fill in both fields');
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

  const toggleTag = (tag: ContactTag) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const getTagColor = (tag: string) => {
    switch (tag as ContactTag) {
      case 'client': return 'text-green-400 bg-green-500/20';
      case 'lead': return 'text-blue-400 bg-blue-500/20';
      case 'partner': return 'text-purple-400 bg-purple-500/20';
      case 'vendor': return 'text-orange-400 bg-orange-500/20';
      case 'vip': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-[var(--text-secondary)] bg-[var(--bg-secondary)]';
    }
  };

  const bgInput = "bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)]";
  const borderInput = "bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-color)]";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="w-full max-w-[380px] max-h-[90vh] overflow-y-auto p-5 shadow-2xl relative bg-[var(--bg-elevated)] border border-[var(--border-color)]"
      >
        <div
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          onClick={onClose}
          title={t('contacts.close')}
        >
          <X size={18} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col items-center mb-2">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[var(--accent-soft)] text-[var(--accent)]">
              {isEditing ? <Edit size={32} /> : <UserPlus size={32} />}
            </div>
            <h3 className={`text-xl font-bold text-[--text-primary]`}>{t(isEditing ? 'contacts.editContact' : 'contacts.addContact')}</h3>
            <p className="text-xs text-center mt-2 text-[var(--text-secondary)]">
              {isEditing ? 'Update contact details below.' : 'Enter their name and unique network ID.'}
            </p>
          </div>

          {error && (
            <div className="text-xs text-center p-2 rounded-lg bg-red-500/10 text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
                <input
                  type="text"
                  autoFocus
                  autoComplete="name"
                  placeholder={t('contacts.contactName')}
                  value={name}
                  onChange={e => setName(e.target.value)}
className="w-full h-12 px-4 rounded-md text-sm outline-none border-2 transition-colors bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500"
                  />
              <div className="relative">
                <input
                  type="text"
                  autoComplete="off"
                  placeholder={t('contacts.networkId')}
                  value={id}
                  onChange={e => setId(e.target.value)}
                  className="w-full h-12 pl-4 pr-12 rounded-md text-sm font-mono outline-none border-2 transition-colors bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500"
                />
              {!isEditing && (
                <button
                  type="button"
                  className="absolute right-2 top-2 bottom-2 w-8 rounded-md flex items-center justify-center transition-colors bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  title={t('header.scanQR')}
                >
                  <Scan size={16} />
                </button>
              )}
            </div>
          </div>

          {/* CRM Fields */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-10 rounded-md px-3 flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <Building size={14} className="text-[var(--text-secondary)]" />
                <input
                  type="text"
                  autoComplete="organization"
                  placeholder="Company"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                />
              </div>
            </div>

<div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] flex-1 h-10 rounded-md px-3 flex items-center gap-2">
               <User size={14} className="text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Position (e.g. CEO, Manager)"
                value={position}
                onChange={e => setPosition(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />
            </div>

            <div className="relative">
              <div className="h-10 rounded-md px-3 flex items-center gap-2 cursor-pointer bg-[var(--bg-secondary)] border border-[var(--border-color)]" onClick={() => setShowTags(!showTags)}>
                <Tag size={14} className="text-[var(--text-secondary)]" />
                <span className="text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]">
                  {tags.length > 0 ? tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') : 'Add tags...'}
                </span>
              </div>
              {showTags && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 p-2 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-color)] shadow-lg">
                  <div className="grid grid-cols-2 gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-[10px] font-medium px-2 py-1 rounded-lg ${tags.includes(tag as ContactTag) ? getTagColor(tag) : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}`}
                      >
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between text-[var(--text-secondary)]">
              <span className="text-xs font-bold uppercase tracking-widest">{t('contacts.localInfo')}</span>
              <button
                type="button"
                onClick={addField}
                className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-orange-600 hover:text-white"
              >
                {t('contacts.addField')}
              </button>
            </div>
            {localFields.map((field) => (
              <div key={field.id} className="p-3 rounded-md flex flex-col gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as FieldType;
                      const defaults: Record<string, string> = { phone: 'Phone', email: 'Email', telegram: 'Telegram', custom: field.label || '' };
                      updateField(field.id, { type: newType, label: defaults[newType] || '' });
                    }}
                    className={`flex-1 h-8 rounded-md text-xs outline-none px-2 ${borderInput}`}
                  >
                    <option value="phone">{t('contacts.fieldTypePhone')}</option>
                    <option value="email">{t('contacts.fieldTypeEmail')}</option>
                    <option value="telegram">{t('contacts.fieldTypeTelegram')}</option>
                    <option value="custom">{t('contacts.fieldTypeCustom')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-red-600 hover:bg-red-100 hover:text-white transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {field.type === 'phone' && (
                  <select
                    value={field.phoneSubtype || 'mobile'}
                    onChange={(e) => updateField(field.id, { phoneSubtype: e.target.value as PhoneSubtype })}
                    className={`h-8 rounded-md text-xs outline-none px-2 ${borderInput}`}
                  >
                    <option value="mobile">{t('contacts.fieldSubtypeMobile')}</option>
                    <option value="work">{t('contacts.fieldSubtypeWork')}</option>
                    <option value="home">{t('contacts.fieldSubtypeHome')}</option>
                    <option value="main">{t('contacts.fieldSubtypeMain')}</option>
                  </select>
                )}
                {field.type === 'custom' && (
                  <input
                    type="text"
                    placeholder="Label"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className={`w-full h-8 rounded-md text-xs outline-none px-2 ${borderInput}`}
                  />
                )}
                <input
                  type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                  inputMode={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                  autoComplete={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'telegram' ? 'username' : 'off'}
                  placeholder={field.type === 'phone' ? '+7 999 123-45-67' : field.type === 'email' ? 'user@example.com' : field.type === 'telegram' ? '@username' : 'Value'}
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                  className={`w-full h-8 rounded-md text-xs outline-none px-2 ${borderInput}`}
                />
              </div>
            ))}
            {localFields.length === 0 && (
              <div className="text-[10px] text-center py-2 text-[var(--text-tertiary)]">
                {t('contacts.noLocalFields')}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !id.trim() || isLoading}
            className={`w-full h-12 rounded-md font-bold mt-4 transition-all flex items-center justify-center gap-2 ${(!name.trim() || !id.trim()) ? "opacity-50 cursor-not-allowed text-white/50 bg-gray-500" : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20"}`}
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            <Check size={18} />
            {t(isEditing ? 'contacts.saveChanges' : 'contacts.saveContact')}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};
