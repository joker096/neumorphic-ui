import React, { useState, useRef } from 'react';
import { Camera, Trash2, X, Check, Upload } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { ProfilePreview } from './ProfilePreview';
import { ProfileFieldEditor } from './ProfileFieldEditor';

interface MyProfileSectionProps {
  onBack: () => void;
  t: (key: string, options?: any) => string;
}

export type FieldVisibility = 'everyone' | 'contactsOnly';

export interface ProfileField {
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
  const [editStatus, setEditStatus] = useState(userProfile.status || '');
  const [editFields, setEditFields] = useState<ProfileField[]>(userProfile.fields as unknown as ProfileField[] || []);
  const [editColor, setEditColor] = useState(AVATAR_COLORS[0]);
  const [newFieldVisibility, setNewFieldVisibility] = useState<FieldVisibility>('everyone');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setUserProfile({
      name: editName,
      bio: editBio,
      avatar: editAvatar,
      status: editStatus,
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
    setEditStatus(userProfile.status || '');
    setEditFields(userProfile.fields as unknown as ProfileField[] || []);
    setEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setEditAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setEditAvatar('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  return (
    <SettingsSection title={t('settings.myProfile', 'My Profile')} onBack={onBack}>
      {!editing && (
        <div className="w-full">
          <ProfilePreview userProfile={userProfile} t={t} onEdit={() => setEditing(true)} />
        </div>
      )}

      {editing && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="w-full flex flex-col gap-5">
          <div className="w-full flex flex-col items-center gap-3">
            <div
              className="relative cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[var(--bg-primary)] shadow-lg">
                {editAvatar ? (
                  <img src={editAvatar} alt="" role="presentation" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${editColor} flex items-center justify-center`}>
                    <span className="text-[var(--text-primary)] text-4xl font-bold">{(editName || 'U').charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center bg-orange-500 shadow-md">
                <Camera size={16} className="text-[var(--text-primary)]" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-orange-600 hover:text-[var(--text-primary)] transition-colors"
              >
                <Upload size={14} />
                {editAvatar ? t('settings.changePhoto', 'Change Photo') : t('settings.uploadPhoto', 'Upload Photo')}
              </button>
              {editAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={14} />
                  {t('settings.removePhoto', 'Remove Photo')}
                </button>
              )}
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] text-center">
              {t('settings.profilePhotoSubtitle', 'Tap to upload or change your photo')}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.displayName', 'Display Name')}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t('settings.enterName', 'Enter your name')}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.status', 'Status')}</label>
            <input
              type="text"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              placeholder={t('settings.statusPlaceholder', "What's on your mind?")}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500 transition-colors"
            />
            <p className="text-[10px] text-[var(--text-tertiary)]">
              {t('settings.statusSubtitle', "Let others know what you're up to")}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.bio', 'Bio')}</label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder={t('settings.bioPlaceholder', 'Tell others about yourself')}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none border resize-none bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] focus:border-orange-500 transition-colors"
            />
          </div>

          {!editAvatar && (
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.avatarColor', 'Avatar Color')}</label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center transition-all ${editColor === color ? 'ring-2 ring-orange-500 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'}`}
                  >
                    {editColor === color && <Check size={14} className="text-[var(--text-primary)]" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ProfileFieldEditor
            fields={editFields}
            onAdd={addField}
            onRemove={removeField}
            onUpdate={updateField}
            newFieldVisibility={newFieldVisibility}
            onVisibilityChange={setNewFieldVisibility}
            t={t}
          />

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 h-12 rounded-lg font-bold flex items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.98] transition-all"
            >
              <X size={18} />
              {t('settings.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-lg font-bold flex items-center justify-center gap-2 bg-orange-500 text-[var(--text-primary)] hover:bg-orange-600 active:scale-[0.98] shadow-lg shadow-orange-500/20 transition-all"
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
