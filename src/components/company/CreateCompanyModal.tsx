import { FORM_FIELD_GROUP_CLASS, FORM_FIELD_LABEL_CLASS } from '../ui/formClasses';
import React, { useState } from 'react';
import { modalOverlay } from '../ui/modalShared';
import { Building2, User, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { FormField } from '../ui/FormField';
import { CompanyModalCloseButton } from './CompanyModalCloseButton';
import { AVATAR_CIRCLE_CLASS, COMPANY_MODAL_HINT_CLASS } from './companyClasses';
import { XL_LABEL_CLASS } from '../ui/textClasses';

type CreateCompanyModalProps = {
  onClose: () => void;
  onCreated?: () => void;
};

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({ onClose, onCreated }) => {
  const { t } = useI18n();
  const createCompany = useAppStore(s => s.createCompany);
  const userProfile = useAppStore(s => s.userProfile);

  const [companyName, setCompanyName] = useState('');
  const [displayName, setDisplayName] = useState(userProfile?.name || '');
  const [creating, setCreating] = useState(false);

  const canSubmit = companyName.trim().length > 0 && displayName.trim().length > 0;

  const handleCreate = async () => {
    if (!canSubmit || creating) return;
    setCreating(true);
    try {
      await createCompany(companyName.trim(), displayName.trim());
      toast.success(t('company.created', 'Company created'));
      onCreated?.();
      onClose();
    } catch {
      toast.error(t('company.createFailed', 'Failed to create company'));
      setCreating(false);
    }
  };

  return (
    <div className={modalOverlay}>
      <div className="w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl bg-white border border-[var(--border-color)]">
        <CompanyModalCloseButton onClick={onClose} />
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--accent)]">
            <Building2 size={18} />
          </div>
          <h3 className={XL_LABEL_CLASS}>
            {t('company.createTitle', 'Create your company')}
          </h3>
        </div>
        <p className={COMPANY_MODAL_HINT_CLASS}>
          {t('company.createDescription', 'You will become the company admin and can invite teammates.')}
        </p>

        <div className="flex flex-col gap-3">
          <div className={FORM_FIELD_GROUP_CLASS}>
            <label className={FORM_FIELD_LABEL_CLASS}>
              {t('company.companyName', 'Company name')}
            </label>
            <div className="flex items-center gap-3">
              <div className={AVATAR_CIRCLE_CLASS}>
                <Building2 size={16} />
              </div>
              <FormField
                value={companyName}
                onChange={setCompanyName}
                type="text"
                placeholder={t('company.namePlaceholder', 'Acme Corp')}
                theme="dark"
                className="flex-1"
              />
            </div>
          </div>

          <div className={FORM_FIELD_GROUP_CLASS}>
            <label className={FORM_FIELD_LABEL_CLASS}>
              {t('company.yourName', 'Your name')}
            </label>
            <div className="flex items-center gap-3">
              <div className={AVATAR_CIRCLE_CLASS}>
                <User size={16} />
              </div>
              <FormField
                value={displayName}
                onChange={setDisplayName}
                type="text"
                placeholder={t('company.renamePlaceholder', 'Full name')}
                theme="dark"
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={!canSubmit || creating}
          aria-label={t('company.createCta', 'Create company')}
          title={t('company.createCta', 'Create company')}
          className="w-full mt-5 min-h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Check size={16} aria-hidden="true" />
          )}
          <span>{t('company.createCta', 'Create company')}</span>
        </button>
      </div>
    </div>
  );
};
