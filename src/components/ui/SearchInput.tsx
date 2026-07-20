import React, { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isDark?: boolean
  /** rounded = rounded-xl (default), pill = rounded-full */
  shape?: 'pill' | 'rounded'
  /** Show search icon on the left */
  showSearchIcon?: boolean
  /** Center text alignment (for dialer mode) */
  centered?: boolean
  /** Large text (20px bold) for dialer mode */
  large?: boolean
  /** Additional element rendered after the clear button */
  rightElement?: React.ReactNode
  maxLength?: number
  className?: string
  autoFocus?: boolean
  id?: string
  role?: string
  inputMode?: 'text' | 'tel' | 'numeric' | 'search'
  type?: string
  onFocus?: () => void
  onBlur?: () => void
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  isDark = true,
  shape = 'rounded',
  showSearchIcon = true,
  centered = false,
  large = false,
  rightElement,
  maxLength,
  className = '',
  autoFocus,
  id,
  role,
  inputMode,
  type = 'text',
  onFocus,
  onBlur,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const hasValue = value.length > 0

  const handleFocus = () => {
    setFocused(true)
    onFocus?.()
  }

  const handleBlur = () => {
    setFocused(false)
    onBlur?.()
  }

  const handleWrapperClick = () => {
    inputRef.current?.focus()
  }

  const isPill = shape === 'pill'

  if (isPill) {
    const radius = 'rounded-full'
    const wrapperBase = `w-full flex items-center gap-2 border transition-all duration-300 cursor-text ${radius} ${large ? 'h-12 px-6' : 'h-11 px-4'}`
    const wrapperVariant = isDark
      ? `bg-[#13151b] border-white/10 focus-within:border-orange-500/50 ${large ? '' : ''}`
      : `bg-[#f4f7f9] border-black/10 focus-within:border-orange-500/50`

    const inputSize = large ? 'text-[20px] font-bold tracking-[0.1em]' : 'text-sm font-medium'
    const inputColor = isDark
      ? 'text-white placeholder:text-gray-500'
      : 'text-slate-800 placeholder:text-slate-400'

    const iconColor = isDark
      ? focused ? 'text-orange-400' : 'text-gray-500'
      : focused ? 'text-orange-500' : 'text-slate-400'

    const actionBtn = isDark
      ? 'text-gray-500 hover:text-white hover:bg-white/10'
      : 'text-slate-400 hover:text-slate-800 hover:bg-black/10'

    const btnClass = `shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${actionBtn}`

    return (
      <div
        className={`${wrapperBase} ${wrapperVariant} ${className}`}
        onClick={handleWrapperClick}
      >
        {showSearchIcon && (
          <Search
            size={large ? 18 : 16}
            strokeWidth={1.75}
            className={`shrink-0 transition-colors ${iconColor}`}
          />
        )}
        <input
          ref={inputRef}
          id={id}
          role={role}
          type={type}
          inputMode={inputMode}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(
            maxLength ? e.target.value.slice(0, maxLength) : e.target.value
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`flex-1 min-w-0 bg-transparent border-none outline-none ${centered ? 'text-center' : ''} ${inputSize} ${inputColor}`}
          aria-label={placeholder}
        />
        {hasValue && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className={btnClass}
            aria-label="Clear"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
        {rightElement}
      </div>
    )
  }

  const inputSize = large ? 'text-[20px] font-bold tracking-[0.1em]' : 'text-sm font-medium'
  const inputColor = isDark
    ? 'text-white placeholder:text-gray-500'
    : 'text-slate-800 placeholder:text-slate-400'
  const iconColor = isDark
    ? focused ? 'text-orange-400' : 'text-gray-500'
    : focused ? 'text-orange-500' : 'text-slate-400'
  const actionBtn = isDark
    ? 'text-gray-500 hover:text-white hover:bg-white/10'
    : 'text-slate-400 hover:text-slate-800 hover:bg-black/10'
  const btnClass = `shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-colors ${actionBtn}`
  const borderFocus = 'focus-within:border-orange-500/50'

  return (
    <div className={`w-full shrink-0 ${className}`}>
      <div
        className={`relative flex items-center ${hasValue || rightElement ? '' : ''}`}
        onClick={handleWrapperClick}
      >
        {showSearchIcon && (
          <Search
            size={16}
            strokeWidth={1.75}
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors pointer-events-none ${iconColor}`}
          />
        )}
        <input
          ref={inputRef}
          id={id}
          role={role}
          type={type}
          inputMode={inputMode}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(
            maxLength ? e.target.value.slice(0, maxLength) : e.target.value
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full rounded-xl border text-sm focus:outline-none transition-colors ${
            isDark
              ? 'bg-[#1a1d24] border-white/10 text-white placeholder:text-gray-500'
              : 'bg-white border-black/10 text-slate-800 placeholder:text-slate-400'
          } ${borderFocus} ${showSearchIcon ? 'pl-9' : 'pl-4'} ${hasValue || rightElement ? 'pr-12' : 'pr-4'} py-2.5`}
          aria-label={placeholder}
        />
        {(hasValue || rightElement) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasValue && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange('') }}
                className={btnClass}
                aria-label="Clear"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}
            {rightElement}
          </div>
        )}
      </div>
    </div>
  )
}
