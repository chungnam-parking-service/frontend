import { useEffect, useRef, useState } from 'react';

export function useSubmission<T>() {
  const active = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState('');
  useEffect(() => () => active.current?.abort(), []);
  async function submit(action: (signal: AbortSignal) => Promise<T>) {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError('');
    try {
      const value = await action(controller.signal);
      if (!controller.signal.aborted) setResult(value);
    } catch (cause) {
      if (!controller.signal.aborted)
        setError(cause instanceof Error ? cause.message : '요청을 처리하지 못했어요.');
    } finally {
      if (!controller.signal.aborted) setPending(false);
      if (active.current === controller) active.current = null;
    }
  }
  return { pending, result, error, submit };
}
