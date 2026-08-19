import type { ReactNode } from 'react';
import { QrCode, UserPlus, Settings, Lock } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../store';
import { COMPANY_UI_FALLBACKS, COMPANY_EDIT_FALLBACKS } from '../../constants/companyConstants';

type CompanyHeaderProps = {
  onScanQR?: () => void;
  onInvite?: () => void;
  onSettings?: () => void;
  canManage?: boolean;
};

const iconBtn = (icon: ReactNode, label: string, onClick?: () => void, disabled = false) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={disabled ? COMPANY_EDIT_FALLBACKS.onlyAdmins : undefined}
    className={`w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all shrink-0 hover:bg-[var(--list-item-hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    aria-label={label}
  >
    {icon}
  </button>
);

export const CompanyHeader = ({ onScanQR, onInvite, onSettings, canManage = false }: CompanyHeaderProps) => {
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
        {canManage
          ? iconBtn(<Settings size={20} />, 'Settings', onSettings)
          : iconBtn(<Lock size={20} />, t('company.onlyAdmins', COMPANY_EDIT_FALLBACKS.onlyAdmins), undefined, true)}
      </div>
    </div>
  );
};

