import React, { useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

interface FormFieldProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  type?: string
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'search' | 'none'
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
  required?: boolean
  onKeyDown?: (e: React.KeyboardEvent) => void
  suffix?: React.ReactNode
}

// Inputs are borderless: the cursor/placeholder is enough affordance.
// No border or focus border (see message composer style).
const inputBase = (_isDark: boolean, hasError?: boolean) =>
  `w-full h-12 px-4 rounded-xl text-sm outline-none transition-all ${
    hasError
      ? 'bg-input-bg text-input-text placeholder:text-input-placeholder'
      : 'bg-input-bg text-input-text placeholder:text-input-placeholder'
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
  required,
  onKeyDown,
  suffix,
}: FormFieldProps) => {
  const isDark = theme === 'dark'
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          inputMode={inputMode}
          required={required}
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
            className={`absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-colors bg-muted hover:bg-muted text-foreground ${disabled ? 'opacity-50' : ''}`}
          >
            <Icon size={16} />
          </button>
        )}
        {suffix && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <span className="text-[11px] font-medium text-destructive ml-1">
          {error}
        </span>
      )}
    </div>
  )
}


