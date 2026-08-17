import type { ReactNode } from 'react';
import { QrCode, UserPlus, Settings } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../store';
import { COMPANY_UI_FALLBACKS } from '../../constants/companyConstants';

type CompanyHeaderProps = {
  onScanQR?: () => void;
  onInvite?: () => void;
  onSettings?: () => void;
};

const iconBtn = (icon: ReactNode, label: string, onClick?: () => void) => (
  <button
    onClick={onClick}
    className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    aria-label={label}
  >
    {icon}
  </button>
);

export const CompanyHeader = ({ onScanQR, onInvite, onSettings }: CompanyHeaderProps) => {
  const { t } = useI18n();
  const companyName = useAppStore(state => state.companySettings?.name);

  return (
    <div className="w-full flex items-center justify-between mb-6 px-2">
      <h2 className={`font-sans text-2xl font-bold tracking-wide text-[var(--text-primary)]`}>
        {companyName || t('company.orgName') || COMPANY_UI_FALLBACKS.orgName}
      </h2>
      <div className="flex gap-3">
        {iconBtn(<QrCode size={20} />, 'QR Code', onScanQR)}
        {iconBtn(<UserPlus size={20} />, 'Invite', onInvite)}
        {iconBtn(<Settings size={20} />, 'Settings', onSettings)}
      </div>
    </div>
  );
};

