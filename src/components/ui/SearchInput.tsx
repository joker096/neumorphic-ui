import React, { useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useI18n } from '../../lib/i18n'

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
  placeholder,
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
  const { t } = useI18n()
  const resolvedPlaceholder = placeholder ?? t('common.searchPlaceholder')
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

  const inputSize = large ? 'text-[length:var(--text-h3)] font-bold tracking-[0.1em]' : 'text-[length:var(--text-body-small)] font-medium'
  const inputColor = 'text-foreground placeholder:text-muted-foreground'
  const iconColor = focused ? 'text-primary' : 'text-muted-foreground'
  const actionBtn = 'text-muted-foreground hover:text-foreground hover:bg-muted'
  const btnClass = `shrink-0 min-w-[var(--control-height-md)] min-h-[var(--control-height-md)] flex items-center justify-center rounded-full transition-colors ${actionBtn}`
  // Inputs are borderless: the cursor/placeholder is enough affordance.
  // Do NOT add a border or focus border here (see message composer style).
  if (isPill) {
    const wrapperVariant = isDark
      ? `bg-card`
      : `bg-background`
    const wrapperBase = `w-full flex items-center gap-2 transition-all duration-300 cursor-text rounded-full ${large ? 'h-12 px-[var(--spacing-24)]' : 'h-[var(--control-height-md)] px-[var(--spacing-16)]'}`

    return (
      <div
        className={`${wrapperBase} ${wrapperVariant} ${className}`}
        onClick={handleWrapperClick}
      >
        {showSearchIcon && (
          <Search
            size={large ? 18 : 16}
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
          placeholder={resolvedPlaceholder}
          className={`flex-1 h-full min-w-0 bg-transparent border-none outline-none ${centered ? 'text-center' : ''} ${inputSize} ${inputColor}`}
          aria-label={resolvedPlaceholder}
        />
        {hasValue && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange('') }}
            className={btnClass}
            aria-label={t('search.clear')}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
        {rightElement}
      </div>
    )
  }

  return (
    <div className={`w-full shrink-0 ${className}`}>
      <div
        className={`relative flex items-center ${hasValue || rightElement ? '' : ''}`}
        onClick={handleWrapperClick}
      >
        {showSearchIcon && (
          <Search
            size={16}
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
          placeholder={resolvedPlaceholder}
          className={`w-full h-[var(--control-height-md)] leading-[var(--control-height-md)] rounded-[var(--radius-control)] text-[length:var(--text-body-small)] focus:outline-none transition-colors ${
            isDark
              ? 'bg-muted text-foreground placeholder:text-muted-foreground'
              : 'bg-background text-foreground placeholder:text-muted-foreground'
          } ${showSearchIcon ? 'pl-10' : 'pl-[var(--spacing-16)]'} ${hasValue || rightElement ? 'pr-12' : 'pr-[var(--spacing-16)]'}`}
          aria-label={resolvedPlaceholder}
        />
        {(hasValue || rightElement) && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {hasValue && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onChange('') }}
                className={btnClass}
            aria-label={t('search.clear')}
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
