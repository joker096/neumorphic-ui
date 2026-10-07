import React from 'react';
import { Trash2, Plus } from 'lucide-react';
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
        <span className="text-xs font-semibold text-[var(--text-secondary)]">{t('settings.contactFields', 'Contact Fields')}</span>
        <button
          type="button"
          onClick={onAdd}
          aria-label={t('settings.addField', 'Add Field')}
          title={t('settings.addField', 'Add Field')}
          className="w-9 h-9 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--ink-on-saturate)] transition-colors"
        >
          <Plus size={16} />
          <span className="sr-only">{t('settings.addField', 'Add Field')}</span>
        </button>
      </div>

      <select
        aria-label={t('settings.fieldVisibility', 'Visibility')}
        value={newFieldVisibility}
        onChange={(e) => onVisibilityChange(e.target.value as FieldVisibility)}
         className="w-full min-h-11 rounded-lg text-xs outline-none px-3 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
      >
        {VISIBILITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.fallback)}</option>
        ))}
      </select>

      {fields.map((field) => (
        <div key={field.id} className="p-3 rounded-lg flex flex-col gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <select
              aria-label={t('settings.fieldTypeLabel', 'Type')}
              value={field.type}
              onChange={(e) => onUpdate(field.id, { type: e.target.value as ProfileField['type'] })}
              className="min-h-11 rounded-lg text-xs outline-none px-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
            >
              {PROFILE_FIELD_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.label)}</option>
              ))}
            </select>
            <select
              aria-label={t('settings.fieldVisibility', 'Visibility')}
              value={field.visibility}
              onChange={(e) => onUpdate(field.id, { visibility: e.target.value as FieldVisibility })}
              className="min-h-11 rounded-lg text-xs outline-none px-2 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
            >
              {VISIBILITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.fallback)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRemove(field.id)}
              className="w-9 h-9 min-w-11 min-h-11 shrink-0 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label={t('settings.removeField', 'Remove field')}
              title={t('settings.removeField', 'Remove field')}
            >
              <Trash2 size={16} />
            </button>
          </div>
          {field.type === 'custom' && (
            <input
              aria-label={t('settings.customLabelPlaceholder', 'Label')}
              type="text"
              placeholder={t('settings.customLabelPlaceholder', 'Label')}
              value={field.label}
              onChange={(e) => onUpdate(field.id, { label: e.target.value })}
              className="w-full min-h-11 rounded-lg text-xs outline-none px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
            />
          )}
          <input
            aria-label={t('settings.genericValuePlaceholder', 'Value')}
            type="text"
            placeholder={
              field.type === 'phone' ? t('settings.phonePlaceholder', '+7 999 123-45-67') :
              field.type === 'email' ? t('settings.emailPlaceholder', 'user@example.com') :
              field.type === 'telegram' ? t('settings.telegramPlaceholder', '@username') :
              field.type === 'whatsapp' ? t('settings.whatsappPlaceholder', '+1 999 123-4567') :
              (field.type === 'signal' || field.type === 'signalv2v') ? t('settings.signalPlaceholder', 'Signal V2V ID') :
              field.type === 'username' ? t('settings.usernamePlaceholder', '@username') :
              field.type === 'link' ? t('settings.linkPlaceholder', 'https://') :
              t('settings.genericValuePlaceholder', 'Value')
            }
            value={field.value}
            onChange={(e) => onUpdate(field.id, { value: e.target.value })}
            className="w-full min-h-11 rounded-lg text-xs outline-none px-3 bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)]"
          />
        </div>
      ))}
      {fields.length === 0 && (
        <div className="text-xs text-center py-3 text-[var(--text-tertiary)]">
          {t('settings.noFields', 'No fields yet. Add phone, email, etc.')}
        </div>
      )}
    </div>
  );
};
