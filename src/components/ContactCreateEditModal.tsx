import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { X, UserPlus, Edit, Scan, Check, Loader2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Contact, ContactField, FieldType, PhoneSubtype } from '../types/contact';

type ContactFormProps = {
  contact?: Contact;
  isDark: boolean;
  onClose: () => void;
  onSave: (name: string, id: string, color?: string, localFields?: ContactField[]) => void;
  isLoading?: boolean;
};

export const ContactCreateEditModal = ({ contact, isDark, onClose, onSave, isLoading }: ContactFormProps) => {
  const isEditing = !!contact;
  const { t } = useI18n();
  const [name, setName] = useState(contact?.name || '');
  const [id, setId] = useState(contact?.id || '');
  const [error, setError] = useState('');
  const [localFields, setLocalFields] = useState<ContactField[]>(contact?.localFields || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) {
      setError('Please fill in both fields');
      return;
    }
    setError('');
    onSave(name.trim(), id.trim(), contact?.color, localFields);
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
        className={`w-full max-w-[340px] rounded-[32px] p-6 shadow-2xl relative ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
      >
        <div
          className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
          onClick={onClose}
          title={t('contacts.close')}
        >
          <X size={18} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col items-center mb-2">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDark ? "bg-orange-500/20 text-orange-400" : "bg-orange-100 text-orange-600"}`}>
              {isEditing ? <Edit size={32} /> : <UserPlus size={32} />}
            </div>
            <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t(isEditing ? 'contacts.editContact' : 'contacts.addContact')}</h3>
            <p className={`text-xs text-center mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
              {isEditing ? 'Update contact details below.' : 'Enter their name and unique network ID to establish a connection.'}
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
              className={`w-full h-12 px-4 rounded-2xl text-sm outline-none border-2 transition-colors ${isDark ? "bg-[#13151b] text-white border-white/10 focus:border-orange-500" : "bg-slate-50 text-slate-800 border-black/5 focus:border-orange-500"}`}
            />
            <div className="relative">
               <input
                 type="text"
                 placeholder={t('contacts.networkId')}
                 value={id}
                 onChange={e => setId(e.target.value)}
                 className={`w-full h-12 pl-4 pr-12 rounded-2xl text-sm font-mono outline-none border-2 transition-colors ${isDark ? "bg-[#13151b] text-white border-white/10 focus:border-orange-500" : "bg-slate-50 text-slate-800 border-black/5 focus:border-orange-500"}`}
               />
               {!isEditing && (
                 <button
                   type="button"
                   onClick={() => { /* QR scan handled by parent */ }}
                   className={`absolute right-2 top-2 bottom-2 w-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/5 hover:bg-black/10 text-slate-800"}`}
                   title={t('header.scanQR')}
                 >
                   <Scan size={16} />
                 </button>
               )}
               {isEditing && (
                 <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                   {id.slice(0, 8)}...
                 </span>
               )}
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-2">
            <div className={`flex items-center justify-between ${isDark ? "text-gray-300" : "text-slate-700"}`}>
              <span className="text-xs font-bold uppercase tracking-widest">{t('contacts.localInfo')}</span>
              <button
                type="button"
                onClick={addField}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"}`}
              >
              {t('contacts.addField')}
            </button>
            </div>
            {localFields.map((field) => (
              <div key={field.id} className={`p-3 rounded-2xl flex flex-col gap-2 ${isDark ? "bg-[#13151b] border border-white/5" : "bg-slate-50 border border-black/5"}`}>
                <div className="flex items-center gap-2">
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as FieldType;
                      const defaults: Record<string, string> = { phone: 'Phone', email: 'Email', telegram: 'Telegram', custom: field.label || '' };
                      updateField(field.id, { type: newType, label: defaults[newType] || '' });
                    }}
                    className={`flex-1 h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
                  >
                    <option value="phone">{t('contacts.fieldTypePhone')}</option>
                    <option value="email">{t('contacts.fieldTypeEmail')}</option>
                    <option value="telegram">{t('contacts.fieldTypeTelegram')}</option>
                    <option value="custom">{t('contacts.fieldTypeCustom')}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-100"}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {field.type === 'phone' && (
                  <select
                    value={field.phoneSubtype || 'mobile'}
                    onChange={(e) => updateField(field.id, { phoneSubtype: e.target.value as PhoneSubtype })}
                    className={`h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
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
                    className={`w-full h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
                  />
                )}
                <input
                  type="text"
                  placeholder={field.type === 'phone' ? '+7 999 123-45-67' : field.type === 'email' ? 'user@example.com' : field.type === 'telegram' ? '@username' : 'Value'}
                  value={field.value}
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                  className={`w-full h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[#1a1d24] text-white border border-white/10" : "bg-white text-slate-800 border border-black/10"}`}
                />
              </div>
            ))}
            {localFields.length === 0 && (
              <div className={`text-[10px] text-center py-2 ${isDark ? "text-gray-500" : "text-slate-400"}`}>
                {t('contacts.noLocalFields')}
              </div>
            )}
            <div className={`text-[9px] text-center ${isDark ? "text-gray-600" : "text-slate-400"}`}>
              {t('contacts.localFieldsNotShared')}
            </div>
          </div>

          <button
            type="submit"
            disabled={!name.trim() || !id.trim() || isLoading}
            className={`w-full h-12 rounded-2xl font-bold mt-4 transition-all flex items-center justify-center gap-2 ${(!name.trim() || !id.trim()) ? "opacity-50 cursor-not-allowed text-white/50 bg-gray-500" : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20"}`}
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
