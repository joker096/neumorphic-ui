import { QrCode, UserPlus } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../store';

type CompanyHeaderProps = {
  isDark: boolean;
  onScanQR?: () => void;
  onInvite?: () => void;
};

export const CompanyHeaderUI = ({ isDark, onScanQR, onInvite }: CompanyHeaderProps) => {
  const { t } = useI18n();
  const companyName = useAppStore(state => state.companySettings?.name);

  return (
    <div className="w-full flex items-center justify-between mb-6 px-2">
      <h2 className={`font-sans text-2xl font-bold tracking-wide ${isDark ? "text-white" : "text-slate-800"}`}>
        {companyName || 'Company'}
      </h2>
      <div className={`flex gap-3 ${isDark ? "text-orange-400" : "text-orange-600"}`}>
        <button
          onClick={onScanQR}
          className="cursor-pointer hover:opacity-80 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="QR Code"
          title={t('company.scanQR') || 'Scan QR to join'}
        >
          <QrCode size={24} />
        </button>
        <button
          onClick={onInvite}
          className="cursor-pointer hover:opacity-80 transition-all active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Invite"
          title={t('company.invite') || 'Invite members'}
        >
          <UserPlus size={24} />
        </button>
      </div>
    </div>
  );
};
