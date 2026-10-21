import { FORM_FIELD_CONTROL_CLASS, FORM_FIELD_GROUP_CLASS, FORM_FIELD_LABEL_CLASS, FORM_ICON_DANGER_BTN_CLASS, FORM_PRIMARY_BTN_CLASS } from '../ui/formClasses';
import React, { useState } from 'react';
import { modalOverlay } from '../ui/modalShared';
import { X, Trash2, ChevronDown, UserCog, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CompanyMember } from '../../lib/company/types';
import { useI18n } from '../../lib/i18n';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { COMPANY_EDIT_FALLBACKS, COMPANY_MEMBER_FALLBACKS } from '../../constants/companyConstants';
import { CompanyModalCloseButton } from './CompanyModalCloseButton';
import { COMPANY_MODAL_HINT_CLASS } from './companyClasses';

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

  const panelBg = "bg-[var(--bg-tertiary)] border border-[var(--border-color)]";

  return (
    <div className={modalOverlay}>
      <div className={`w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl ${panelBg}`}>
        <CompanyModalCloseButton onClick={onClose} />
        <h3 className="text-xl font-bold mb-1 text-[var(--text-primary)]">{member.displayName}</h3>
        <div className={COMPANY_MODAL_HINT_CLASS}>
          {member.role === 'admin'
            ? t('company.roleAdmin', COMPANY_MEMBER_FALLBACKS.roleAdmin)
            : member.role === 'manager'
              ? t('company.roleManager', COMPANY_MEMBER_FALLBACKS.roleManager)
              : t('company.roleMember', COMPANY_MEMBER_FALLBACKS.roleMember)}
          {isCurrentUser ? ` • ${t('company.you', COMPANY_MEMBER_FALLBACKS.you)}` : ''}
        </div>

        {canManage ? (
          <div className="flex flex-col gap-4">
            <div className={FORM_FIELD_GROUP_CLASS}>
              <label className={FORM_FIELD_LABEL_CLASS}>
                {t('company.name', 'Name')}
              </label>
              <input
                aria-label={t('company.renamePlaceholder', COMPANY_EDIT_FALLBACKS.renamePlaceholder)}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('company.renamePlaceholder', COMPANY_EDIT_FALLBACKS.renamePlaceholder)}
                className={`${FORM_FIELD_CONTROL_CLASS}`}
              />
            </div>

            <div className={FORM_FIELD_GROUP_CLASS}>
              <label className={`${FORM_FIELD_LABEL_CLASS} flex items-center gap-1.5`}>
                <UserCog size={14} /> {t('company.role', COMPANY_EDIT_FALLBACKS.role)}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => onChangeRole('admin')}
                  disabled={member.role === 'admin'}
                  className={`flex-1 min-h-11 rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-50 ${
                    member.role === 'admin'
                      ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]"
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
                      ? "bg-[var(--color-warning)] text-[var(--ink-on-saturate)]"
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
                      ? "bg-[var(--accent)] text-[var(--ink-on-saturate)]"
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
              className={`${FORM_ICON_DANGER_BTN_CLASS} disabled:opacity-50`}
            >
              <Trash2 size={16} />
              <span className="sr-only">{t('company.removeMember', COMPANY_EDIT_FALLBACKS.removeMember)}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              aria-label={t('company.save', COMPANY_EDIT_FALLBACKS.save)}
              title={t('company.save', COMPANY_EDIT_FALLBACKS.save)}
              className={FORM_PRIMARY_BTN_CLASS}
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
