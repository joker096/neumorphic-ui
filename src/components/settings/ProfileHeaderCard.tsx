import React from 'react';
import { Edit, Share2, Phone, Mail, MessageSquare, Send, Shield, AtSign } from 'lucide-react';
import { DEFAULT_AVATAR_COLOR, getFieldTypeLabel } from '../../constants/settingsConstants';
import type { UserProfile } from '../../types/contact';

interface ProfileHeaderCardProps {
  isDark: boolean;
  userProfile: UserProfile;
  t: (key: string, fallback?: string) => string;
  onEdit: () => void;
  onShare: () => void;
}

const renderFieldIcon = (type: string) => {
  switch (type) {
    case 'phone':
      return <Phone size={10} className="inline mr-1" />;
    case 'email':
      return <Mail size={10} className="inline mr-1" />;
    case 'telegram':
      return <MessageSquare size={10} className="inline mr-1" />;
    case 'whatsapp':
      return <Send size={10} className="inline mr-1" />;
    case 'signal':
    case 'signalv2v':
      return <Shield size={10} className="inline mr-1" />;
    case 'username':
      return <AtSign size={10} className="inline mr-1" />;
    default:
      return null;
  }
};

export const ProfileHeaderCard = ({ isDark, userProfile, t, onEdit, onShare }: ProfileHeaderCardProps) => {
  const avatarColor = userProfile.avatarColor || DEFAULT_AVATAR_COLOR;
  const initial = (userProfile.name || 'U').charAt(0).toUpperCase();
  const fields = (userProfile.fields ?? []) as Array<{ id?: string; value: string; label?: string; type: string; visibleTo?: string }>;

  return (
    <div className={`w-full rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"}`}>
      <div className={`h-24 bg-gradient-to-br ${userProfile.avatar ? '' : 'from-orange-400 to-red-500'}`}>
        {userProfile.avatar && (
          <img src={userProfile.avatar} alt={userProfile.name ? `${userProfile.name} profile picture` : "Profile picture"} className="w-full h-full object-cover" loading="lazy" decoding="async" />
        )}
      </div>
      <div className="flex justify-center -mt-8 relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-[var(--bg-primary)]">
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt="" role="presentation" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${avatarColor} flex items-center justify-center`}>
              <span className="text-[var(--text-primary)] text-2xl font-bold">{initial}</span>
            </div>
          )}
        </div>
      </div>
      <div className="pt-8 pb-4 px-4 text-center">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{userProfile.name || t('settings.defaultUserName', 'User')}</h3>
        {userProfile.bio && <p className="text-xs mt-1 text-[var(--text-secondary)]">{userProfile.bio}</p>}
        {userProfile.status && <p className="text-xs mt-1 text-[var(--text-tertiary)]">{userProfile.status}</p>}
        {fields.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {fields.map((field) => {
              const typeLabel = getFieldTypeLabel(field.type);
              const displayLabel = field.label || t(`settings.fieldType${typeLabel}`, typeLabel);
              const isContactsOnly = field.visibleTo ? field.visibleTo !== 'everyone' : false;
              return (
                <div key={field.id || field.value} className="flex items-center gap-2 px-2 py-1 rounded-md bg-[var(--bg-secondary)]">
                  <span className="text-xs text-[var(--text-secondary)]">
                    {renderFieldIcon(field.type)}
                    {displayLabel}
                  </span>
                  {field.value && (
                    <span className="text-xs text-[var(--text-primary)] truncate">{field.value}</span>
                  )}
                  {isContactsOnly && (
                    <span className="text-[9px] px-1 rounded bg-[var(--accent-soft)] text-[var(--accent)]">{t('settings.visibility.contacts', 'Contacts only')}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex justify-center gap-2 pb-4">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium min-h-[44px] transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        >
          <Edit size={14} />
          {t('settings.editProfile', 'Edit Profile')}
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium min-h-[44px] transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        >
          <Share2 size={16} />
          {t('settings.shareIdentity', 'Share Identity')}
        </button>
      </div>
    </div>
  );
};
