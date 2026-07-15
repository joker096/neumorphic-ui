import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface FormFieldProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'search'
  autoComplete?: string
  autoFocus?: boolean
  error?: string
  disabled?: boolean
  theme?: 'light' | 'dark'
  className?: string
  icon?: LucideIcon
  iconAction?: () => void
  iconTooltip?: string
  monospace?: boolean
  maxLength?: number
  onKeyDown?: (e: React.KeyboardEvent) => void
}

const inputBase = (isDark: boolean, hasError?: boolean) =>
  `w-full h-12 px-4 rounded-xl text-sm outline-none border-2 transition-all ${
    isDark
      ? `bg-[#13151b] text-white placeholder:text-gray-500 ${
          hasError
            ? 'border-red-500 focus:border-red-500'
            : 'border-white/10 focus:border-orange-500'
        }`
      : `bg-slate-50 text-slate-800 placeholder:text-slate-400 ${
          hasError
            ? 'border-red-500 focus:border-red-500'
            : 'border-black/5 focus:border-orange-500'
        }`
  }`

export const FormField = ({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  inputMode,
  autoComplete,
  autoFocus,
  error,
  disabled,
  theme = 'dark',
  className = '',
  icon: Icon,
  iconAction,
  iconTooltip,
  monospace,
  maxLength,
  onKeyDown,
}: FormFieldProps) => {
  const isDark = theme === 'dark'

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className={`text-[11px] font-bold uppercase tracking-widest ${
          isDark ? 'text-gray-400' : 'text-slate-500'
        }`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength || 999))}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className={`${inputBase(isDark, !!error)} ${monospace ? 'font-mono tracking-wider' : ''} ${
            Icon ? 'pr-12' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {Icon && (
          <button
            type="button"
            onClick={iconAction}
            title={iconTooltip}
            disabled={disabled}
            className={`absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-colors ${
              isDark
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-black/5 hover:bg-black/10 text-slate-800'
            } ${disabled ? 'opacity-50' : ''}`}
          >
            <Icon size={16} />
          </button>
        )}
      </div>
      {error && (
        <span className="text-[11px] font-medium text-red-500 ml-1">
          {error}
        </span>
      )}
    </div>
  )
}
