import React from 'react';
import { Inbox, AlertTriangle, RefreshCw, LifeBuoy } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  isDark?: boolean;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  const { t } = useI18n();
  return (
  <div className="flex flex-col items-center justify-center text-center px-6 py-12">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted text-muted-foreground">
      {icon ?? <Inbox size={32} />}
    </div>
    <div className="text-sm font-semibold text-foreground">{title}</div>
    {description && <div className="text-xs mt-1 max-w-xs text-muted-foreground">{description}</div>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 text-sm font-medium px-4 py-2 rounded-lg min-h-11 bg-primary text-primary-foreground active:scale-95 transition-transform"
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
  isDark?: boolean;
}

export const ErrorState = ({ message, description, code, retryAction, supportAction }: ErrorStateProps) => {
  const { t } = useI18n();
  return (
  <div className="flex flex-col items-center justify-center text-center px-6 py-12">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-destructive/10 text-destructive">
      <AlertTriangle size={32} />
    </div>
    <div className="text-sm font-semibold text-foreground">{message}</div>
    {description && <div className="text-xs mt-1 max-w-xs text-muted-foreground">{description}</div>}
    {code && <div className="text-xs font-mono mt-1 text-muted-foreground">{code}</div>}
    <div className="flex items-center gap-2 mt-4">
      {retryAction && (
        <button
          onClick={retryAction}
          aria-label={t('ui.retry')}
          title={t('ui.retry')}
          className="flex items-center justify-center gap-2 min-h-11 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground active:scale-95 transition-transform"
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
          className="flex items-center justify-center gap-2 min-h-11 px-3 text-sm font-medium rounded-lg transition-colors active:scale-95 text-muted-foreground hover:bg-muted"
        >
          <LifeBuoy size={16} />
          <span>{t('ui.contactSupport')}</span>
        </button>
      )}
    </div>
  </div>
  );
};
