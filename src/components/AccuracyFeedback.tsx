import { useState } from 'react';
import { useSubmission } from '../hooks/useSubmission';
import { parkingApi, isMockMode } from '../services/parkingApi';
import { ApiError } from '../services/ApiError';

export function AccuracyFeedback({
  placeId,
  lotId,
  isDemo,
}: {
  placeId: string;
  lotId: string;
  isDemo: boolean;
}) {
  const [inaccurate, setInaccurate] = useState(false);
  const [comment, setComment] = useState('');
  const { submit, pending, result, error } = useSubmission<string>();
  const blocked = isDemo && !isMockMode;
  function send(accurate: boolean) {
    if (blocked) return;
    void submit(async (signal) => {
      try {
        await parkingApi.sendFeedback(
          placeId,
          lotId,
          { accurate, ...(comment.trim() ? { comment: comment.trim() } : {}) },
          signal,
        );
        return isMockMode
          ? '체험용 피드백을 보냈어요. 실제로 저장되지는 않아요.'
          : '피드백을 남겨주셔서 고맙습니다.';
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 409) return cause.message;
        throw cause;
      }
    });
  }
  return (
    <section className="contribution-panel" aria-label="주차 정보 정확도 피드백">
      <h2>주차 정보가 맞았나요?</h2>
      {result ? (
        <p role="status">{result}</p>
      ) : (
        <>
          <div className="feedback-buttons">
            <button
              className="button button-secondary"
              disabled={pending || blocked}
              onClick={() => send(true)}
            >
              맞아요
            </button>
            <button
              className="button button-secondary"
              disabled={pending || blocked}
              onClick={() => setInaccurate(true)}
            >
              달라요
            </button>
          </div>
          {inaccurate && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                send(false);
              }}
            >
              <label className="form-field">
                어떤 점이 달랐나요? (선택)
                <textarea
                  value={comment}
                  maxLength={300}
                  onChange={(event) => setComment(event.target.value)}
                  disabled={pending}
                />
              </label>
              <button className="button button-primary" disabled={pending}>
                {pending ? '보내는 중…' : '피드백 보내기'}
              </button>
            </form>
          )}
          {blocked && <p className="fine-print">서버 예시 데이터에는 피드백을 남길 수 없어요.</p>}
          {pending && <p role="status">피드백을 보내고 있어요.</p>}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </>
      )}
    </section>
  );
}
