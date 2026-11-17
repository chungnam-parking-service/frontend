import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, TriangleAlert } from 'lucide-react';
import { ApiError } from '../services/ApiError';

export function Message({
  title,
  children,
  retry,
}: {
  title: string;
  children?: ReactNode;
  retry?: () => void;
}) {
  return (
    <section className="message">
      <Search size={32} aria-hidden="true" />
      <h1>{title}</h1>
      <p>{children}</p>
      {retry ? (
        <button className="button button-secondary" onClick={retry}>
          다시 시도
        </button>
      ) : (
        <Link className="button button-secondary" to="/">
          처음으로
        </Link>
      )}
    </section>
  );
}

export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      주차 정보를 불러오고 있어요.
    </div>
  );
}

type State<T> =
  { status: 'loading' } | { status: 'error'; error: Error } | { status: 'success'; data: T };
export function RequestView<T>({
  state,
  retry,
  children,
}: {
  state: State<T>;
  retry: () => void;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') {
    const missing = state.error instanceof ApiError && state.error.status === 404;
    return (
      <Message
        title={missing ? '목적지를 찾을 수 없어요' : '정보를 불러오지 못했어요'}
        retry={missing ? undefined : retry}
      >
        {state.error.message}
      </Message>
    );
  }
  return children(state.data);
}

export function Notice({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return (
    <div className={`notice${warning ? ' notice-warning' : ''}`}>
      <TriangleAlert size={17} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
