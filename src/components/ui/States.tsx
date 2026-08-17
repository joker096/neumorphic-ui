import React from 'react';
import { Inbox, AlertTriangle, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  isDark?: boolean;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-12">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted text-muted-foreground">
      {icon ?? <Inbox size={28} />}
    </div>
    <div className="text-sm font-semibold text-foreground">{title}</div>
    {description && <div className="text-xs mt-1 max-w-xs text-muted-foreground">{description}</div>}
    {action && (
      <button
        onClick={action.onClick}
        className="mt-4 text-sm font-medium px-4 py-2 rounded-lg min-h-[40px] bg-primary text-primary-foreground active:scale-95 transition-transform"
      >
        {action.label}
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  message: string;
  code?: string;
  retryAction?: () => void;
  supportAction?: () => void;
  isDark?: boolean;
}

export const ErrorState = ({ message, code, retryAction, supportAction }: ErrorStateProps) => (
  <div className="flex flex-col items-center justify-center text-center px-6 py-12">
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-destructive/10 text-destructive">
      <AlertTriangle size={28} />
    </div>
    <div className="text-sm font-semibold text-foreground">{message}</div>
    {code && <div className="text-[11px] font-mono mt-1 text-muted-foreground">{code}</div>}
    <div className="flex items-center gap-2 mt-4">
      {retryAction && (
        <button
          onClick={retryAction}
          className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg min-h-[40px] bg-primary text-primary-foreground active:scale-95 transition-transform"
        >
          <RefreshCw size={15} /> Retry
        </button>
      )}
      {supportAction && (
        <button
          onClick={supportAction}
          className="text-sm font-medium px-4 py-2 rounded-lg min-h-[40px] transition-colors active:scale-95 text-muted-foreground hover:bg-muted"
        >
          Contact support
        </button>
      )}
    </div>
  </div>
);
