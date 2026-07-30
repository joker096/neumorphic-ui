import { Edit, Mail, MessageSquare, Phone, Send, Shield, AtSign } from "lucide-react";

interface ProfilePreviewProps {
  userProfile: any;
  t: (key: string, options?: any) => string;
  onEdit: () => void;
}

export function ProfilePreview({ userProfile, t, onEdit }: ProfilePreviewProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border-color)]">
      <div className={`h-24 bg-gradient-to-br ${userProfile.avatar ? '' : 'from-orange-400 to-red-500'}`}>
        {userProfile.avatar && (
          <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" loading="lazy" decoding="async" />
        )}
      </div>
      <div className="flex justify-center -mt-8 relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-[var(--bg-primary)] bg-gradient-to-br bg-[var(--accent)]">
          {userProfile.avatar ? (
            <img src={userProfile.avatar} alt="avatar" className="w-full h-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <span className="text-[var(--text-primary)] text-2xl font-bold">{(userProfile.name || 'U').charAt(0).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
      <div className="pt-8 pb-4 px-4 text-center">
        <h3 className="text-xl font-bold text-[var(--text-primary)]">{userProfile.name || t('settings.defaultUserName', 'User')}</h3>
        {userProfile.bio && <p className="text-xs mt-1 text-[var(--text-secondary)]">{userProfile.bio}</p>}
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
        onClick={onEdit}
        className="mx-auto mb-4 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
      >
        <Edit size={14} />
        {t('settings.editProfile', 'Edit Profile')}
      </button>
    </div>
  );
}

