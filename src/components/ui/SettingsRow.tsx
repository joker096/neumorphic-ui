import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface SettingsRowProps {
  key?: React.Key;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  isDark?: boolean;
  value?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const SettingsRow = ({ icon, iconBg, iconColor, title, subtitle, isDark = false, value, rightElement, onClick, className = "" }: SettingsRowProps) => {
  const hasRightAction = Boolean(rightElement);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const baseClasses = `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 border-border hover:bg-muted`;
  const rowClasses = hasRightAction
    ? `${baseClasses} ${className}`
    : `${baseClasses} cursor-pointer active:scale-[0.99] ${className}`;

  return hasRightAction ? (
    <div
      role="row"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={rowClasses}
    >
      {icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${isDark ? "text-foreground" : "text-foreground"}`}>{title}</div>
        {subtitle && <div className={`text-xs mt-0.5 line-clamp-2 ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{subtitle}</div>}
      </div>
      {rightElement}
      {value && <span className={`text-xs font-medium mr-1 ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{value}</span>}
    </div>
  ) : (
    <button
      role="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={rowClasses}
    >
      {icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${isDark ? "text-foreground" : "text-foreground"}`}>{title}</div>
        {subtitle && <div className={`text-xs mt-0.5 line-clamp-2 ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{subtitle}</div>}
      </div>
      {value && (
        <span className={`text-xs font-medium mr-1 ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`}>{value}</span>
      )}
      <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-muted-foreground" : "text-muted-foreground"}`} />
    </button>
  );
};

export const SettingsSectionTitle = ({ title, isDark = false }: { title: string; isDark?: boolean }) => (
  <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 text-foreground`}>
    {title}
  </div>
);

export const SettingsGroup = ({ children, isDark = false, className = "" }: { children: React.ReactNode; isDark?: boolean; className?: string }) => (
  <div className={`rounded-xl overflow-hidden ${isDark ? "bg-card border border-border" : "bg-background border border-border"} ${className}`}>
    {children}
  </div>
);

export const ToggleSwitch = ({ isOn, onToggle, isDark = false, onIcon, offIcon, ariaLabel }: { isOn: boolean; onToggle: () => void; isDark?: boolean; onIcon?: React.ReactNode; offIcon?: React.ReactNode; ariaLabel?: string }) => {
  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onToggle();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle(e);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative min-w-[44px] min-h-[24px] w-11 h-6 flex items-center rounded-full px-1 cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${isOn ? 'bg-emerald-500 justify-end' : 'bg-muted justify-start'}`}
      aria-checked={isOn}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 [&>svg]:w-2.5 [&>svg]:h-2.5 ${isOn ? "text-emerald-600" : "text-muted-foreground"}`}
      >
        {isOn ? onIcon : offIcon}
      </div>
      {/* invisible enlarge touch area to 44px height */}
      <span aria-hidden="true" className="absolute inset-y-[-10px] left-0 right-0 pointer-events-none" />
    </button>
  );
};

interface SettingsToggleRowProps extends Omit<SettingsRowProps, 'rightElement' | 'onClick'> {
  isOn: boolean;
  onToggle: () => void;
  toggleOnIcon?: React.ReactNode;
  toggleOffIcon?: React.ReactNode;
}

export const SettingsToggleRow = ({ icon, iconBg, iconColor, title, subtitle, isOn, isDark = false, onToggle, toggleOnIcon, toggleOffIcon }: SettingsToggleRowProps) => (
  <SettingsRow
    icon={icon}
    iconBg={iconBg}
    iconColor={iconColor}
    title={title}
    subtitle={subtitle}
    isDark={isDark}
    rightElement={<ToggleSwitch isOn={isOn} onToggle={onToggle} isDark={isDark} onIcon={toggleOnIcon} offIcon={toggleOffIcon} ariaLabel={typeof title === 'string' ? title : undefined} />}
    onClick={onToggle}
  />
);



