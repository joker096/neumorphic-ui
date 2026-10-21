import { X } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

type CompanyModalCloseButtonProps = {
  onClick: () => void;
  /** Overrides the default "close" label when the surrounding dialog needs a more specific one. */
  ariaLabel?: string;
};

export const CompanyModalCloseButton = ({ onClick, ariaLabel }: CompanyModalCloseButtonProps) => {
  const { t } = useI18n();
  return (
    <button
      type="button"
      aria-label={ariaLabel ?? t('common.close')}
      onClick={onClick}
      className="absolute top-4 right-4 z-10 w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      <X size={18} />
    </button>
  );
};
