import { useState, useCallback, useRef } from 'react';
import type { DataStatus } from '../components/ui/DataState';

export interface AsyncState<T> {
  status: DataStatus;
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isEmpty: boolean;
  setLoading: () => void;
  setData: (data: T) => void;
  setError: (message: string, code?: string) => void;
  setEmpty: () => void;
  setOffline: () => void;
  setUnauthorized: () => void;
  setRestricted: () => void;
  setDeleted: () => void;
  /** Запуск async-функции с автоматическим управлением состоянием (бриф §16.2, §4.1) */
  run: (fn: () => Promise<T>, opts?: { isEmpty?: (d: T) => boolean }) => Promise<T | null>;
}

/**
 * Централизованное управление состояниями данных (бриф §16.2).
 * Гарантирует, что любой экран проходит через единый набор состояний:
 * loading / loaded / empty / error / offline / partial / unauthorized / restricted / deleted.
 */
export function useAsyncState<T>(): AsyncState<T> {
  const [status, setStatus] = useState<DataStatus>('loading');
  const [data, setDataState] = useState<T | null>(null);
  const [error, setErrorState] = useState<string | null>(null);
  const codeRef = useRef<string | undefined>(undefined);

  const setLoading = useCallback(() => {
    setStatus('loading');
    setErrorState(null);
  }, []);

  const setData = useCallback((d: T) => {
    setDataState(d);
    setStatus('loaded');
    setErrorState(null);
  }, []);

  const setError = useCallback((message: string, code?: string) => {
    codeRef.current = code;
    setErrorState(message);
    setStatus('error');
  }, []);

  const setEmpty = useCallback(() => {
    setDataState(null);
    setStatus('empty');
  }, []);

  const setOffline = useCallback(() => setStatus('offline'), []);
  const setUnauthorized = useCallback(() => setStatus('unauthorized'), []);
  const setRestricted = useCallback(() => setStatus('restricted'), []);
  const setDeleted = useCallback(() => setStatus('deleted'), []);

  const run = useCallback(
    async (fn: () => Promise<T>, opts?: { isEmpty?: (d: T) => boolean }) => {
      setLoading();
      try {
        const result = await fn();
        if (opts?.isEmpty?.(result)) {
          setEmpty();
        } else {
          setData(result);
        }
        return result;
      } catch (e: any) {
        if (e?.name === 'OfflineError' || e?.message?.includes('offline')) {
          setOffline();
        } else if (e?.name === 'UnauthorizedError') {
          setUnauthorized();
        } else if (e?.name === 'RestrictedError') {
          setRestricted();
        } else if (e?.name === 'DeletedError') {
          setDeleted();
        } else {
          setError(e?.message ?? 'Unknown error', e?.code);
        }
        return null;
      }
    },
    [setLoading, setEmpty, setData, setOffline, setUnauthorized, setRestricted, setDeleted, setError],
  );

  return {
    status,
    data,
    error,
    isLoading: status === 'loading',
    isEmpty: status === 'empty',
    setLoading,
    setData,
    setError,
    setEmpty,
    setOffline,
    setUnauthorized,
    setRestricted,
    setDeleted,
    run,
  };
}
