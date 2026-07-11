import React from 'react';

interface UnifiedButtonProps {
  label: string;
  subtitle?: string;
  rightIcon?: string;
  hasDropdown?: boolean;
  glowColor?: string;
  isLarge?: boolean;
  active?: boolean;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const UnifiedButton: React.FC<UnifiedButtonProps> = ({
  label,
  subtitle,
  rightIcon,
  hasDropdown = false,
  glowColor = 'orange',
  isLarge = false,
  active = false,
  onClick,
  variant = 'primary',
  size = 'md',
}) => {
  const sizeLayout = isLarge
    ? 'w-full h-[52px] justify-center flex-col'
    : `w-[110px] h-[48px] justify-between px-2.5`;

  const variantClasses = (() => {
    if (active) {
      return 'bg-[var(--bg-secondary)] shadow-[var(--shadow-neu-inset)] border border-[var(--border-color)]';
    }

    if (variant === 'ghost') {
      return 'bg-transparent hover:bg-[var(--bg-secondary)]';
    }

    if (variant === 'secondary') {
      return 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] shadow-[var(--shadow-neu-raised)] border border-[var(--border-color)]';
    }

    return 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] shadow-[var(--shadow-neu-raised)] border border-[var(--border-color)]';
  })();

  const textClasses = (() => {
    if (active) return 'text-[var(--text-primary)]';
    if (variant === 'ghost') return 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]';
    return 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]';
  })();

  return (
    <div
      onClick={onClick}
      className={`relative flex items-center shrink-0 cursor-pointer group transition-transform hover:scale-[1.02] active:scale-95 ${sizeLayout}`}
    >
      <div
        className={`absolute inset-0 rounded-md flex items-center justify-center font-bold tracking-wide transition-all z-10 ${variantClasses}`}
      />

      <div className={`relative z-20 flex flex-col justify-center w-full ${isLarge ? 'items-center' : 'items-start pl-0.5'}`}>
        <span className={`${isLarge ? 'text-[14px] w-full text-center' : 'text-[12px] font-bold'} leading-[14px] transition-colors ${textClasses}`}>
          {label}
        </span>
        {!isLarge && subtitle && (
          <span className="text-[8.5px] font-semibold opacity-60 leading-tight transition-colors text-[var(--text-tertiary)]">
            {subtitle}
          </span>
        )}
      </div>

      {(isLarge || active) && variant !== 'ghost' && (
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${isLarge ? 'w-24' : 'w-16'} h-3 rounded-full blur-[10px] opacity-100 pointer-events-none z-0 ${glowColor === 'orange' ? 'bg-[var(--accent)]' : 'bg-blue-500'}`} />
      )}
    </div>
  );
};
