import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const MAX_CACHED = 100;
const cache = new Map<string, unknown>();

/** Forget every cached response. Called on sign-in and sign-out so one person's data is never shown to the next. */
export const clearApiCache = () => cache.clear();

function remember(path: string, value: unknown) {
  cache.delete(path);
  cache.set(path, value);
  if (cache.size > MAX_CACHED) cache.delete(cache.keys().next().value!);
}

/**
 * Fetches `path` on mount and whenever it changes. A response seen before is shown straight away and refreshed in
 * the background, so returning to a screen never starts from empty. While a new path loads, the previous data stays.
 */
export function useApi<T>(path: string) {
  const [data, setState] = useState<T | undefined>(() => cache.get(path) as T | undefined);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cached = cache.get(path) as T | undefined;
    if (cached !== undefined) setState(cached);
    setLoading(true);
    api<T>(path)
      .then((result) => {
        if (cancelled) return;
        remember(path, result);
        setState(result);
        setError('');
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [path]);

  const setData = useCallback(
    (value: T) => {
      remember(path, value);
      setState(value);
    },
    [path],
  );

  return { data, setData, error, loading };
}

export function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · Murang'a Service Requests`;
  }, [title]);
}
