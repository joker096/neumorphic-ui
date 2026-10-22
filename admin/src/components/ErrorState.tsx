import { useAdminI18n } from '../lib/i18n'

interface ErrorStateProps {
  /** Server-provided message; a localized generic message is used when absent. */
  message?: string
  /** Retry handler; the button is hidden when it is not given. */
  onRetry?: () => void
}

/**
 * Inline error panel for a failed panel load.
 *
 * The admin pages used to swallow every request error, so a rate-limited or
 * unreachable backend left an empty page with no explanation.
 */
export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useAdminI18n()

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4"
    >
      <span className="text-sm text-red-400">{message || t('common.loadFailed')}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 rounded-lg bg-[var(--bg-tertiary)] text-sm text-[var(--text-primary)] hover:opacity-80"
        >
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}
