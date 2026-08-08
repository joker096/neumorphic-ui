import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsCardProps {
  children: ReactNode;
  isDark: boolean;
  className?: string;
}

export const SettingsCard = ({ children, isDark, className = '' }: SettingsCardProps) => (
  <div className={`rounded-xl ${isDark ? "bg-[var(--bg-tertiary)] border border-[var(--border-color)]" : "bg-white shadow-sm border border-[var(--border-color)]"} overflow-hidden ${className}`}>
    {children}
  </div>
);

interface SettingsNavItemProps {
  icon: ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  isDark: boolean;
  onClick?: () => void;
  rightElement?: ReactNode;
  className?: string;
}

export const SettingsNavItem = ({ icon, iconBg, title, subtitle, isDark, onClick, rightElement, className = '' }: SettingsNavItemProps) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:opacity-80 ${className}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg || ''}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-semibold ${isDark ? "text-[var(--text-primary)]" : "text-slate-900"}`}>{title}</div>
      {subtitle && <div className={`text-[11px] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{subtitle}</div>}
    </div>
    {rightElement}
    {onClick && !rightElement && <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />}
  </div>
);

interface SettingsDividerProps {
  isDark: boolean;
}

export const SettingsDivider = ({ isDark }: SettingsDividerProps) => (
  <div className={`border-t ${isDark ? "border-[var(--border-color)]" : "border-[var(--border-color)]"}`} />
);
