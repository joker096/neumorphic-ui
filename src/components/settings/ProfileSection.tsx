import React, { useState, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { SettingsSection } from './SettingsSection';
import { ProfileHeaderCard } from './ProfileHeaderCard';
import { ProfileEditForm } from './ProfileEditForm';
import { ProfileAccounts } from './ProfileAccounts';
import { ShareIdentityModal } from './ShareIdentityModal';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { AnimatePresence } from 'motion/react';
import { ACCOUNT_COLORS, DEFAULT_AVATAR_COLOR } from '../../constants/settingsConstants';

export type FieldVisibility = 'everyone' | 'contactsOnly';

export interface ProfileField {
  id: string;
  type: 'phone' | 'email' | 'telegram' | 'whatsapp' | 'signal' | 'signalv2v' | 'username' | 'custom';
  value: string;
  label: string;
  visibility: FieldVisibility;
}

interface Account {
  id: number;
  name: string;
  color: string;
}

interface ProfileSectionProps {
  isDark?: boolean;
  onBack: () => void;
  t: (key: string, options?: any) => string;
}

export const ProfileSection = ({ isDark = false, onBack, t }: ProfileSectionProps) => {
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);

  const [accounts, setAccounts] = useLocalStorage<Account[]>("app_accounts", [
    { id: 1, name: "Nexus Terminal", color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Work Node", color: "from-purple-500 to-indigo-500" },
  ]);

  const [activeId, setActiveId] = useState<number>(1);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editBio, setEditBio] = useState(userProfile.bio || '');
  const [editAvatar, setEditAvatar] = useState(userProfile.avatar || '');
  const [editStatus, setEditStatus] = useState(userProfile.status || '');
  const [editFields, setEditFields] = useState<ProfileField[]>(
    (userProfile.fields as unknown as ProfileField[]) ?? [],
  );
  const [editColor, setEditColor] = useState<string>(userProfile.avatarColor || DEFAULT_AVATAR_COLOR);
  const [newFieldVisibility, setNewFieldVisibility] = useState<FieldVisibility>('everyone');
  const [showShareId, setShowShareId] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStartEditing = () => {
    setEditColor(userProfile.avatarColor || DEFAULT_AVATAR_COLOR);
    setEditing(true);
    requestAnimationFrame(() => {
      const el = profileCardRef.current;
      if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const handleSave = () => {
    setUserProfile({
      name: editName,
      bio: editBio,
      avatar: editAvatar,
      status: editStatus,
      avatarColor: editColor,
      fields: editFields.map((f) => ({
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
    setEditFields((userProfile.fields as unknown as ProfileField[]) ?? []);
    setEditColor(userProfile.avatarColor || DEFAULT_AVATAR_COLOR);
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
    setEditFields(editFields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<ProfileField>) => {
    setEditFields(editFields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const handleAddAccount = (name: string) => {
    const color = ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length];
    const newAcc: Account = { id: Date.now(), name, color };
    setAccounts([...accounts, newAcc]);
    setActiveId(newAcc.id);
  };

  const handleDeleteAccount = (id: number) => {
    const remaining = accounts.filter((acc) => acc.id !== id);
    setAccounts(remaining);
    if (activeId === id && remaining.length > 0) {
      setActiveId(remaining[0].id);
    }
  };

  const handleRestoreIdentity = () => {
    window.dispatchEvent(new CustomEvent('show-login'));
    setShowShareId(false);
  };

  return (
    <SettingsSection title={t('settings.profile', 'Profile & Accounts')} onBack={onBack}>
      <div ref={profileCardRef} className="w-full">
        {!editing ? (
          <ProfileHeaderCard
            isDark={isDark}
            userProfile={userProfile}
            t={t}
            onEdit={handleStartEditing}
            onShare={() => setShowShareId(true)}
          />
        ) : (
          <ProfileEditForm
            isDark={isDark}
            t={t}
            editName={editName}
            editBio={editBio}
            editAvatar={editAvatar}
            editStatus={editStatus}
            editColor={editColor}
            editFields={editFields}
            newFieldVisibility={newFieldVisibility}
            setEditName={setEditName}
            setEditBio={setEditBio}
            setEditAvatar={setEditAvatar}
            setEditStatus={setEditStatus}
            setEditColor={setEditColor}
            setNewFieldVisibility={setNewFieldVisibility}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onRemoveAvatar={handleRemoveAvatar}
            onAddField={addField}
            onRemoveField={removeField}
            onUpdateField={updateField}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        )}

        {!editing && (
          <>
            <ProfileAccounts
              isDark={isDark}
              t={t}
              accounts={accounts}
              activeId={activeId}
              onSelect={setActiveId}
              onAddAccount={handleAddAccount}
              onDelete={handleDeleteAccount}
            />

            <div className={`rounded-xl overflow-hidden mt-4 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
              <div className="p-4">
                <button
                  onClick={handleRestoreIdentity}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors min-h-[44px] ${isDark ? "hover:bg-[var(--hover-bg-dark)] text-orange-400" : "hover:bg-slate-100 text-orange-600"}`}
                >
                  <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${isDark ? "bg-orange-500/10" : "bg-orange-500/10"}`}>
                    <RotateCcw size={20} />
                  </div>
                  <span className="text-sm font-bold">{t('settings.restoreIdentity', 'Restore Identity')}</span>
                </button>
                <p className={`text-xs mt-2 px-1 ${isDark ? "text-gray-500" : "text-slate-400"}`}>{t('settings.restoreIdentityDescription', 'Restore your identity from a backup or another device')}</p>
              </div>
            </div>
          </>
        )}

        <AnimatePresence>
          {showShareId && (
            <ShareIdentityModal isDark={isDark} t={t} onClose={() => setShowShareId(false)} />
          )}
        </AnimatePresence>
      </div>
    </SettingsSection>
  );
};
