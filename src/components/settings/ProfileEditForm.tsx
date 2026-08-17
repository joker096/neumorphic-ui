import React, { RefObject } from 'react';
import { Camera, Trash2, X, Check, Upload } from 'lucide-react';
import { AVATAR_COLORS } from '../../constants/settingsConstants';
import { ProfileFieldEditor } from './ProfileFieldEditor';
import type { ProfileField, FieldVisibility } from './ProfileSection';

interface ProfileEditFormProps {
  isDark: boolean;
  t: (key: string, fallback?: string) => string;
  editName: string;
  editBio: string;
  editAvatar: string;
  editStatus: string;
  editColor: string;
  editFields: ProfileField[];
  newFieldVisibility: FieldVisibility;
  setEditName: (v: string) => void;
  setEditBio: (v: string) => void;
  setEditAvatar: (v: string) => void;
  setEditStatus: (v: string) => void;
  setEditColor: (v: string) => void;
  setNewFieldVisibility: (v: FieldVisibility) => void;
  fileInputRef: RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onAddField: () => void;
  onRemoveField: (id: string) => void;
  onUpdateField: (id: string, updates: Partial<ProfileField>) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const ProfileEditForm = ({
  isDark, t, editName, editBio, editAvatar, editStatus, editColor, editFields,
  newFieldVisibility, setEditName, setEditBio, setEditAvatar, setEditStatus, setEditColor,
  setNewFieldVisibility, fileInputRef, onFileChange, onRemoveAvatar, onAddField,
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
                <span className="text-[var(--text-primary)] text-4xl font-bold">{initial}</span>
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
          onChange={onFileChange}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold min-h-[var(--control-height-sm)] bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-orange-600 hover:text-[var(--text-primary)] transition-colors"
          >
            <Upload size={14} />
            {editAvatar ? t('settings.changePhoto', 'Change Photo') : t('settings.uploadPhoto', 'Upload Photo')}
          </button>
          {editAvatar && (
            <button
              type="button"
              onClick={onRemoveAvatar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold min-h-[var(--control-height-sm)] bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
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
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-[var(--text-secondary)]">{t('settings.status', 'Status')}</label>
        <input
          type="text"
          value={editStatus}
          onChange={(e) => setEditStatus(e.target.value)}
          placeholder={t('settings.statusPlaceholder', "What's on your mind?")}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
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
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
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
  );
};
