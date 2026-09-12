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
  const interactive = Boolean(onClick);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const rowClasses = `w-full flex items-center gap-3 px-4 py-3 text-left border-b last:border-b-0 border-border ${interactive ? `transition-colors cursor-pointer active:scale-[0.99] ${isDark ? "hover:bg-white/5" : "hover:bg-black/5"}` : ""} ${className}`;

  const rowContent = (
    <>
      {icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${"text-foreground"}`}>{title}</div>
        {subtitle && <div className={`text-xs mt-0.5 line-clamp-2 ${"text-muted-foreground"}`}>{subtitle}</div>}
      </div>
      {rightElement}
      {value && <span className={`text-xs font-medium mr-1 ${"text-muted-foreground"}`}>{value}</span>}
      {interactive && !hasRightAction && (
        <ChevronRight size={16} className={`shrink-0 opacity-30 ${"text-muted-foreground"}`} />
      )}
    </>
  );

  if (hasRightAction) {
    return (
      <div
        role="row"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={rowClasses}
      >
        {rowContent}
      </div>
    );
  }

  return interactive ? (
    <button
      role="button"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={rowClasses}
    >
      {rowContent}
    </button>
  ) : (
    <div className={rowClasses}>
      {rowContent}
    </div>
  );
};

export const SettingsSectionTitle = ({ title, isDark = false }: { title: string; isDark?: boolean }) => (
  <div className={`font-mono text-xs uppercase tracking-widest font-bold mb-2 opacity-50 px-2 text-foreground`}>
    {title}
  </div>
);

export const SettingsGroup = ({ children, isDark = false, className = "" }: { children: React.ReactNode; isDark?: boolean; className?: string }) => (
  <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"} ${className}`}>
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
      className={`relative inline-flex items-center justify-center my-[-10px] min-w-[var(--control-size-xl)] min-h-[var(--control-height-md)] cursor-pointer transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-full`}
      aria-checked={isOn}
    >
      <div className={`w-11 h-6 flex items-center rounded-full px-1 transition-colors duration-200 ${isOn ? 'bg-emerald-500 justify-end' : 'bg-muted justify-start'}`}>
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-sm flex items-center justify-center shrink-0 [&>svg]:w-2.5 [&>svg]:h-2.5 ${isOn ? "text-emerald-600" : "text-muted-foreground"}`}
        >
          {isOn ? onIcon : offIcon}
        </div>
      </div>
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



