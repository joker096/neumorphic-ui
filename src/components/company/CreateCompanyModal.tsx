import React, { useState } from 'react';
import { X, Building2, User, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { FormField } from '../ui/FormField';

const closeBtn = (onClick: () => void) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  >
    <X size={18} />
  </button>
);

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[340px] md:max-w-[400px] p-6 shadow-2xl relative rounded-2xl bg-white border border-[var(--border-color)]">
        {closeBtn(onClose)}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--accent)]">
            <Building2 size={18} />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">
            {t('company.createTitle', 'Create your company')}
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-5">
          {t('company.createDescription', 'You will become the company admin and can invite teammates.')}
        </p>

        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t('company.companyName', 'Company name')}
            </label>
            <div className="flex items-center gap-3">
              <div className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
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

          <div className="p-4 rounded-md neu-card-inset">
            <label className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 block">
              {t('company.yourName', 'Your name')}
            </label>
            <div className="flex items-center gap-3">
              <div className="min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
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
          className="w-full mt-5 min-h-[44px] rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Check size={16} />
          )}
          {creating
            ? t('company.creating', 'Creating...')
            : t('company.createCta', 'Create company')}
        </button>
      </div>
    </div>
  );
};
