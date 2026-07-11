import { ChevronLeft } from 'lucide-react';

type BackButtonProps = {
  onClick?: () => void;
  className?: string;
};

export const BackButton = ({ onClick, className = '' }: BackButtonProps) => (
  <button type="button" onClick={onClick} className={`flex items-center gap-1 text-sm font-medium cursor-pointer transition-colors ${className}`}>
    <ChevronLeft size={16} />
    Back
  </button>
);
