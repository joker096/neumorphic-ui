import React, { useState } from 'react';
import { BookOpen, Building2, UserPlus, ShieldCheck, KeyRound, ChevronRight } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { SettingsGroup, SettingsSectionTitle, SettingsRow } from '../ui/SettingsRow';
import { SubView } from '../ui/SubView';
import { MEDIUM_LABEL_CLASS } from '../ui/textClasses';
import { GUIDE_ROW_CLASS } from '../ui/rowClasses';

interface CompanyGuideSectionProps {
  isDark?: boolean;
  onBack: () => void;
  onCreateCompany?: () => void;
}

const STEPS = [
  {
    key: 'create',
    icon: <Building2 size={16} />,
    titleKey: 'company.guide.createTitle',
    titleFallback: '1. Create your own company (not demo data)',
    bodyKey: 'company.guide.createBody',
    bodyFallback:
      'Open Settings → Company → "Create your company". Enter the company name and your display name. ' +
      'The app generates a real company id (org_…) and cryptographic keys (X25519 + Ed25519) locally — ' +
      'you become the first Admin. Nothing here is mock data: the workspace now shows YOUR company, stored in your device (IndexedDB).',
  },
  {
    key: 'invite',
    icon: <UserPlus size={16} />,
    titleKey: 'company.guide.inviteTitle',
    titleFallback: '2. Invite teammates',
    bodyKey: 'company.guide.inviteBody',
    bodyFallback:
      'An Admin opens the company view → "Invite members" and shares the QR code. The QR is signed with the ' +
      'admin’s key and contains the org id, an invite code and the admin signature. A teammate scans it and sends ' +
      'a join request signed with their own Ed25519 key.',
  },
  {
    key: 'confirm',
    icon: <ShieldCheck size={16} />,
    titleKey: 'company.guide.confirmTitle',
    titleFallback: '3. Confirm & assign roles (admins, managers, members)',
    bodyKey: 'company.guide.confirmBody',
    bodyFallback:
      'A new joiner is given the "Member" role by default. The Admin verifies the invite signature and confirms ' +
      'the join (delivering the group key). To turn a member into an Admin or Manager: open the member card → ' +
      'Role → "Make admin" / "Make manager" / "Make member". Only Admins can change roles. Managers can manage ' +
      'members but cannot promote or demote Admins. Promotion is always confirmed explicitly by an Admin — there ' +
      'is no automatic admin/manager assignment.',
  },
  {
    key: 'keys',
    icon: <KeyRound size={16} />,
    titleKey: 'company.guide.keysTitle',
    titleFallback: 'How confirmation actually works',
    bodyKey: 'company.guide.keysBody',
    bodyFallback:
      'Every join request is signed (Ed25519) by the joiner and the invite by the Admin. The Admin’s ' +
      'acknowledgement wraps the shared group key to the joiner’s device key (X25519). This means a member only ' +
      'becomes part of the company after an Admin validates the signature and sends the key — that is the ' +
      'confirmation step. Role changes are recorded and shown next to each member.',
  },
];

export const CompanyGuideSection = ({ isDark = false, onBack, onCreateCompany }: CompanyGuideSectionProps) => {
  const { t } = useI18n();
  const [openStep, setOpenStep] = useState<string | null>('create');

  return (
    <SubView title={t('company.guide.title', 'Company guide')} isDark={isDark} onBack={onBack}>
      <SettingsSectionTitle title={t('company.guide.subtitle', 'How companies & roles work')} isDark={isDark} />

      {onCreateCompany && (
        <button
          onClick={onCreateCompany}
          aria-label={t('company.guide.createCta', 'Create your company')}
          title={t('company.guide.createCta', 'Create your company')}
          className="min-h-11 px-3 mb-4 flex items-center justify-center gap-2 rounded-xl transition-colors active:scale-[0.99] bg-[var(--accent)] text-[var(--button-primary-text)]"
        >
          <Building2 size={16} />
          <span className="text-sm font-medium">{t('company.guide.createCta', 'Create your company')}</span>
        </button>
      )}

      <SettingsGroup isDark={isDark}>
        {STEPS.map((step) => {
          const isOpen = openStep === step.key;
          return (
            <div key={step.key}>
              <button
                onClick={() => setOpenStep(isOpen ? null : step.key)}
                className={GUIDE_ROW_CLASS}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-[var(--accent)]/10 dark:bg-[var(--accent-soft)]`}>
                    <span className="t-accent">{step.icon}</span>
                  </span>
                  <span className={MEDIUM_LABEL_CLASS}>
                    {t(step.titleKey, step.titleFallback)}
                  </span>
                </span>
                <ChevronRight size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-90 text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pl-16 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {t(step.bodyKey, step.bodyFallback)}
                </div>
              )}
            </div>
          );
        })}
      </SettingsGroup>

      <SettingsSectionTitle title={t('company.guide.tipsTitle', 'Quick notes')} isDark={isDark} />
      <SettingsGroup isDark={isDark}>
        <SettingsRow
          icon={<BookOpen size={16} />}
          iconBg="bg-emerald-100 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          title={t('company.guide.note1', 'The first person to create a company is its Admin')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<ShieldCheck size={16} />}
          iconBg="t-accent-bg"
          iconColor="t-accent"
          title={t('company.guide.note2', 'Only an Admin can confirm or change someone’s role')}
          isDark={isDark}
        />
        <SettingsRow
          icon={<KeyRound size={16} />}
          iconBg="bg-amber-100 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
          title={t('company.guide.note3', 'Joining always requires the Admin’s signed invite')}
          isDark={isDark}
        />
      </SettingsGroup>
    </SubView>
  );
};
