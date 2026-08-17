import React from 'react';
import { Building, User, Tag, Trash2, Plus } from 'lucide-react';
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

const fieldBoxClass =
  'w-full h-10 rounded-xl px-3 flex items-center gap-2 bg-input-bg transition-colors';
const fieldInputClass =
  'flex-1 bg-transparent outline-none text-[13px] text-input-text placeholder:text-input-placeholder';
const fieldIconClass = 'shrink-0 text-muted-foreground';

export const ContactCRMFields = ({ company, setCompany, position, setPosition, tags, setTags, showTags, setShowTags, t }: ContactCRMFieldsProps) => {
  const allTags: ContactTag[] = ['client', 'lead', 'partner', 'vendor', 'internal', 'vip'];

  const getTagColor = (tag: string) => {
    switch (tag as ContactTag) {
      case 'client': return 'text-green-600 bg-green-500/15 dark:text-green-400';
      case 'lead': return 'text-blue-600 bg-blue-500/15 dark:text-blue-400';
      case 'partner': return 'text-purple-600 bg-purple-500/15 dark:text-purple-400';
      case 'vendor': return 'text-orange-600 bg-orange-500/15 dark:text-orange-400';
      case 'vip': return 'text-amber-600 bg-amber-500/15 dark:text-amber-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const toggleTag = (tag: ContactTag) => {
    setTags(prev => {
      const next = prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag];
      return next as ContactTag[];
    });
  };

  return (
    <div className="flex flex-col gap-3 mt-1">
      <div className={fieldBoxClass}>
        <Building size={14} className={fieldIconClass} />
        <input
          type="text"
          placeholder={t('contacts.companyPlaceholder', 'Company')}
          value={company}
          onChange={e => setCompany(e.target.value)}
          className={fieldInputClass}
        />
      </div>

      <div className={fieldBoxClass}>
        <User size={14} className={fieldIconClass} />
        <input
          type="text"
          placeholder={t('contacts.positionPlaceholder', 'Position (e.g. CEO, Manager)')}
          value={position}
          onChange={e => setPosition(e.target.value)}
          className={fieldInputClass}
        />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTags(!showTags)}
          className={`${fieldBoxClass} cursor-pointer text-left`}
          aria-expanded={showTags}
        >
          <Tag size={14} className={fieldIconClass} />
          <span className={`flex-1 truncate text-[13px] ${tags.length > 0 ? 'text-input-text' : 'text-input-placeholder'}`}>
            {tags.length > 0 ? tags.map(tg => t(`contacts.crmTag${capitalize(tg)}`)).join(', ') : t('contacts.addTags', 'Add tags...')}
          </span>
        </button>
        {showTags && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 p-2 rounded-2xl bg-popover border border-border shadow-2xl">
            <div className="grid grid-cols-2 gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-[10px] font-medium px-2 py-1.5 rounded-lg transition-colors ${
                    tags.includes(tag as ContactTag) ? getTagColor(tag) : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t(`contacts.crmTag${capitalize(tag)}`)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface ContactCustomFieldProps {
  isDark: boolean;
  field: ContactField;
  updateField: (fid: string, updates: Partial<ContactField>) => void;
  removeField: (fid: string) => void;
  t: (key: string, fallback?: string) => string;
}

const fieldControlClass =
  'w-full h-8 rounded-xl text-xs outline-none px-2 bg-input-bg text-input-text transition-colors';

export const ContactCustomField = ({ field, updateField, removeField, t }: ContactCustomFieldProps) => {
  const typeDefaults: Record<string, string> = {
    phone: t('contacts.fieldTypePhone'),
    email: t('contacts.fieldTypeEmail'),
    telegram: t('contacts.fieldTypeTelegram'),
    custom: field.label || '',
  };

  return (
    <div className="p-3 rounded-xl flex flex-col gap-2 bg-input-bg border border-border">
      <div className="flex items-center gap-2">
        <select
          value={field.type}
          onChange={(e) => {
            const newType = e.target.value as FieldType;
            updateField(field.id, { type: newType, label: typeDefaults[newType] || '' });
          }}
          className={fieldControlClass}
        >
          <option value="phone">{t('contacts.fieldTypePhone')}</option>
          <option value="email">{t('contacts.fieldTypeEmail')}</option>
          <option value="telegram">{t('contacts.fieldTypeTelegram')}</option>
          <option value="custom">{t('contacts.fieldTypeCustom')}</option>
        </select>
        <button
          type="button"
          onClick={() => removeField(field.id)}
          className="min-w-[36px] min-h-[36px] shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-destructive/10 text-destructive"
          title={t('contacts.removeField', 'Remove field')}
          aria-label={t('contacts.removeField', 'Remove field')}
        >
          <Trash2 size={14} />
        </button>
      </div>
      {field.type === 'phone' && (
        <select
          value={field.phoneSubtype || 'mobile'}
          onChange={(e) => updateField(field.id, { phoneSubtype: e.target.value as PhoneSubtype })}
          className={fieldControlClass}
        >
          <option value="mobile">{t('contacts.fieldSubtypeMobile')}</option>
          <option value="work">{t('contacts.fieldSubtypeWork')}</option>
          <option value="home">{t('contacts.fieldSubtypeHome')}</option>
          <option value="main">{t('contacts.fieldSubtypeMain')}</option>
        </select>
      )}
      {field.type === 'custom' && (
        <div className="relative">
          <Plus size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder={t('contacts.fieldLabelPlaceholder', 'Label')}
            value={field.label}
            onChange={(e) => updateField(field.id, { label: e.target.value })}
            className={`${fieldControlClass} pl-8`}
          />
        </div>
      )}
      <input
        type="text"
        placeholder={field.type === 'phone' ? '+7 999 123-45-67' : field.type === 'email' ? 'user@example.com' : field.type === 'telegram' ? '@username' : 'Value'}
        value={field.value}
        onChange={(e) => updateField(field.id, { value: e.target.value })}
        className={fieldControlClass}
      />
    </div>
  );
};
