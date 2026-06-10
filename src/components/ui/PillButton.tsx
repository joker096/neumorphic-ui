import React from 'react';
import { Plus, CheckCheck, ChevronDown } from 'lucide-react';

interface PillButtonProps {
  label: string;
  subtitle?: string;
  rightIcon?: string;
  hasDropdown?: boolean;
  glowColor?: string;
  isLarge?: boolean;
  theme?: 'light' | 'dark';
  active?: boolean;
  onClick?: () => void;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  subtitle,
  rightIcon,
  hasDropdown = false,
  glowColor = 'orange',
  isLarge = false,
  theme = 'dark',
  active = false,
  onClick,
}) => {
  const isDark = theme === 'dark';
  return (
    <div
      onClick={onClick}
      className={`relative flex items-center shrink-0 cursor-pointer group transition-transform hover:scale-[1.02] active:scale-95 ${
        isLarge
          ? 'w-full h-[52px] justify-center flex-col'
          : 'w-[110px] h-[48px] justify-between px-2.5'
      }`}
    >
      <div
        className={`absolute inset-0 rounded-full flex items-center justify-center font-bold tracking-wide transition-all z-10 ${
          isDark
            ? active
              ? 'bg-[#1a1d24] shadow-[0_6px_16px_rgba(0,0,0,0.8),_inset_0_1px_2px_rgba(255,255,255,0.06),_inset_0_-2px_4px_rgba(0,0,0,0.9)] border border-white/[0.04]'
              : 'bg-[#15171d] hover:bg-[#1a1d24] shadow-[0_4px_10px_rgba(0,0,0,0.4),_inset_0_1px_1px_rgba(255,255,255,0.03),_inset_0_-1px_2px_rgba(0,0,0,0.5)] border border-white/[0.02]'
            : active
              ? 'bg-[#f4f7f9] shadow-[-6px_-6px_14px_rgba(255,255,255,1),_8px_10px_20px_rgba(165,175,190,0.3),_inset_1px_1px_2px_rgba(255,255,255,1)] border border-white/90'
              : 'bg-[#eef2f6] hover:bg-[#f4f7f9] shadow-[-2px_-2px_6px_rgba(255,255,255,0.7),_4px_6px_10px_rgba(165,175,190,0.2),_inset_1px_1px_2px_rgba(255,255,255,0.5)] border border-white/50'
        }`}
      />

      <div
        className={`relative z-20 flex flex-col justify-center w-full ${
          isLarge ? 'items-center' : 'items-start pl-0.5'
        }`}
      >
        <span
          className={`${
            isLarge ? 'text-[14px] w-full text-center' : 'text-[12px] font-bold'
          } leading-[14px] transition-colors ${
            active
              ? isDark
                ? 'text-white font-bold drop-shadow-sm'
                : 'text-slate-900 font-bold drop-shadow-sm'
              : isDark
                ? 'text-white font-bold group-hover:text-white'
                : 'text-slate-900 font-bold group-hover:text-slate-800'
          } leading-[14px] transition-colors ${
            active
              ? isDark
                ? 'text-white drop-shadow-sm'
                : 'text-slate-800 drop-shadow-sm'
              : isDark
                ? 'text-gray-400 group-hover:text-white'
                : 'text-slate-500 group-hover:text-slate-800'
          }`}
        >
          {label}
        </span>
        {!isLarge && subtitle && (
          <span
            className={`text-[8.5px] font-semibold opacity-60 leading-tight transition-colors ${
              active
                ? isDark
                  ? 'text-gray-300'
                  : 'text-slate-600'
                : isDark
                  ? 'text-gray-500'
                  : 'text-slate-400'
            }`}
          >
            {subtitle}
          </span>
        )}
      </div>

      {!isLarge && rightIcon === 'plus' && (
        <Plus
          size={14}
          strokeWidth={3}
          className={`relative z-20 shrink-0 transition-colors ${
            active
              ? isDark
                ? 'text-white drop-shadow-sm'
                : 'text-slate-800 drop-shadow-sm'
              : isDark
                ? 'text-gray-500 group-hover:text-white'
                : 'text-slate-400 group-hover:text-slate-800'
          }`}
        />
      )}
      {!isLarge && rightIcon === 'check' && (
        <CheckCheck
          size={14}
          strokeWidth={2.5}
          className={`relative z-20 shrink-0 transition-colors ${
            active
              ? isDark
                ? 'text-white'
                : 'text-slate-800'
              : isDark
                ? 'text-gray-500'
                : 'text-slate-400'
          }`}
        />
      )}
      {!isLarge && rightIcon === 'toggle' && (
        <div
          className={`relative z-20 shrink-0 w-[16px] h-[10px] rounded-full shadow-inner flex items-center ${
            active ? 'bg-orange-500' : isDark ? 'bg-[#0a0b0e]' : 'bg-[#ced6e0]'
          } transition-colors px-[1px]`}
        >
          <div
            className={`w-[8px] h-[8px] rounded-full shadow-md bg-white transition-transform ${
              active ? 'translate-x-[6px]' : 'translate-x-0'
            }`}
          />
        </div>
      )}

      {hasDropdown && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-80 group-hover:opacity-100 transition-opacity z-0">
          <ChevronDown
            size={14}
            className={
              isDark
                ? 'text-gray-500 group-hover:text-gray-300'
                : 'text-slate-400 group-hover:text-slate-600'
            }
            strokeWidth={3}
          />
          <div
            className={`absolute top-2 w-5 h-2 blur-[5px] rounded-full ${
              glowColor === 'orange'
                ? 'bg-orange-500'
                : glowColor === 'blue'
                  ? 'bg-blue-500'
                  : 'bg-teal-500'
            }`}
          />
        </div>
      )}
      {(isLarge || active) && (
        <>
          <div
            className={`absolute -bottom-1 left-1/2 -translate-x-1/2 ${
              isLarge ? 'w-24' : 'w-16'
            } h-3 ${
              glowColor === 'orange'
                ? 'bg-orange-500'
                : glowColor === 'blue'
                  ? 'bg-blue-500'
                  : 'bg-teal-500'
            } rounded-full blur-[10px] opacity-100 pointer-events-none z-0`}
          />
          <div
            className={`absolute -bottom-[1px] left-1/2 -translate-x-1/2 ${
              isLarge ? 'w-12' : 'w-8'
            } h-[2px] bg-white rounded-full blur-[1px] opacity-80 pointer-events-none z-20`}
          />
        </>
      )}
    </div>
  );
};
