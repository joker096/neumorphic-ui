import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ProfileField, FieldVisibility } from './ProfileSection';
import { PROFILE_FIELD_TYPES, VISIBILITY_OPTIONS } from '../../constants/settingsConstants';

interface ProfileFieldEditorProps {
  fields: ProfileField[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ProfileField>) => void;
  newFieldVisibility: FieldVisibility;
  onVisibilityChange: (v: FieldVisibility) => void;
  t: (key: string, fallback?: string) => string;
}

export const ProfileFieldEditor = ({ fields, onAdd, onRemove, onUpdate, newFieldVisibility, onVisibilityChange, t }: ProfileFieldEditorProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.contactFields', 'Contact Fields')}</span>
        <button
          type="button"
          onClick={onAdd}
          className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-orange-600 hover:text-[var(--text-primary)] transition-colors"
        >
          {t('settings.addField', 'Add Field')}
        </button>
      </div>

      <select
        value={newFieldVisibility}
        onChange={(e) => onVisibilityChange(e.target.value as FieldVisibility)}
        className="w-full h-9 rounded-lg text-xs outline-none px-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
      >
        {VISIBILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.fallback)}</option>
        ))}
      </select>

      {fields.map((field) => (
        <div key={field.id} className="p-3 rounded-lg flex flex-col gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <select
              value={field.type}
              onChange={(e) => onUpdate(field.id, { type: e.target.value as ProfileField['type'] })}
              className="h-9 rounded-lg text-xs outline-none px-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
            >
              {PROFILE_FIELD_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.label)}</option>
              ))}
            </select>
            <select
              value={field.visibility}
              onChange={(e) => onUpdate(field.id, { visibility: e.target.value as FieldVisibility })}
              className="h-9 rounded-lg text-xs outline-none px-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.fallback)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRemove(field.id)}
              className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label={t('settings.removeField', 'Remove field')}
              title={t('settings.removeField', 'Remove field')}
            >
              <Trash2 size={16} />
            </button>
          </div>
          {field.type === 'custom' && (
            <input
              type="text"
              placeholder={t('settings.customLabelPlaceholder', 'Label')}
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              className="w-full h-9 rounded-lg text-xs outline-none px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
            />
          )}
          <input
            type="text"
            placeholder={
              field.type === 'phone' ? t('settings.phonePlaceholder', '+7 999 123-45-67') :
              field.type === 'email' ? t('settings.emailPlaceholder', 'user@example.com') :
              field.type === 'telegram' ? t('settings.telegramPlaceholder', '@username') :
              field.type === 'whatsapp' ? t('settings.whatsappPlaceholder', '+1 999 123-4567') :
              (field.type === 'signal' || field.type === 'signalv2v') ? t('settings.signalPlaceholder', 'Signal V2V ID') :
              field.type === 'username' ? t('settings.usernamePlaceholder', '@username') :
              t('settings.genericValuePlaceholder', 'Value')
            }
            value={field.value}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            className="w-full h-9 rounded-lg text-xs outline-none px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
          />
        </div>
      ))}
      {fields.length === 0 && (
        <div className="text-[10px] text-center py-3 text-[var(--text-tertiary)]">
          {t('settings.noFields', 'No fields yet. Add phone, email, etc.')}
        </div>
      )}
    </div>
  );
};
