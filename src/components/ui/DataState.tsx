import React from 'react';
import { AlertTriangle, Lock, ShieldAlert, Trash2, WifiOff, Loader2, Inbox, Search, RefreshCw } from 'lucide-react';
import { EmptyState, ErrorState } from './States';
import { useI18n } from '../../lib/i18n';

export type DataStatus =
  | 'loading'
  | 'loaded'
  | 'empty'
  | 'error'
  | 'offline'
  | 'partial'
  | 'unauthorized'
  | 'restricted'
  | 'deleted';

export interface DataStateProps {
  status: DataStatus;
  isDark?: boolean;
  /** Текст/заголовок для empty/error/offline/... */
  title?: string;
  description?: string;
  /** Действие для empty/offline (например, "Создать чат") */
  action?: { label: string; onClick: () => void };
  /** Повтор при error/offline */
  retryAction?: () => void;
  supportAction?: () => void;
  code?: string;
  /** Дочерний контент, отображаемый при status === 'loaded' или 'partial' */
  children?: React.ReactNode;
  /** Иконка empty-состояния (search — для «ничего не найдено», inbox — по умолчанию) */
  emptyIcon?: 'search' | 'inbox';
}

const WRAPPER = 'flex flex-col items-center justify-center text-center px-6 py-12';
const ICON_BOX = 'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted text-muted-foreground';
const TITLE = 'text-sm font-semibold text-foreground';
const SUBTEXT = 'text-xs mt-1 max-w-xs text-muted-foreground';
const PRIMARY_BTN = 'text-sm font-medium px-4 py-2 rounded-lg min-h-11 bg-primary text-primary-foreground active:scale-95 transition-transform';
const GHOST_BTN = 'text-sm font-medium px-4 py-2 rounded-lg min-h-11 transition-colors active:scale-95 text-primary';

/**
 * Единый компонент состояний данных (бриф §16.2).
 * Покрывает все 9 обязательных состояний одним API.
 */
export const DataState = ({
  status,
  title,
  description,
  action,
  retryAction,
  supportAction,
  code,
  children,
  emptyIcon,
}: DataStateProps) => {
  const { t } = useI18n();
  if (status === 'loaded') return <>{children}</>;
  if (status === 'partial') {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 text-[12px] bg-amber-500/10 text-amber-500">
          <AlertTriangle size={14} />
          <span>{title ?? t('dataState.partial')}</span>
        </div>
        {children}
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={WRAPPER}>
        <Loader2 size={32} className="animate-spin mb-4 text-primary" />
        <div className="text-sm text-muted-foreground">{title ?? t('dataState.loading')}</div>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <EmptyState
        icon={emptyIcon === 'search' ? <Search size={32} /> : <Inbox size={32} />}
        title={title ?? t('dataState.empty')}
        description={description}
        action={action}
      />
    );
  }

  if (status === 'error') {
    return <ErrorState message={title ?? t('dataState.error')} description={description} code={code} retryAction={retryAction} supportAction={supportAction} />;
  }

  if (status === 'offline') {
    return (
      <div className={WRAPPER}>
        <div className={ICON_BOX}>
          <WifiOff size={32} />
        </div>
        <div className={TITLE}>{title ?? t('dataState.offline')}</div>
        {description && <div className={SUBTEXT}>{description}</div>}
        <div className="flex items-center gap-2 mt-4">
          {retryAction && (
            <button onClick={retryAction} aria-label={t('ui.retry')} title={t('ui.retry')} className="flex items-center justify-center gap-2 min-h-11 px-3 text-sm font-medium rounded-lg bg-primary text-primary-foreground active:scale-95 transition-transform">
              <RefreshCw size={16} />
              <span>{t('ui.retry')}</span>
            </button>
          )}
          {action && (
            <button onClick={action.onClick} className={GHOST_BTN}>
              {action.label}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className={WRAPPER}>
        <div className={ICON_BOX}>
          <Lock size={32} />
        </div>
        <div className={TITLE}>{title ?? t('dataState.unauthorized')}</div>
        {description && <div className={SUBTEXT}>{description}</div>}
        {action && (
          <button onClick={action.onClick} className={`mt-4 ${PRIMARY_BTN}`}>
            {action.label}
          </button>
        )}
      </div>
    );
  }

  if (status === 'restricted') {
    return (
      <div className={WRAPPER}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-rose-500/10 text-rose-500">
          <ShieldAlert size={32} />
        </div>
        <div className={TITLE}>{title ?? t('dataState.restricted')}</div>
        {description && <div className={SUBTEXT}>{description}</div>}
      </div>
    );
  }

  if (status === 'deleted') {
    return (
      <div className={WRAPPER}>
        <div className={ICON_BOX}>
          <Trash2 size={32} />
        </div>
        <div className={TITLE}>{title ?? t('dataState.deleted')}</div>
        {description && <div className={SUBTEXT}>{description}</div>}
      </div>
    );
  }

  return <>{children}</>;
};
