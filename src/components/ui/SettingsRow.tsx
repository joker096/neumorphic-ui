import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface SettingsRowProps {
  key?: React.Key;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  isDark: boolean;
  value?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const SettingsRow = ({ icon, iconBg, iconColor, title, subtitle, isDark, value, rightElement, onClick, className = "" }: SettingsRowProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b last:border-b-0 ${isDark ? "border-white/5 hover:bg-white/5" : "border-black/5 hover:bg-black/5"} ${className}`}
  >
    {icon && (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
    )}
    <div className="flex-1 min-w-0">
      <div className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{title}</div>
      {subtitle && <div className={`text-xs mt-0.5 line-clamp-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>{subtitle}</div>}
    </div>
    {rightElement ? (
      rightElement
    ) : (
      <>
        {value && (
          <span className={`text-xs font-medium mr-1 ${isDark ? "text-gray-300" : "text-slate-600"}`}>{value}</span>
        )}
        <ChevronRight size={16} className={`shrink-0 opacity-30 ${isDark ? "text-gray-400" : "text-slate-500"}`} />
      </>
    )}
  </button>
);

export const SettingsSectionTitle = ({ title, isDark }: { title: string; isDark: boolean }) => (
  <div className={`font-mono text-[10px] uppercase tracking-widest font-bold mb-2 opacity-50 px-2 ${isDark ? "text-white" : "text-slate-800"}`}>
    {title}
  </div>
);

export const SettingsGroup = ({ children, isDark, className = "" }: { children: React.ReactNode; isDark: boolean; className?: string }) => (
  <div className={`rounded-xl overflow-hidden ${isDark ? "bg-[#1a1d24] border border-white/5" : "bg-white shadow-sm border border-black/5"} ${className}`}>
    {children}
  </div>
);

export const ToggleSwitch = ({ isOn, onToggle, isDark }: { isOn: boolean, onToggle: () => void, isDark: boolean }) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle();
  };
  
  return (
    <div 
      onClick={handleToggle}
      className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isOn ? 'bg-emerald-500' : (isDark ? 'bg-gray-600' : 'bg-slate-300')}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-sm flex-shrink-0 ${isOn ? 'ml-auto' : 'mr-auto'}`} />
    </div>
  );
};

interface SettingsToggleRowProps extends Omit<SettingsRowProps, 'rightElement' | 'onClick'> {
  isOn: boolean;
  onToggle: () => void;
}

export const SettingsToggleRow = ({ icon, iconBg, iconColor, title, subtitle, isOn, isDark, onToggle }: SettingsToggleRowProps) => (
  <SettingsRow
    icon={icon}
    iconBg={iconBg}
    iconColor={iconColor}
    title={title}
    subtitle={subtitle}
    isDark={isDark}
    rightElement={<ToggleSwitch isOn={isOn} onToggle={onToggle} isDark={isDark} />}
    onClick={onToggle}
  />
);