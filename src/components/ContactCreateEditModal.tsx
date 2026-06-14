import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Edit, UserPlus, Plus, Scan, Check, Loader2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import type { Contact, ContactField, FieldType } from '../types/contact';

type ContactFormProps = {
  contact?: Contact;
  isDark: boolean;
  onClose: () => void;
  onSave: (name: string, id: string, color: string | undefined, localFields: ContactField[]) => void;
  isLoading?: boolean;
};

let fieldIdCounter = 0;
const genFieldId = () => `field_${++fieldIdCounter}_${Date.now()}`;

const FIELD_OPTIONS: FieldType[] = ['phone', 'email', 'telegram', 'whatsapp', 'signal', 'custom'];

const FIELD_LABEL_KEY: Record<FieldType, string> = {
  phone: 'contacts.fieldTypePhone',
  email: 'contacts.fieldTypeEmail',
  telegram: 'contacts.fieldTypeTelegram',
  whatsapp: 'contacts.fieldTypeWhatsapp',
  signal: 'contacts.fieldTypeSignal',
  custom: 'contacts.fieldTypeCustom',
};

export const ContactCreateEditModal = ({ contact, isDark, onClose, onSave, isLoading }: ContactFormProps) => {
  const isEditing = !!contact;
  const { t } = useI18n();
  const [name, setName] = useState(contact?.name || '');
  const [id, setId] = useState(contact?.id || '');
  const [error, setError] = useState('');
  const [localFields, setLocalFields] = useState<ContactField[]>(contact?.localFields || []);

  const addField = () => {
    setLocalFields([...localFields, { id: genFieldId(), type: 'phone', label: t('contacts.fieldTypePhone'), value: '' }]);
  };

  const updateField = (fieldId: string, upd: Partial<ContactField>) => {
    setLocalFields(localFields.map(f => f.id === fieldId ? { ...f, ...upd } : f));
  };

  const removeField = (fieldId: string) => {
    setLocalFields(localFields.filter(f => f.id !== fieldId));
  };

  const handleFieldTypeChange = (fieldId: string, type: FieldType) => {
    const upd: Partial<ContactField> = { type, label: t(FIELD_LABEL_KEY[type]) };
    if (type !== 'phone') upd.phoneSubtype = undefined;
    updateField(fieldId, upd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id.trim()) {
      setError(t('contacts.validationRequired'));
      return;
    }
    setError('');
    onSave(name.trim(), id.trim(), contact?.color, localFields);
    onClose();
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
        className={`w-full max-w-[380px] rounded-[32px] p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto ${isDark ? "bg-[#1a1d24] border border-white/10" : "bg-white border border-black/10"}`}
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
                {isEditing ? t('contacts.editDetailsHint') : t('contacts.addDetailsHint')}
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

          {/* Local Fields Section */}
          <div className={`border-t pt-4 mt-2 ${isDark ? "border-white/10" : "border-black/10"}`}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-bold ${isDark ? "text-gray-300" : "text-slate-700"}`}>{t('contacts.localInfo')}</h4>
              <button type="button" onClick={addField} className={`text-xs flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${isDark ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30" : "bg-orange-100 text-orange-600 hover:bg-orange-200"}`}>
                <Plus size={12} /> {t('contacts.addField')}
              </button>
            </div>

            {localFields.length === 0 && (
              <p className={`text-xs italic ${isDark ? "text-gray-600" : "text-slate-400"}`}>{t('contacts.noLocalFields')}</p>
            )}

            <div className="flex flex-col gap-3">
              {localFields.map((field) => (
                <div key={field.id} className={`p-3 rounded-2xl ${isDark ? "bg-[#13151b]" : "bg-slate-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <select
                      value={field.type}
                      onChange={e => handleFieldTypeChange(field.id, e.target.value as FieldType)}
                      className={`text-xs rounded-lg px-2 py-1 outline-none border ${isDark ? "bg-[#1a1d24] text-gray-300 border-white/10" : "bg-white text-slate-700 border-black/10"}`}
                    >
                      {FIELD_OPTIONS.map(o => (
                        <option key={o} value={o}>{t(FIELD_LABEL_KEY[o])}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className={`ml-auto w-6 h-6 rounded-full flex items-center justify-center ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"}`}
                      title={t('contacts.deleteField')}
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {field.type === 'custom' && (
                    <input
                      type="text"
                      placeholder={t('contacts.fieldLabel')}
                      value={field.label}
                      onChange={e => updateField(field.id, { label: e.target.value })}
                      className={`w-full h-8 px-3 rounded-xl text-xs outline-none border mb-2 ${isDark ? "bg-[#1a1d24] text-white border-white/10" : "bg-white text-slate-800 border-black/10"}`}
                    />
                  )}

                  <div className="flex gap-2">
                    {field.type === 'phone' && (
                      <select
                        value={field.phoneSubtype || 'mobile'}
                        onChange={e => updateField(field.id, { phoneSubtype: e.target.value as any })}
                        className={`w-[90px] text-xs rounded-xl px-2 py-1.5 outline-none border ${isDark ? "bg-[#1a1d24] text-gray-300 border-white/10" : "bg-white text-slate-700 border-black/10"}`}
                      >
                        <option value="mobile">{t('contacts.phoneSubtypeMobile')}</option>
                        <option value="work">{t('contacts.phoneSubtypeWork')}</option>
                        <option value="home">{t('contacts.phoneSubtypeHome')}</option>
                        <option value="main">{t('contacts.phoneSubtypeMain')}</option>
                      </select>
                    )}
                    <input
                      type="text"
                      placeholder={t('contacts.fieldValue')}
                      value={field.value}
                      onChange={e => updateField(field.id, { value: e.target.value })}
                      className={`flex-1 h-9 px-3 rounded-xl text-xs outline-none border ${isDark ? "bg-[#1a1d24] text-white border-white/10" : "bg-white text-slate-800 border-black/10"}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className={`text-[9px] mt-3 text-center ${isDark ? "text-gray-600" : "text-slate-400"}`}>{t('contacts.localFieldsNotShared')}</p>
          </div>

          <button 
            type="submit" 
            disabled={!name.trim() || !id.trim() || isLoading}
            className={`w-full h-12 rounded-2xl font-bold mt-2 transition-all flex items-center justify-center gap-2 ${(!name.trim() || !id.trim()) ? "opacity-50 cursor-not-allowed text-white/50 bg-gray-500" : "bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20"}`}
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
