import React, { useState } from 'react';
import { X, Trash2, ChevronDown, UserCog, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyMember } from '../../lib/company/types';
import { useI18n } from '../../lib/i18n';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { COMPANY_EDIT_FALLBACKS, COMPANY_MEMBER_FALLBACKS } from '../../constants/companyConstants';

const closeBtn = (onClick: () => void, ariaLabel: string) => (
  <button
    type="button"
    aria-label={ariaLabel}
    onClick={onClick}
    className="absolute top-4 right-4 z-10 w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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
  onChangeRole: (role: 'admin' | 'manager' | 'member') => void;
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
  const [confirmRemove, setConfirmRemove] = useState(false);

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
    setConfirmRemove(true);
  };

  const handleConfirmRemove = () => {
    onRemove();
    toast.success(t('company.memberRemoved', 'Member removed'));
    setConfirmRemove(false);
    onClose();
  };

  const panelBg = isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)]";

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl ${panelBg}`}>
        {closeBtn(onClose, t('common.close'))}
        <h3 className="text-xl font-bold mb-1 text-[var(--text-primary)]">{member.displayName}</h3>
        <div className="text-xs text-[var(--text-secondary)] mb-5">
          {member.role === 'admin'
            ? t('company.roleAdmin', COMPANY_MEMBER_FALLBACKS.roleAdmin)
            : member.role === 'manager'
              ? t('company.roleManager', COMPANY_MEMBER_FALLBACKS.roleManager)
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
                aria-label={t('company.renamePlaceholder', COMPANY_EDIT_FALLBACKS.renamePlaceholder)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('company.renamePlaceholder', COMPANY_EDIT_FALLBACKS.renamePlaceholder)}
                className="w-full min-h-11 px-3 rounded-xl bg-[var(--bg-secondary)] text-[var(--text-primary)] outline-none border border-[var(--border-color)] focus:border-[var(--accent)]"
              />
            </div>

            <div className="p-4 rounded-md neu-card-inset">
              <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block flex items-center gap-1.5">
                <UserCog size={14} /> {t('company.role', COMPANY_EDIT_FALLBACKS.role)}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onChangeRole('admin')}
                  disabled={member.role === 'admin'}
                  className={`flex-1 min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-50 ${
                    member.role === 'admin'
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:brightness-110"
                  }`}
                >
                  {t('company.makeAdmin', COMPANY_EDIT_FALLBACKS.makeAdmin)}
                </button>
                <button
                  onClick={() => onChangeRole('manager')}
                  disabled={member.role === 'manager'}
                  className={`flex-1 min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-50 ${
                    member.role === 'manager'
                      ? "bg-[var(--color-warning)] text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:brightness-110"
                  }`}
                >
                  {t('company.makeManager', COMPANY_EDIT_FALLBACKS.makeManager)}
                </button>
                <button
                  onClick={() => onChangeRole('member')}
                  disabled={member.role === 'member' || isCurrentUser}
                  className={`flex-1 min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-50 ${
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
              aria-label={t('company.removeMember', COMPANY_EDIT_FALLBACKS.removeMember)}
              title={t('company.removeMember', COMPANY_EDIT_FALLBACKS.removeMember)}
              className="w-9 h-9 min-w-11 min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:brightness-110 disabled:opacity-50"
            >
              <Trash2 size={16} />
              <span className="sr-only">{t('company.removeMember', COMPANY_EDIT_FALLBACKS.removeMember)}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={t('company.save', COMPANY_EDIT_FALLBACKS.save)}
              title={t('company.save', COMPANY_EDIT_FALLBACKS.save)}
              className="w-full min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
              <span>{t('company.save', COMPANY_EDIT_FALLBACKS.save)}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-md neu-card-inset text-sm text-[var(--text-secondary)]">
            {t('company.onlyAdmins', COMPANY_EDIT_FALLBACKS.onlyAdmins)}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmRemove}
        title={t('company.removeConfirm', 'Remove this member?')}
        message={member.displayName}
        confirmLabel={t('common.confirm', 'Confirm')}
        cancelLabel={t('common.cancel', 'Cancel')}
        confirmIcon={<Trash2 />}
        cancelIcon={<X />}
        variant="danger"
        theme={isDark ? 'dark' : 'light'}
        zIndex="z-[var(--z-modal-nested)]"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
};
