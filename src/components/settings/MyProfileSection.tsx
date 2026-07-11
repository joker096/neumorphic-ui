import React, { useState } from 'react';
import { Camera, Edit, Trash2, X, Check, User, Phone, Mail, MessageSquare, Send, Shield, AtSign } from 'lucide-react';
import { motion } from 'motion/react';
import { SettingsSection } from './SettingsSection';
import { SettingsGroup, SettingsSectionTitle, SettingsRow } from '../ui/SettingsRow';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';

interface MyProfileSectionProps {
  onBack: () => void;
  t: (key: string, options?: any) => string;
}

type FieldVisibility = 'everyone' | 'contactsOnly';

interface ProfileField {
  id: string;
  type: 'phone' | 'email' | 'telegram' | 'whatsapp' | 'signal' | 'signalv2v' | 'username' | 'custom';
  value: string;
  label: string;
  visibility: FieldVisibility;
}

const AVATAR_COLORS = [
  "from-orange-400 to-red-500",
  "from-blue-400 to-indigo-500",
  "from-green-400 to-emerald-500",
  "from-purple-400 to-pink-500",
  "from-cyan-400 to-blue-500",
  "from-yellow-400 to-orange-500",
];

export const MyProfileSection = ({ onBack, t }: MyProfileSectionProps) => {
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar || '');
  const [editFields, setEditFields] = useState<ProfileField[]>(userProfile.fields as unknown as ProfileField[] || []);
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [newFieldVisibility, setNewFieldVisibility] = useState<FieldVisibility>('everyone');

  const handleSave = () => {
    setUserProfile({
      name: editName,
      bio: editBio,
      avatar: editAvatar,
      fields: editFields.map(f => ({
        type: f.type as any,
        value: f.value,
        label: f.label,
        visibleTo: f.visibility,
      })),
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(userProfile.name);
    setEditBio(userProfile.bio || '');
    setEditAvatar(userProfile.avatar || '');
    setEditFields(userProfile.fields as unknown as ProfileField[] || []);
    setEditing(false);
  };

  const addField = () => {
    setEditFields([...editFields, {
      id: `field_${Date.now()}`,
      type: 'custom',
      value: '',
      label: '',
      visibility: newFieldVisibility,
    }]);
  };

  const removeField = (id: string) => {
    setEditFields(editFields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<ProfileField>) => {
    setEditFields(editFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const getAvatarGradient = () => {
    return editAvatar ? '' : editColor;
  };

return (
    <SettingsSection title={t('settings.myProfile', 'My Profile')} onBack={onBack}>
      {/* Profile Preview (always visible) */}
      {!editing && (
        <div className="w-full rounded-xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-color)]">
          {/* Header gradient */}
          <div className={`h-24 bg-gradient-to-br ${userProfile.avatar ? '' : 'from-orange-400 to-red-500'}`}>
           {userProfile.avatar && (
              <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            )}
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-8 relative">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-[var(--bg-primary)] bg-gradient-to-br bg-[var(--accent)]">
              {userProfile.avatar ? (
                 <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" loading="lazy" decoding="async" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">{(userProfile.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="pt-8 pb-4 px-4 text-center">
            <h3 className="text-xl font-bold text-[var(--text-primary)]">{userProfile.name || t('settings.defaultUserName', 'User')}</h3>
            {userProfile.bio && <p className="text-xs mt-1 text-[var(--text-secondary)]">{userProfile.bio}</p>}

            {/* Fields */}
            {userProfile.fields && (userProfile.fields as any[]).length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {(userProfile.fields as any[]).map((field: any) => (
                  <div key={field.id || field.value} className="flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--bg-secondary)]">
                    <span className="text-xs text-[var(--text-secondary)]">
                    {(() => {
                      if (field.type === 'phone') return <Phone size={10} className="inline mr-1" />;
                      if (field.type === 'email') return <Mail size={10} className="inline mr-1" />;
                      if (field.type === 'telegram') return <MessageSquare size={10} className="inline mr-1" />;
                      if (field.type === 'whatsapp') return <Send size={10} className="inline mr-1" />;
                      if (field.type === 'signal' || field.type === 'signalv2v') return <Shield size={10} className="inline mr-1" />;
                      if (field.type === 'username') return <AtSign size={10} className="inline mr-1" />;
                      return null;
                    })()}
                    {field.label || field.type}
                  </span>
                    {field.visibility !== 'everyone' && (
                      <span className="text-[9px] px-1 rounded bg-[var(--accent-soft)] text-[var(--accent)]">{t('settings.visibilityContacts', 'Contacts only')}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setEditing(true)}
            className="mx-auto mb-4 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          >
            <Edit size={14} />
            {t('settings.editProfile', 'Edit Profile')}
          </button>
        </div>
      )}

      {/* Edit Form */}
      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="w-full flex flex-col gap-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <label className="relative cursor-pointer group">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[var(--bg-primary)] bg-gradient-to-br from-orange-400 to-red-500">
              {editAvatar ? (
                   <img src={editAvatar} alt="avatar" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                 ) : (
                   <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">{(editName || 'U').charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center bg-orange-500">
                <Camera size={14} className="text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => setEditAvatar(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.displayName', 'Display Name')}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t('settings.enterName', 'Enter your name')}
              className="w-full px-3 py-2 rounded-md text-sm outline-none border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.bio', 'Bio')}</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder={t('settings.bioPlaceholder', 'Tell others about yourself')}
              rows={3}
              className="w-full px-3 py-2 rounded-md text-sm outline-none border resize-none bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500"
            />
          </div>

          {/* Avatar color selection (when no custom avatar) */}
          {!editAvatar && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.avatarColor', 'Avatar Color')}</label>
              <div className="flex gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center ${editColor === color ? 'ring-2 ring-orange-500' : ''}`}
                  >
                    {editColor === color && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fields */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.contactFields', 'Contact Fields')}</span>
              <button
                type="button"
                onClick={addField}
                className="text-[10px] font-bold px-2 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-orange-600 hover:text-white"
              >
                {t('settings.addField', 'Add Field')}
              </button>
            </div>

            {/* Visibility selector for new fields */}
              <select
                  value={newFieldVisibility}
                  onChange={(e) => setNewFieldVisibility(e.target.value as FieldVisibility)}
                  className="w-full h-8 rounded-md text-xs outline-none px-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
                >
                  <option value="everyone">{t('settings.visibilityEveryone', 'Visible to everyone')}</option>
                  <option value="contactsOnly">{t('settings.visibilityContacts', 'Contacts only')}</option>
                </select>

            {editFields.map((field) => (
              <div key={field.id} className="p-3 rounded-md flex flex-col gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <select
                    value={field.visibility}
                    onChange={(e) => updateField(field.id, { visibility: e.target.value as FieldVisibility })}
                    className="h-8 rounded-md text-xs outline-none px-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
                  >
                    <option value="everyone">{t('settings.visibilityEveryone', 'Visible to everyone')}</option>
                    <option value="contactsOnly">{t('settings.visibilityContacts', 'Contacts only')}</option>
                  </select>

                    <select
                       value={field.type}
                       onChange={(e) => updateField(field.id, { type: e.target.value as any })}
                       className="flex-1 h-8 rounded-md text-xs outline-none px-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
                     >
                       <option value="phone">{t('settings.fieldTypePhone', 'Phone')}</option>
                       <option value="email">{t('settings.fieldTypeEmail', 'Email')}</option>
                       <option value="telegram">{t('settings.fieldTypeTelegram', 'Telegram')}</option>
                       <option value="whatsapp">{t('settings.fieldTypeWhatsApp', 'WhatsApp')}</option>
                       <option value="signal">{t('settings.fieldTypeSignal', 'Signal')}</option>
                       <option value="signalv2v">{t('settings.fieldTypeSignalV2V', 'Signal V2V')}</option>
                       <option value="username">{t('settings.fieldTypeUsername', 'Username')}</option>
                       <option value="custom">{t('settings.fieldTypeCustom', 'Custom')}</option>
                     </select>
                  <select
                     value={field.visibility}
                     onChange={(e) => updateField(field.id, { visibility: e.target.value as FieldVisibility })}
                     className="h-8 rounded-md text-xs outline-none px-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
                   >
                     <option value="everyone">{t('settings.visibilityEveryone', 'Visible to everyone')}</option>
                     <option value="contactsOnly">{t('settings.visibilityContacts', 'Contacts only')}</option>
                   </select>
                  <button
                    type="button"
                     onClick={() => removeField(field.id)}
                     className="w-8 h-8 rounded-full flex items-center justify-center text-red-600 hover:bg-red-100 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
               {field.type === 'custom' && (
                  <input
                    type="text"
                    placeholder={t('settings.customLabelPlaceholder', 'Label')}
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="w-full h-8 rounded-md text-xs outline-none px-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
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
                  onChange={(e) => updateField(field.id, { value: e.target.value })}
                  className="w-full h-8 rounded-md text-xs outline-none px-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]"
                />
              </div>
            ))}
            {editFields.length === 0 && (
              <div className="text-[10px] text-center py-2 text-[var(--text-tertiary)]">
                {t('settings.noFields', 'No fields yet. Add phone, email, etc.')}
              </div>
            )}
          </div>

          {/* Save/Cancel */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 h-12 rounded-md font-bold flex items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              <X size={18} />
              {t('settings.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-md font-bold flex items-center justify-center gap-2 bg-orange-500 text-white hover:bg-orange-600 active:scale-95 shadow-lg shadow-orange-500/20"
            >
              <Check size={18} />
              {t('settings.saveProfile', 'Save Profile')}
            </button>
          </div>
        </form>
      )}
    </SettingsSection>
  );
};
