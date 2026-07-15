import { useAppStore } from '../../store';

type CompanyInfoCardProps = {
  isDark?: boolean;
  orgId?: string;
  connected: string;
};

export const CompanyInfoCard = ({ isDark = false, orgId = 'N/A', connected }: CompanyInfoCardProps) => {
  const companySettings = useAppStore(state => state.companySettings);

  const hasContactInfo = companySettings && (
    companySettings.phone ||
    companySettings.email ||
    companySettings.address ||
    companySettings.website
  );

  return (
    <div
      className={`w-full px-4 py-4 rounded-2xl mb-4 relative ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M4 8l4-4 4 0 4 4" />
            <rect x="9" y="12" width="6" height="6" rx="1" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`font-bold text-lg truncate ${isDark ? "text-white" : "text-slate-800"}`}>
            {companySettings?.name || 'Company'}
          </div>
          <div className={`text-xs font-mono truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{orgId}</div>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"}`}>
          {connected}
        </div>
      </div>

      {hasContactInfo && (
        <div className="mt-3 pt-3 border-t border-[var(--border-color)] border-opacity-20">
          <div className="flex flex-col gap-1">
            {companySettings?.phone && (
              <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 17.5v5.333H20v-2.667V12.667a1.25 1.25 0 0 0 0 1.25z" />
                  <path d="M17.333-2.667" />
                  <path d="M22 17.5v5.333H20v-2.667V12.667a1.25 1.25 0 0 0 0 1.25z" />
                  <rect x="2" y="3" width="20" height="18" rx="3" />
                </svg>
                <span className="truncate">{companySettings.phone}</span>
              </div>
            )}
            {companySettings?.email && (
              <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 4l10 6.7L22 4" />
                </svg>
                <span className="truncate">{companySettings.email}</span>
              </div>
            )}
            {companySettings?.address && (
              <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C7 2 2 7 2 12C2 12 4.5 14 4.5 14" />
                  <path d="M12 2C17 2 22 7 22 12" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="truncate">{companySettings.address}</span>
              </div>
            )}
            {companySettings?.website && (
              <div className={`flex items-center gap-1.5 text-xs ${isDark ? "text-gray-300" : "text-slate-600"}`}>
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
