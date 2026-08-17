import React from 'react';
import { AlertTriangle, Lock, ShieldAlert, Trash2, WifiOff, Loader2, Inbox, Search } from 'lucide-react';
import { EmptyState, ErrorState } from './States';

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
}

const WRAPPER = 'flex flex-col items-center justify-center text-center px-6 py-12';
const ICON_BOX = 'w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-muted text-muted-foreground';
const TITLE = 'text-sm font-semibold text-foreground';
const SUBTEXT = 'text-xs mt-1 max-w-xs text-muted-foreground';
const PRIMARY_BTN = 'text-sm font-medium px-4 py-2 rounded-lg min-h-[40px] bg-primary text-primary-foreground active:scale-95 transition-transform';
const GHOST_BTN = 'text-sm font-medium px-4 py-2 rounded-lg min-h-[40px] transition-colors active:scale-95 text-primary';

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
}: DataStateProps) => {
  if (status === 'loaded') return <>{children}</>;
  if (status === 'partial') {
    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-4 py-2 text-[12px] bg-amber-500/10 text-amber-500">
          <AlertTriangle size={14} />
          <span>{title ?? 'Часть данных недоступна'}</span>
        </div>
        {children}
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className={WRAPPER}>
        <Loader2 size={28} className="animate-spin mb-4 text-primary" />
        <div className="text-sm text-muted-foreground">{title ?? 'Загрузка…'}</div>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <EmptyState
        icon={title?.includes('результат') ? <Search size={28} /> : <Inbox size={28} />}
        title={title ?? 'Здесь пока пусто'}
        description={description}
        action={action}
      />
    );
  }

  if (status === 'error') {
    return <ErrorState message={title ?? 'Что-то пошло не так'} code={code} retryAction={retryAction} supportAction={supportAction} />;
  }

  if (status === 'offline') {
    return (
      <div className={WRAPPER}>
        <div className={ICON_BOX}>
          <WifiOff size={28} />
        </div>
        <div className={TITLE}>{title ?? 'Нет соединения'}</div>
        {description && <div className={SUBTEXT}>{description}</div>}
        <div className="flex items-center gap-2 mt-4">
          {retryAction && (
            <button onClick={retryAction} className={PRIMARY_BTN}>
              Повторить
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
          <Lock size={28} />
        </div>
        <div className={TITLE}>{title ?? 'Требуется вход'}</div>
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
          <ShieldAlert size={28} />
        </div>
        <div className={TITLE}>{title ?? 'Доступ ограничен'}</div>
        {description && <div className={SUBTEXT}>{description}</div>}
      </div>
    );
  }

  if (status === 'deleted') {
    return (
      <div className={WRAPPER}>
        <div className={ICON_BOX}>
          <Trash2 size={28} />
        </div>
        <div className={TITLE}>{title ?? 'Удалено'}</div>
        {description && <div className={SUBTEXT}>{description}</div>}
      </div>
    );
  }

  return <>{children}</>;
};
