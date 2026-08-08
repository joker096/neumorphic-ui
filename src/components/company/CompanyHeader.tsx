import { QrCode, UserPlus, Settings } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../store';

type CompanyHeaderProps = {
  isDark?: boolean;
  onScanQR?: () => void;
  onInvite?: () => void;
  onSettings?: () => void;
};

const iconBtn = (icon: React.ReactNode, label: string, onClick?: () => void, isDark?: boolean) => (
  <button
    onClick={onClick}
    className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 ${
      isDark ? "hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" : "hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    }`}
    aria-label={label}
  >
    {icon}
  </button>
);

export const CompanyHeader = ({ isDark = false, onScanQR, onInvite, onSettings }: CompanyHeaderProps) => {
  const { t } = useI18n();
  const companyName = useAppStore(state => state.companySettings?.name);

  return (
    <div className="w-full flex items-center justify-between mb-6 px-2">
      <h2 className={`font-sans text-2xl font-bold tracking-wide ${isDark ? "text-[var(--text-primary)]" : "text-[var(--text-primary)]"}`}>
        {companyName || t('company.orgName')}
      </h2>
      <div className="flex gap-3">
        {iconBtn(<QrCode size={20} />, 'QR Code', onScanQR, isDark)}
        {iconBtn(<UserPlus size={20} />, 'Invite', onInvite, isDark)}
        {iconBtn(<Settings size={20} />, 'Settings', onSettings, isDark)}
      </div>
    </div>
  );
};

export const CompanyHeaderUI = CompanyHeader;

