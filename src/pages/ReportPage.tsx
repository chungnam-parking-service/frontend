import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { PageHeader } from '../components/PageHeader';
import { Notice, RequestView } from '../components/Feedback';
import { getParkingOptions, type PlaceParkingResponse } from '../domain/parking';
import { validateReport, type ReportInput, type ReportReceipt } from '../domain/contributions';
import { usePlaceParking } from '../hooks/usePlaceParking';
import { useSubmission } from '../hooks/useSubmission';
import { isMockMode, parkingApi } from '../services/parkingApi';

const fields = [
  ['entranceGuide', '차량 진입 안내', 500],
  ['feeDescription', '주차 요금', 300],
  ['hoursDescription', '운영시간', 300],
  ['benefitDescription', '매장 주차 혜택', 300],
  ['validationInstructions', '주차 등록·정산 방법', 500],
  ['comment', '관리자에게 남길 말 (비공개)', 1000],
] as const;

export function ReportPage() {
  const { placeId = '' } = useParams();
  const [params] = useSearchParams();
  const { state, retry } = usePlaceParking(placeId);
  const backParams = new URLSearchParams(params);
  backParams.delete('lotId');
  const backTo = `/places/${encodeURIComponent(placeId)}${backParams.size ? `?${backParams}` : ''}`;
  return (
    <>
      <PageHeader title="주차 정보 제보" backTo={backTo} />
      <div className="page report-page">
        <RequestView state={state} retry={retry}>
          {(data) => (
            <ReportForm
              key={`${placeId}:${params.get('lotId') ?? ''}`}
              data={data}
              initialLotId={params.get('lotId') ?? ''}
              backTo={backTo}
            />
          )}
        </RequestView>
      </div>
    </>
  );
}

function ReportForm({
  data,
  initialLotId,
  backTo,
}: {
  data: PlaceParkingResponse;
  initialLotId: string;
  backTo: string;
}) {
  const options = getParkingOptions(data);
  const [lotId, setLotId] = useState(
    options.some(({ lot }) => lot.id === initialLotId) ? initialLotId : '',
  );
  const [values, setValues] = useState<Partial<Record<(typeof fields)[number][0], string>>>({});
  const [steps, setSteps] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [photo, setPhoto] = useState<File>();
  const [preview, setPreview] = useState('');
  const [validationError, setValidationError] = useState('');
  const { submit, pending, result, error } = useSubmission<ReportReceipt>();
  const blocked = data.isDemo && !isMockMode;
  const mapPoints = useMemo(
    () => [
      {
        id: data.place.id,
        label: data.place.name,
        coordinates: data.place.coordinates,
        kind: 'place' as const,
      },
    ],
    [data.place],
  );

  useEffect(() => {
    if (!photo) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  function send(event: FormEvent) {
    event.preventDefault();
    if (blocked) return;
    try {
      const input: ReportInput = {
        ...(lotId ? { lotId } : {}),
        ...Object.fromEntries(
          Object.entries(values)
            .filter(([, value]) => value?.trim())
            .map(([key, value]) => [key, value?.trim()]),
        ),
        ...(steps.trim()
          ? {
              walkingSteps: steps
                .split('\n')
                .map((step) => step.trim())
                .filter(Boolean),
            }
          : {}),
        ...(latitude.trim() ? { entranceLatitude: Number(latitude) } : {}),
        ...(longitude.trim() ? { entranceLongitude: Number(longitude) } : {}),
      };
      const validated = validateReport(input, photo);
      setValidationError('');
      void submit((signal) => parkingApi.sendReport(data.place.id, validated, photo, signal));
    } catch (cause) {
      setValidationError(cause instanceof Error ? cause.message : '입력 내용을 확인해 주세요.');
    }
  }
  if (result)
    return (
      <section className="report-receipt" role="status">
        <h2>{isMockMode ? '체험용 제보를 완료했어요' : '제보를 접수했어요'}</h2>
        <p>
          {isMockMode
            ? '실제로 저장되지는 않아요. 접수 완료 화면을 체험하고 있어요.'
            : `접수 번호 ${result.id} · 검토 대기 중`}
        </p>
        <p>보내주신 정보는 확인 후 반영돼요. 지금 표시되는 주차 정보는 바로 바뀌지 않아요.</p>
        <Link className="button button-primary" to={backTo}>
          목적지로 돌아가기
        </Link>
      </section>
    );
  return (
    <>
      <p className="eyebrow">{data.place.name}</p>
      <h2 className="detail-title">알고 있는 정보만 알려주세요</h2>
      <p className="fine-print">
        수정할 항목만 입력해 주세요. 비워 둔 정보는 유지돼요. 제보는 확인 후 반영돼요.
      </p>
      {isMockMode && <Notice>체험용 제보예요. 사진과 내용은 서버에 저장되지 않아요.</Notice>}
      {blocked && (
        <Notice warning>서버 예시 데이터에는 제보할 수 없어요. 실제 목적지를 검색해 주세요.</Notice>
      )}
      <form onSubmit={send} className="report-form">
        <fieldset disabled={pending || blocked}>
          <label className="form-field">
            제보할 주차장
            <select value={lotId} onChange={(event) => setLotId(event.target.value)}>
              <option value="">목적지 전체 · 새 주차장 알림</option>
              {options.map(({ lot }) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))}
            </select>
          </label>
          {!lotId && (
            <p className="fine-print">새 주차장 정보는 관리자가 확인하고 별도로 등록해요.</p>
          )}
          {fields.slice(0, -1).map(([key, label, max]) => (
            <label className="form-field" key={key}>
              {label}
              <textarea
                maxLength={max}
                value={values[key] ?? ''}
                onChange={(event) => setValues({ ...values, [key]: event.target.value })}
              />
            </label>
          ))}
          <label className="form-field">
            목적지까지 도보 안내
            <textarea
              placeholder="한 줄에 한 단계씩, 최대 10단계"
              value={steps}
              maxLength={3010}
              onChange={(event) => setSteps(event.target.value)}
            />
          </label>
          <div className="form-field">
            <h3>실제 차량 입구 좌표 (선택)</h3>
            <p className="fine-print">
              매장 중심 대신 차량이 들어가는 입구 좌표를 입력해 주세요. 위도와 경도를 함께 입력해야
              해요.
            </p>
            <MapView
              points={mapPoints}
              label="차량 입구 위치 선택 지도"
              onPick={
                pending || blocked
                  ? undefined
                  : (point) => {
                      setLatitude(point.latitude.toFixed(6));
                      setLongitude(point.longitude.toFixed(6));
                    }
              }
            />
            <p className="fine-print">지도를 눌러 입구를 선택하거나 아래에 좌표를 입력해 주세요.</p>
            <div className="coordinate-fields">
              <label>
                위도
                <input
                  type="number"
                  step="any"
                  min="33"
                  max="39"
                  placeholder="36.8148"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                />
              </label>
              <label>
                경도
                <input
                  type="number"
                  step="any"
                  min="124"
                  max="132"
                  placeholder="127.1082"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                />
              </label>
            </div>
          </div>
          <label className="form-field">
            입구 사진 (선택 · JPG/PNG/WebP · 5MB 이하)
            <input
              key={photo ? 'selected' : 'empty'}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  validateReport({}, file);
                  setPhoto(file);
                  setValidationError('');
                } catch (cause) {
                  setValidationError((cause as Error).message);
                  event.target.value = '';
                }
              }}
            />
          </label>
          {preview && (
            <div className="report-photo">
              <img src={preview} alt="첨부할 입구 사진 미리보기" />
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setPhoto(undefined)}
              >
                사진 삭제
              </button>
            </div>
          )}
          <label className="form-field">
            관리자에게 남길 말 (비공개)
            <textarea
              maxLength={1000}
              value={values.comment ?? ''}
              onChange={(event) => setValues({ ...values, comment: event.target.value })}
            />
          </label>
          <p className="fine-print">
            사진에 차량번호나 사람 얼굴 등 개인정보가 포함되지 않도록 확인해 주세요.
          </p>
        </fieldset>
        {(validationError || error) && (
          <p role="alert" className="form-error">
            {validationError || error}
          </p>
        )}
        <button className="button button-primary" disabled={pending || blocked}>
          {pending ? '제보 보내는 중…' : '제보 보내기'}
        </button>
      </form>
    </>
  );
}
