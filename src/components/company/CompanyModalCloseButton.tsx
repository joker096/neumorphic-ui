import { X } from 'lucide-react';

type CompanyModalCloseButtonProps = {
  onClick: () => void;
};

export const CompanyModalCloseButton = ({ onClick }: CompanyModalCloseButtonProps) => (
  <button
    onClick={onClick}
    className="absolute top-4 right-4 z-10 w-10 h-10 min-w-11 min-h-11 rounded-full flex items-center justify-center cursor-pointer transition-all bg-black/5 hover:bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
  >
    <X size={18} />
  </button>
);
