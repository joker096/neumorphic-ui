import React, { RefObject } from 'react';
import { Camera, X, Check } from 'lucide-react';
import { AVATAR_COLORS } from '../../constants/settingsConstants';
import { ProfileFieldEditor } from './ProfileFieldEditor';
import type { ProfileField, FieldVisibility } from './ProfileSection';

interface ProfileEditFormProps {
  isDark: boolean;
  t: (key: string, fallback?: string) => string;
  editName: string;
  editUsername: string;
  editBio: string;
  editAvatar: string;
  editStatus: string;
  editColor: string;
  editFields: ProfileField[];
  newFieldVisibility: FieldVisibility;
  setEditName: (v: string) => void;
  setEditUsername: (v: string) => void;
  setEditBio: (v: string) => void;
  setEditAvatar: (v: string) => void;
  setEditStatus: (v: string) => void;
  setEditColor: (v: string) => void;
  setNewFieldVisibility: (v: FieldVisibility) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddField: () => void;
  onRemoveField: (id: string) => void;
  onUpdateField: (id: string, updates: Partial<ProfileField>) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const ProfileEditForm = ({
  isDark, t, editName, editUsername, editBio, editAvatar, editStatus, editColor, editFields,
  newFieldVisibility, setEditName, setEditUsername, setEditBio, setEditAvatar, setEditStatus, setEditColor,
  setNewFieldVisibility, fileInputRef, onFileChange, onAddField,
  onRemoveField, onUpdateField, onCancel, onSave,
}: ProfileEditFormProps) => {
  const initial = (editName || 'U').charAt(0).toUpperCase() || 'U';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="w-full flex flex-col gap-5 p-4">
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
                <span className="text-[var(--text-primary)] text-[40px] font-bold">{initial}</span>
              </div>
            )}
          </div>
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center bg-[var(--accent)] shadow-md">
            <Camera size={16} className="text-[var(--text-primary)]" />
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
        <p className="text-xs text-[var(--text-tertiary)] text-center">
          {t('settings.profilePhotoSubtitle', 'Tap to upload or change your photo')}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('settings.displayName', 'Display Name')}</label>
        <input
          aria-label={t('settings.enterName', 'Enter your name')}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          placeholder={t('settings.enterName', 'Enter your name')}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('settings.username', 'Username')}</label>
        <input
          aria-label={t('settings.usernamePlaceholder', '@username')}
          type="text"
          value={editUsername}
          onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9._]/g, '').slice(0, 32))}
          placeholder={t('settings.usernamePlaceholder', '@username')}
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('settings.status', 'Status')}</label>
        <input
          aria-label={t('settings.statusPlaceholder', "What's on your mind?")}
          type="text"
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value)}
          placeholder={t('settings.statusPlaceholder', "What's on your mind?")}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
        />
        <p className="text-xs text-[var(--text-tertiary)]">
          {t('settings.statusSubtitle', "Let others know what you're up to")}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('settings.bio', 'Bio')}</label>
        <textarea
          aria-label={t('settings.bioPlaceholder', 'Tell others about yourself')}
          value={editBio}
          onChange={(e) => setEditBio(e.target.value)}
          placeholder={t('settings.bioPlaceholder', 'Tell others about yourself')}
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
        />
      </div>

      {!editAvatar && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[var(--text-secondary)]">{t('settings.avatarColor', 'Avatar Color')}</label>
          <div className="flex gap-2 flex-wrap">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setEditColor(color)}
                className={`w-10 h-10 min-w-11 min-h-11 rounded-full bg-gradient-to-br ${color} flex items-center justify-center transition-all ${editColor === color ? 'ring-2 ring-orange-500 ring-offset-2 scale-110' : 'opacity-70 hover:opacity-100'}`}
              >
                {editColor === color && <Check size={14} className="text-[var(--text-primary)]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <ProfileFieldEditor
        fields={editFields}
        onAdd={onAddField}
        onRemove={onRemoveField}
        onUpdate={onUpdateField}
        newFieldVisibility={newFieldVisibility}
        onVisibilityChange={setNewFieldVisibility}
        t={t}
      />

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={onCancel}
          aria-label={t('settings.cancel', 'Cancel')}
          title={t('settings.cancel', 'Cancel')}
          className="flex-1 min-h-11 rounded-lg font-bold flex items-center justify-center gap-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] active:scale-[0.98] transition-all"
        >
          <X size={18} aria-hidden="true" />
          <span>{t('settings.cancel', 'Cancel')}</span>
        </button>
        <button
          type="submit"
          aria-label={t('settings.saveProfile', 'Save Profile')}
          title={t('settings.saveProfile', 'Save Profile')}
          className="flex-1 min-h-11 rounded-lg font-bold flex items-center justify-center gap-2 bg-[var(--accent)] text-[var(--text-primary)] hover:brightness-110 active:scale-[0.98] shadow-lg transition-all"
        >
          <Check size={18} aria-hidden="true" />
          <span>{t('settings.saveProfile', 'Save Profile')}</span>
        </button>
      </div>
    </form>
  );
};
