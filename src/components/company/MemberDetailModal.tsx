import React, { useState } from 'react';
import { X, Trash2, ChevronDown, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyMember } from '../../lib/company/types';
import { useI18n } from '../../lib/i18n';
import { COMPANY_EDIT_FALLBACKS, COMPANY_MEMBER_FALLBACKS } from '../../constants/companyConstants';

const closeBtn = (onClick: () => void) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  >
    <X size={18} />
  </button>
);

type MemberDetailModalProps = {
  member: CompanyMember;
  isDark?: boolean;
  canManage: boolean;
  isCurrentUser: boolean;
  onClose: () => void;
  onSave: (displayName: string) => void;
  onChangeRole: (role: 'admin' | 'member') => void;
  onRemove: () => void;
};

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isDark = false,
  canManage,
  isCurrentUser,
  onClose,
  onSave,
  onChangeRole,
  onRemove,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState(member.displayName);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === member.displayName) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      onSave(trimmed);
      toast.success(t('company.memberSaved', 'Member saved'));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    if (isCurrentUser) {
      toast.error(t('company.youCantRemoveSelf', COMPANY_EDIT_FALLBACKS.youCantRemoveSelf));
      return;
    }
    onRemove();
    toast.success(t('company.memberRemoved', 'Member removed'));
    onClose();
  };

  const panelBg = isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl ${panelBg}`}>
        {closeBtn(onClose)}
        <h3 className="text-xl font-bold mb-1 text-[var(--text-primary)]">{member.displayName}</h3>
        <div className="text-xs text-[var(--text-secondary)] mb-5">
          {member.role === 'admin'
            ? t('company.roleAdmin', COMPANY_MEMBER_FALLBACKS.roleAdmin)
            : t('company.roleMember', COMPANY_MEMBER_FALLBACKS.roleMember)}
          {isCurrentUser ? ` • ${t('company.you', COMPANY_MEMBER_FALLBACKS.you)}` : ''}
        </div>

        {canManage ? (
          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-md neu-card-inset">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
                {t('company.name', 'Name')}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('company.renamePlaceholder', COMPANY_EDIT_FALLBACKS.renamePlaceholder)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)]"
              />
            </div>

            <div className="p-4 rounded-md neu-card-inset">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block flex items-center gap-1.5">
                <UserCog size={13} /> {t('company.role', COMPANY_EDIT_FALLBACKS.role)}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onChangeRole('admin')}
                  disabled={member.role === 'admin'}
                  className={`flex-1 min-h-[44px] rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-50 ${
                    member.role === 'admin'
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:brightness-110"
                  }`}
                >
                  {t('company.makeAdmin', COMPANY_EDIT_FALLBACKS.makeAdmin)}
                </button>
                <button
                  onClick={() => onChangeRole('member')}
                  disabled={member.role === 'member' || isCurrentUser}
                  className={`flex-1 min-h-[44px] rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-50 ${
                    member.role === 'member'
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:brightness-110"
                  }`}
                >
                  {t('company.makeMember', COMPANY_EDIT_FALLBACKS.makeMember)}
                </button>
              </div>
            </div>

            <button
              onClick={handleRemove}
              disabled={isCurrentUser}
              className="w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-110 disabled:opacity-50"
            >
              <Trash2 size={16} />
              {t('company.removeMember', COMPANY_EDIT_FALLBACKS.removeMember)}
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full min-h-[44px] rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
            >
              {saving ? t('company.saving', 'Saving...') : t('company.save', COMPANY_EDIT_FALLBACKS.save)}
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-md neu-card-inset text-sm text-[var(--text-secondary)]">
            {t('company.onlyAdmins', COMPANY_EDIT_FALLBACKS.onlyAdmins)}
          </div>
        )}
      </div>
    </div>
  );
};
