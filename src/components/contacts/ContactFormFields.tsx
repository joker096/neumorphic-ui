import React from 'react';
import { Building, User, Tag, Trash2 } from 'lucide-react';
import type { ContactField, FieldType, PhoneSubtype, ContactTag } from '../../types/contact';

interface ContactCRMFieldsProps {
  isDark: boolean;
  company: string;
  setCompany: (v: string) => void;
  position: string;
  setPosition: (v: string) => void;
  tags: ContactTag[];
  setTags: (v: ContactTag[] | ((prev: ContactTag[]) => ContactTag[])) => void;
  showTags: boolean;
  setShowTags: (v: boolean) => void;
  t: (key: string, fallback?: string) => string;
}

export const ContactCRMFields = ({ isDark, company, setCompany, position, setPosition, tags, setTags, showTags, setShowTags, t }: ContactCRMFieldsProps) => {
  const allTags: ContactTag[] = ['client', 'lead', 'partner', 'vendor', 'internal', 'vip'];

  const getTagColor = (tag: string) => {
    switch (tag as ContactTag) {
      case 'client': return 'text-green-400 bg-green-500/20';
      case 'lead': return 'text-blue-400 bg-blue-500/20';
      case 'partner': return 'text-purple-400 bg-purple-500/20';
      case 'vendor': return 'text-orange-400 bg-orange-500/20';
      case 'vip': return 'text-amber-400 bg-amber-500/20';
      default: return isDark ? 'text-gray-400 bg-white/10' : 'text-slate-400 bg-black/5';
    }
  };

  const toggleTag = (tag: ContactTag) => {
    setTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      return next as ContactTag[];
    });
  };

  return (
    <div className="flex flex-col gap-3 mt-2">
      <div className="flex items-center gap-2">
        <div className={`flex-1 h-10 rounded-xl px-3 flex items-center gap-2 ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-slate-50 border border-[var(--border-color)]"}`}>
          <Building size={14} className={isDark ? "text-gray-500" : "text-slate-400"} />
          <input
            type="text"
            placeholder={t('contacts.companyPlaceholder', 'Company')}
            value={company}
            onChange={e => setCompany(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-[13px] ${isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
          />
        </div>
      </div>

      <div className={`flex-1 h-10 rounded-xl px-3 flex items-center gap-2 ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-slate-50 border border-[var(--border-color)]"}`}>
        <User size={14} className={isDark ? "text-gray-500" : "text-slate-400"} />
        <input
          type="text"
          placeholder={t('contacts.positionPlaceholder', 'Position (e.g. CEO, Manager)')}
          value={position}
          onChange={e => setPosition(e.target.value)}
          className={`flex-1 bg-transparent outline-none text-[13px] ${isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}
        />
      </div>

      <div className="relative">
        <div className={`h-10 rounded-xl px-3 flex items-center gap-2 cursor-pointer ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-slate-50 border border-[var(--border-color)]"}`} onClick={() => setShowTags(!showTags)}>
          <Tag size={14} className={isDark ? "text-gray-500" : "text-slate-400"} />
          <span className={`text-[13px] ${isDark ? "text-[var(--text-primary)] placeholder:text-gray-500" : "text-slate-700 placeholder:text-slate-400"}`}>
            {tags.length > 0 ? tags.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ') : t('contacts.addTags', 'Add tags...')}
          </span>
        </div>
        {showTags && (
          <div className={`absolute top-full left-0 right-0 z-20 mt-1 p-2 rounded-2xl ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-lg"}`}>
            <div className="grid grid-cols-2 gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-[10px] font-medium px-2 py-1 rounded-lg ${tags.includes(tag as ContactTag) ? getTagColor(tag) : (isDark ? "text-gray-500 hover:bg-white/5" : "text-slate-500 hover:bg-black/5")}`}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ContactCustomFieldProps {
  isDark: boolean;
  field: ContactField;
  updateField: (fid: string, updates: Partial<ContactField>) => void;
  removeField: (fid: string) => void;
  t: (key: string, fallback?: string) => string;
}

export const ContactCustomField = ({ isDark, field, updateField, removeField, t }: ContactCustomFieldProps) => {
  const defaults: Record<string, string> = { phone: t('contacts.fieldTypePhone'), email: t('contacts.fieldTypeEmail'), telegram: t('contacts.fieldTypeTelegram'), custom: field.label || '' };

  return (
    <div className={`p-3 rounded-xl flex flex-col gap-2 ${isDark ? "bg-[var(--bg-secondary)] border border-[var(--border-color)]" : "bg-slate-50 border border-[var(--border-color)]"}`}>
      <div className="flex items-center gap-2">
        <select
          value={field.type}
          onChange={(e) => {
            const newType = e.target.value as FieldType;
            updateField(field.id, { type: newType, label: defaults[newType] || '' });
          }}
          className={`flex-1 h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-800 border border-[var(--border-color)]"}`}
        >
          <option value="phone">{t('contacts.fieldTypePhone')}</option>
          <option value="email">{t('contacts.fieldTypeEmail')}</option>
          <option value="telegram">{t('contacts.fieldTypeTelegram')}</option>
          <option value="custom">{t('contacts.fieldTypeCustom')}</option>
        </select>
        <button
          type="button"
          onClick={() => removeField(field.id)}
          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:bg-red-500/10 text-red-500`}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {field.type === 'phone' && (
        <select
          value={field.phoneSubtype || 'mobile'}
          onChange={(e) => updateField(field.id, { phoneSubtype: e.target.value as PhoneSubtype })}
          className={`h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-800 border border-[var(--border-color)]"}`}
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
          className={`w-full h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-800 border border-[var(--border-color)]"}`}
        />
      )}
      <input
        type="text"
        placeholder={field.type === 'phone' ? '+7 999 123-45-67' : field.type === 'email' ? 'user@example.com' : field.type === 'telegram' ? '@username' : 'Value'}
        value={field.value}
        onChange={(e) => updateField(field.id, { value: e.target.value })}
        className={`w-full h-8 rounded-xl text-xs outline-none px-2 ${isDark ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)]" : "bg-white text-slate-800 border border-[var(--border-color)]"}`}
      />
    </div>
  );
};
