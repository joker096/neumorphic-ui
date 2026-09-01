import { useAppStore } from '../../store';
import { useI18n } from '../../lib/i18n';
import { Building2, Globe, Mail, MapPin, Phone } from "lucide-react";
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
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${COMPANY_INFO_GRADIENT} flex items-center justify-center text-[var(--text-primary)] shrink-0`}>
          <Building2 size={24} />
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
                <Phone size={12} />
                <span className="truncate">{companySettings.phone}</span>
              </div>
            )}
            {companySettings?.email && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Mail size={12} />
                <span className="truncate">{companySettings.email}</span>
              </div>
            )}
            {companySettings?.address && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <MapPin size={12} />
                <span className="truncate">{companySettings.address}</span>
              </div>
            )}
            {companySettings?.website && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                <Globe size={12} />
                <span className="truncate">{companySettings.website}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

