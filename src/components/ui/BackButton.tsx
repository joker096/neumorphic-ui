import { ChevronLeft } from 'lucide-react';

type BackButtonProps = {
  onClick?: () => void;
  className?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
};

const SIZE_MAP = {
  sm: { icon: 14, wrapper: 'w-8 h-8' },
  md: { icon: 16, wrapper: 'w-9 h-9' },
  lg: { icon: 20, wrapper: 'w-10 h-10' },
} as const;

export const BackButton = ({ onClick, className = '', label, size = 'md' }: BackButtonProps) => {
  const dims = SIZE_MAP[size];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-medium cursor-pointer transition-colors hover:opacity-80 active:opacity-60 ${className}`}
    >
      <span className={`${dims.wrapper} rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/30`}>
        <ChevronLeft size={dims.icon} />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
};
