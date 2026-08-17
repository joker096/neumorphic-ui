import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { COMPANY_INFO_GRADIENT, COMPANY_UI_FALLBACKS } from '../../constants/companyConstants';

type CompanyInfoCardProps = {
  isDark?: boolean;
  orgId?: string;
  connected: string;
};

export const CompanyInfoCard = ({ isDark = false, orgId = 'N/A', connected }: CompanyInfoCardProps) => {
  const { t } = useI18n();
  const companySettings = useAppStore(state => state.companySettings);

  const companyName = companySettings?.name || t('company.orgName') || COMPANY_UI_FALLBACKS.orgName;

  const hasContactInfo = Boolean(companySettings?.phone || companySettings?.email || companySettings?.address || companySettings?.website);

  return (
    <div
      className={`w-full px-4 py-4 rounded-2xl mb-4 relative ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white border border-[var(--border-color)] shadow-sm"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${COMPANY_INFO_GRADIENT} flex items-center justify-center text-[var(--text-primary)] shrink-0`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 8l4-4 4 0 4 4" />
            <rect x="9" y="12" width="6" height="6" rx="1" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg truncate text-[var(--text-primary)]">
            {companyName}
          </div>
          <div className="text-xs font-mono truncate text-[var(--text-secondary)]">{orgId}</div>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${isDark ? "bg-[var(--color-success)]/20 text-[var(--color-success)]" : "bg-[var(--color-success-soft)] text-[var(--color-success)]"}`}>
          {connected}
        </div>
      </div>

      {hasContactInfo && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)] border-opacity-20">
          <div className="flex flex-col gap-1">
            {companySettings?.phone && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span className="truncate">{companySettings.phone}</span>
              </div>
            )}
            {companySettings?.email && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 4l10 6.7L22 4" />
                </svg>
                <span className="truncate">{companySettings.email}</span>
              </div>
            )}
            {companySettings?.address && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="truncate">{companySettings.address}</span>
              </div>
            )}
            {companySettings?.website && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v4" />
                  <path d="M12 18v4" />
                  <path d="M2 12h4" />
                  <path d="M18 12h4" />
                </svg>
                <span className="truncate">{companySettings.website}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

