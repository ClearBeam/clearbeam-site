import { useCallback, useEffect, useRef, useState } from "react";

type AsyncState<T> = {
  data: T | null;
  error: Error | null;
  loading: boolean;
  /** True only for the initial load, so pull-to-refresh doesn't blank the screen. */
  initialLoading: boolean;
  refresh: () => void;
};

/**
 * Run an async loader on mount and on demand. `loader` receives an AbortSignal;
 * results from a superseded call are discarded.
 */
export function useAsync<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const loadedOnce = useRef(false);
  const controller = useRef<AbortController | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(() => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setLoading(true);
    setError(null);

    loader(ctrl.signal)
      .then((result) => {
        if (ctrl.signal.aborted) return;
        setData(result);
        loadedOnce.current = true;
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  }, deps);

  useEffect(() => {
    run();
    return () => controller.current?.abort();
  }, [run]);

  return {
    data,
    error,
    loading,
    initialLoading: loading && !loadedOnce.current,
    refresh: run,
  };
}
