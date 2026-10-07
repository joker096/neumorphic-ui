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
import { ACCOUNT_COLORS, DEFAULT_AVATAR_COLOR, FREE_ACCOUNTS_LIMIT } from '../../constants/settingsConstants';

export type FieldVisibility = 'everyone' | 'contactsOnly';

export interface ProfileField {
  id: string;
  type: 'phone' | 'email' | 'telegram' | 'whatsapp' | 'signal' | 'signalv2v' | 'username' | 'link' | 'custom';
  value: string;
  label: string;
  visibility: FieldVisibility;
}

interface Account {
  id: number;
  name: string;
  color: string;
  username?: string;
  bio?: string;
}

interface ProfileSectionProps {
  isDark?: boolean;
  onBack: () => void;
  t: (key: string, options?: any) => string;
  onOpenPremium?: () => void;
}

export const ProfileSection = ({ isDark = false, onBack, t, onOpenPremium }: ProfileSectionProps) => {
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const premium = useAppStore((s) => s.premiumEntitlement.premium);

  const [accounts, setAccounts] = useLocalStorage<Account[]>("app_accounts", [
    { id: 1, name: "Nexus Terminal", color: "from-blue-500 to-cyan-500" },
    { id: 2, name: "Work Node", color: "from-purple-500 to-indigo-500" },
  ]);

  const [activeId, setActiveId] = useState<number>(1);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editUsername, setEditUsername] = useState(userProfile.username || '');
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
    const sanitizedUsername = editUsername.replace(/^@/, '').trim();
    setUserProfile({
      name: editName,
      username: sanitizedUsername,
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
    setAccounts(accounts.map((acc) => (acc.id === activeId ? { ...acc, name: editName, username: sanitizedUsername, bio: editBio } : acc)));
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(userProfile.name);
    setEditUsername(userProfile.username || '');
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

const syncProfileToAccount = (acc: Account) => {
  setUserProfile({
    name: acc.name,
    username: acc.username || '',
    bio: acc.bio || '',
    avatarColor: acc.color,
  });
};

const handleAddAccount = (draft: { name: string; username?: string; bio?: string }) => {
  const color = ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length];
  const newAcc: Account = { id: Date.now(), name: draft.name, color, username: draft.username, bio: draft.bio };
  setAccounts([...accounts, newAcc]);
  setActiveId(newAcc.id);
  syncProfileToAccount(newAcc);
};

const handleDeleteAccount = (id: number) => {
  const remaining = accounts.filter((acc) => acc.id !== id);
  setAccounts(remaining);
  if (activeId === id && remaining.length > 0) {
    const next = remaining[0];
    setActiveId(next.id);
    syncProfileToAccount(next);
  }
};

const handleUpdateAccount = (id: number, partial: Partial<Account>) => {
  setAccounts(accounts.map((acc) => (acc.id === id ? { ...acc, ...partial } : acc)));
};

const handleSelectAccount = (id: number) => {
  setActiveId(id);
  const acc = accounts.find((a) => a.id === id);
  if (acc) syncProfileToAccount(acc);
};

  const handleRestoreIdentity = () => {
    window.dispatchEvent(new CustomEvent('show-login'));
    setShowShareId(false);
  };

  return (
    <SettingsSection title={t('settings.profile', 'Profile & Accounts')} onBack={onBack} ariaLabel={t('common.back')}>
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
            editUsername={editUsername}
            editBio={editBio}
            editAvatar={editAvatar}
            editStatus={editStatus}
            editColor={editColor}
            editFields={editFields}
            newFieldVisibility={newFieldVisibility}
            setEditName={setEditName}
            setEditUsername={setEditUsername}
            setEditBio={setEditBio}
            setEditAvatar={setEditAvatar}
            setEditStatus={setEditStatus}
            setEditColor={setEditColor}
            setNewFieldVisibility={setNewFieldVisibility}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
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
              onSelect={handleSelectAccount}
              onAddAccount={handleAddAccount}
              onUpdateAccount={handleUpdateAccount}
              onDelete={handleDeleteAccount}
              canAdd={premium || accounts.length < FREE_ACCOUNTS_LIMIT}
              onGetPremium={onOpenPremium}
            />

            <div className={`rounded-xl overflow-hidden mt-4 ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
              <div className="p-4">
                <button
                  onClick={handleRestoreIdentity}
                  aria-label={t('settings.restoreIdentity', 'Restore Identity')}
                  title={t('settings.restoreIdentity', 'Restore Identity')}
                  className={`min-h-11 px-3 flex items-center justify-center gap-2 rounded-2xl cursor-pointer transition-colors text-[var(--accent)] hover:bg-[var(--accent-soft)]`}
                >
                  <RotateCcw size={18} />
                  <span className="text-sm font-medium">{t('settings.restoreIdentity', 'Restore Identity')}</span>
                </button>
                <p className={`text-xs mt-2 px-1 ${isDark ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)]"}`}>{t('settings.restoreIdentityDescription', 'Restore identity using your 24-word recovery phrase')}</p>
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
