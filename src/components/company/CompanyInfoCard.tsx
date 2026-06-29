import { useAppStore } from '../../store';

type CompanyInfoCardProps = {
  isDark: boolean;
  orgId?: string;
  connected: string;
};

export const CompanyInfoCard = ({ isDark, orgId = 'N/A', connected }: CompanyInfoCardProps) => {
  const companyName = useAppStore(state => state.companySettings?.name || 'Company');

  return (
    <div className={`w-full px-4 py-4 rounded-2xl mb-4 flex items-center gap-3 ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white border border-black/5 shadow-sm"}`}>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shrink-0`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M4 8l4-4 4 0 4 4" />
          <rect x="9" y="12" width="6" height="6" rx="1" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-lg truncate ${isDark ? "text-white" : "text-slate-800"}`}>{companyName}</div>
        <div className={`text-xs font-mono truncate ${isDark ? "text-gray-400" : "text-slate-500"}`}>{orgId}</div>
      </div>
      <div className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"}`}>
        {connected}
      </div>
    </div>
  );
};
