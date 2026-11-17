import { useCallback, useEffect, useState } from 'react';

type RequestState<T> =
  { status: 'loading' } | { status: 'success'; data: T } | { status: 'error'; error: Error };
export function useRequest<T>(load: (signal: AbortSignal) => Promise<T>, key: string) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; state: RequestState<T> }>({
    key,
    state: { status: 'loading' },
  });
  useEffect(() => {
    const controller = new AbortController();
    setResult({ key, state: { status: 'loading' } });
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, state: { status: 'success', data } });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            state: {
              status: 'error',
              error: error instanceof Error ? error : new Error('정보를 불러오지 못했어요.'),
            },
          });
      });
    return () => controller.abort();
  }, [load, key, attempt]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { state: result.key === key ? result.state : { status: 'loading' as const }, retry };
}
