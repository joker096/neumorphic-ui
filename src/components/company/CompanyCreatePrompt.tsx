import { useState } from 'react';
import { Building2, HelpCircle, ChevronDown } from 'lucide-react';
import type { TFunction } from './useCompanyContacts';

type CompanyCreatePromptProps = {
  t: TFunction;
  onCreate: () => void;
};

export const CompanyCreatePrompt = ({ t, onCreate }: CompanyCreatePromptProps) => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--accent)]">
        <Building2 size={32} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">{t('company.noCompany', 'No company yet')}</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[260px]">{t('company.createHint', 'Create a company to invite teammates and manage roles.')}</p>
      </div>
      <button
        onClick={onCreate}
        aria-label={t('company.createCta', 'Create company')}
        title={t('company.createCta', 'Create company')}
        className="min-h-11 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm cursor-pointer transition-all bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] hover:brightness-110"
      >
        <Building2 size={16} />
        <span>{t('company.createCta', 'Create company')}</span>
      </button>

      <button
        onClick={() => setShowHelp((v) => !v)}
        aria-label={t('company.createHelpCta', 'How to create a company')}
        title={t('company.createHelpCta', 'How to create a company')}
        className="mt-2 min-h-11 px-4 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-tertiary)]"
        aria-expanded={showHelp}
      >
        <HelpCircle size={16} />
        <span>{t('company.createHelpCta', 'How to create a company')}</span>
        <ChevronDown size={16} className={`transition-transform ${showHelp ? 'rotate-180' : ''}`} />
      </button>

      {showHelp && (
        <div className="w-full max-w-[320px] text-left mt-2 p-4 rounded-xl neu-card-inset space-y-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">{t('company.guide.createTitle', '1. Create your own company (not demo data)')}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{t('company.guide.createBody', 'Open Settings → Company → "Create your company". Enter the company name and your display name. The app generates a real company id (org_…) and cryptographic keys (X25519 + Ed25519) locally — you become the first Admin.')}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">{t('company.guide.inviteTitle', '2. Invite teammates')}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{t('company.guide.inviteBody', 'An Admin opens the company view → "Invite members" and shares the QR code. A teammate scans it and sends a join request signed with their own key.')}</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">{t('company.guide.confirmTitle', '3. Confirm & assign roles')}</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{t('company.guide.confirmBody', 'A new joiner is given the "Member" role by default. The Admin verifies the invite signature and confirms the join. Only Admins can change roles.')}</p>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)]">{t('company.createHelpNote', 'Full guide: Settings → Company → Company guide.')}</p>
        </div>
      )}
    </div>
  );
};
