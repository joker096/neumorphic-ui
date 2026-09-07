import React from 'react';
import { Edit, Share2, Phone, Mail, MessageSquare, Send, Shield, AtSign, Link } from 'lucide-react';
import { DEFAULT_AVATAR_COLOR, PROFILE_FIELD_TYPES } from '../../constants/settingsConstants';
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
      return <Phone size={12} className="inline mr-1" />;
    case 'email':
      return <Mail size={12} className="inline mr-1" />;
    case 'telegram':
      return <MessageSquare size={12} className="inline mr-1" />;
    case 'whatsapp':
      return <Send size={12} className="inline mr-1" />;
    case 'signal':
    case 'signalv2v':
      return <Shield size={12} className="inline mr-1" />;
    case 'username':
      return <AtSign size={12} className="inline mr-1" />;
    case 'link':
      return <Link size={12} className="inline mr-1" />;
    default:
      return null;
  }
};

export const ProfileHeaderCard = ({ isDark, userProfile, t, onEdit, onShare }: ProfileHeaderCardProps) => {
  const avatarColor = userProfile.avatarColor || DEFAULT_AVATAR_COLOR;
  const initial = (userProfile.name || userProfile.username || 'U').charAt(0).toUpperCase();
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
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{userProfile.name || (userProfile.username ? `@${userProfile.username}` : t('settings.defaultUserName', 'User'))}</h3>
        {userProfile.username && userProfile.name && <p className="text-sm mt-0.5 font-medium text-[var(--accent)]">@{userProfile.username}</p>}
        {userProfile.bio && <p className="text-xs mt-1 text-[var(--text-secondary)]">{userProfile.bio}</p>}
        {userProfile.status && <p className="text-xs mt-1 text-[var(--text-tertiary)]">{userProfile.status}</p>}
        {fields.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {fields.map((field) => {
              const typeOption = PROFILE_FIELD_TYPES.find((o) => o.value === field.type);
              const displayLabel = field.label || (typeOption ? t(typeOption.labelKey, typeOption.label) : field.type);
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
                    <span className="text-xs px-1 rounded bg-[var(--accent-soft)] text-[var(--accent)]">{t('settings.visibility.contacts', 'Contacts only')}</span>
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
          aria-label={t('settings.editProfile', 'Edit Profile')}
          title={t('settings.editProfile', 'Edit Profile')}
          className="min-h-11 min-w-11 px-3 flex items-center justify-center gap-2 rounded-md transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        >
          <Edit size={14} />
          <span className="text-sm">{t('settings.editProfile', 'Edit Profile')}</span>
        </button>
        <button
          onClick={onShare}
          aria-label={t('settings.shareIdentity', 'Share Identity')}
          title={t('settings.shareIdentity', 'Share Identity')}
          className="min-h-11 min-w-11 px-3 flex items-center justify-center gap-2 rounded-md transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        >
          <Share2 size={16} />
          <span className="text-sm">{t('settings.shareIdentity', 'Share Identity')}</span>
        </button>
      </div>
    </div>
  );
};
