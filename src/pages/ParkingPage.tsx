import { useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Camera, Clock3, Footprints, MapPin, ShieldCheck, Ticket } from 'lucide-react';
import {
  formatVerifiedAt,
  walkingTime,
  coordinateInfo,
  isVerifiedEntrance,
  relationshipLabels,
  type ParkingLot,
  type PlaceParkingOption,
  type PlaceParkingResponse,
} from '../domain/parking';
import { PageHeader } from '../components/PageHeader';
import { ParkingResource } from '../components/ParkingResource';
import { NavigationButton } from '../components/NavigationButton';
import { MapView } from '../components/MapView';
import { Notice } from '../components/Feedback';
import { AccuracyFeedback } from '../components/AccuracyFeedback';

export function ParkingPage() {
  const { placeId = '' } = useParams();
  const { search } = useLocation();
  return (
    <>
      <PageHeader
        title="주차장 상세 정보"
        backTo={`/places/${encodeURIComponent(placeId)}${search}`}
      />
      <ParkingResource>
        {(data, option) => <ParkingContent key={option.lot.id} data={data} option={option} />}
      </ParkingResource>
    </>
  );
}

function EntrancePhoto({ lot }: { lot: ParkingLot }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="entrance-photo">
      {lot.entrancePhotoUrl && !failed ? (
        <img
          src={lot.entrancePhotoUrl}
          alt={`${lot.name} 입구 사진`}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="photo-placeholder">
          <Camera size={29} strokeWidth={1.5} />
          <span>{failed ? '입구 사진을 불러오지 못했어요' : '등록된 입구 사진이 없어요'}</span>
        </div>
      )}
    </div>
  );
}

function ParkingContent({
  data,
  option,
}: {
  data: PlaceParkingResponse;
  option: PlaceParkingOption;
}) {
  const { lot } = option;
  const { search } = useLocation();
  const verified = isVerifiedEntrance(lot);
  const info = coordinateInfo(lot);
  const primary = data.primaryParking.some((item) => item.lot.id === lot.id);
  const points = useMemo(
    () => [
      {
        id: lot.id,
        label: `${lot.name} · ${info.label}`,
        coordinates: lot.entranceCoordinates,
        kind: 'parking' as const,
      },
    ],
    [lot, info.label],
  );
  const walkPath = `/places/${encodeURIComponent(data.place.id)}/parking/${encodeURIComponent(lot.id)}/walk${search}`;
  return (
    <div className="parking-detail">
      <EntrancePhoto key={lot.entrancePhotoUrl} lot={lot} />
      <div className="page">
        <p className="eyebrow">{relationshipLabels[option.relationship]}</p>
        <h2 className="detail-title">{lot.name}</h2>
        <p className="address">
          <MapPin size={15} />
          {lot.address || '주소 정보 없음'}
        </p>
        {data.isDemo && <Notice>체험용 데이터예요. 실제 방문·길안내에 사용할 수 없어요.</Notice>}
        <section className="fee-panel">
          <div>
            <Ticket size={18} />
            <span>주차 혜택</span>
            <strong>{option.benefitDescription ?? '매장 할인 정보 없음'}</strong>
          </div>
          <div>
            <Ticket size={18} />
            <span>주차 요금</span>
            <strong>{lot.feeDescription ?? '정보 없음'}</strong>
          </div>
          <div>
            <Clock3 size={18} />
            <span>운영시간</span>
            <strong>{lot.hoursDescription ?? '정보 없음'}</strong>
          </div>
        </section>
        {primary && data.operatingHoursWarning && (
          <Notice warning>{data.operatingHoursWarning}</Notice>
        )}
        <section className="detail-section">
          <div className="section-heading">
            <h2>{info.title}</h2>
            <span className={`location-badge${verified ? ' verified' : ''}`}>{info.label}</span>
          </div>
          <MapView points={points} label={`${lot.name} 위치 지도`} />
          {!verified && <p className="fine-print map-caption">{info.description}</p>}
          <p className="entrance-guide">
            <MapPin size={17} />
            {lot.entranceGuide ?? '등록된 진입 안내가 없어요. 현장 표지판을 확인해 주세요.'}
          </p>
        </section>
        <section className="detail-section">
          <div className="section-heading">
            <h2>주차 등록·정산 방법</h2>
          </div>
          <div className="validation-panel">
            <Ticket size={23} />
            <p>
              {option.validationInstructions ??
                '등록·정산 방법 정보가 없어요. 주차장 현장 안내를 확인해 주세요.'}
            </p>
          </div>
        </section>
        <Link to={walkPath} className="walking-link">
          <Footprints size={19} />
          <span>{data.place.name}까지 도보 안내</span>
          <strong>{walkingTime(option)}</strong>
        </Link>
        <AccuracyFeedback placeId={data.place.id} lotId={lot.id} isDemo={data.isDemo} />
        <Link
          className="button button-secondary"
          to={`/places/${encodeURIComponent(data.place.id)}/report?${new URLSearchParams({ ...Object.fromEntries(new URLSearchParams(search)), lotId: lot.id })}`}
        >
          주차 정보 수정 제보
        </Link>
        <div className="freshness">
          <ShieldCheck size={15} />
          <span>
            {formatVerifiedAt(lot.verifiedAt)}
            {data.isDemo && ' · 예시 데이터'}
          </span>
        </div>
      </div>
      <div className="bottom-actions">
        <NavigationButton lot={lot} isDemo={data.isDemo} />
      </div>
    </div>
  );
}
