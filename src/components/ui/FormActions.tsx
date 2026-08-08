import React from 'react'

interface FormActionsProps {
  submitLabel: string
  cancelLabel?: string
  onSubmit?: () => void
  onCancel?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'default' | 'danger'
  theme?: 'light' | 'dark'
  className?: string
}

export const FormActions = ({
  submitLabel,
  cancelLabel,
  onSubmit,
  onCancel,
  disabled,
  loading,
  variant = 'default',
  theme = 'dark',
  className = '',
}: FormActionsProps) => {
  const isDark = theme === 'dark'

  const submitBg =
    variant === 'danger'
       ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20'
       : 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20'

  return (
    <div className={`flex gap-3 mt-4 ${className}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className={`flex-1 h-12 rounded-xl font-bold transition-all active:scale-95 ${
            isDark
              ? 'bg-white/10 hover:bg-white/20 text-gray-300'
              : 'bg-black/5 hover:bg-black/10 text-slate-700'
          }`}
        >
          {cancelLabel || 'Cancel'}
        </button>
      )}
      <button
        type="button"
        onClick={() => { if (!disabled && !loading) onSubmit?.() }}
        className={`flex-1 h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${
          disabled || loading
            ? 'opacity-50 cursor-not-allowed text-white/50 bg-gray-500'
            : `${submitBg} text-[var(--text-primary)]`
        }`}
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {submitLabel}
      </button>
    </div>
  )
}

