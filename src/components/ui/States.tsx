import React from 'react';
import { EMPTY_STATE_COLUMN_CLASS, STATE_SUBTEXT_CLASS } from './stateClasses';
import { Inbox, AlertTriangle, RefreshCw, LifeBuoy } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { PRIMARY_ACTION_BTN_CLASS } from './buttonClasses';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
  <div className={EMPTY_STATE_COLUMN_CLASS}>
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[var(--msg-bg-panel)] border border-[var(--border-color)] text-[var(--accent-soft)]">
      {icon ?? <Inbox size={32} />}
    </div>
    <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
    {description && <div className={STATE_SUBTEXT_CLASS}>{description}</div>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 text-sm font-medium px-4 py-2 rounded-lg min-h-11 bg-[var(--accent)] text-[var(--ink-on-saturate)] active:scale-95 transition-transform shadow-[var(--shadow-btn-primary)]"
      >
        {action.label}
      </button>
    )}
  </div>
  );
};

interface ErrorStateProps {
  message: string;
  description?: string;
  code?: string;
  retryAction?: () => void;
  supportAction?: () => void;
}

export const ErrorState = ({ message, description, code, retryAction, supportAction }: ErrorStateProps) => {
  const { t } = useI18n();
  return (
  <div className={EMPTY_STATE_COLUMN_CLASS}>
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/30">
      <AlertTriangle size={32} />
    </div>
    <div className="text-sm font-semibold text-[var(--text-primary)]">{message}</div>
    {description && <div className={STATE_SUBTEXT_CLASS}>{description}</div>}
    {code && <div className="text-xs font-mono mt-1 text-[var(--text-secondary)]">{code}</div>}
    <div className="flex items-center gap-2 mt-4">
      {retryAction && (
        <button
          onClick={retryAction}
          aria-label={t('ui.retry')}
          title={t('ui.retry')}
          className={PRIMARY_ACTION_BTN_CLASS}
        >
          <RefreshCw size={16} />
          <span>{t('ui.retry')}</span>
        </button>
      )}
      {supportAction && (
        <button
          onClick={supportAction}
          aria-label={t('ui.contactSupport')}
          title={t('ui.contactSupport')}
          className="flex items-center justify-center gap-2 min-h-11 px-3 text-sm font-medium rounded-lg transition-colors active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--msg-bg-panel-hover)]"
        >
          <LifeBuoy size={16} />
          <span>{t('ui.contactSupport')}</span>
        </button>
      )}
    </div>
  </div>
  );
};
