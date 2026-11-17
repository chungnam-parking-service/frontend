import { useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ExternalLink, Flag, Footprints, ParkingCircle } from 'lucide-react';
import {
  isVerifiedEntrance,
  type PlaceParkingOption,
  type PlaceParkingResponse,
} from '../domain/parking';
import { walkingUrl } from '../domain/navigation';
import { PageHeader } from '../components/PageHeader';
import { ParkingResource } from '../components/ParkingResource';
import { MapView } from '../components/MapView';
import { Notice } from '../components/Feedback';
import { parkingPath } from '../components/ParkingCard';

export function WalkingPage() {
  const { placeId = '', lotId = '' } = useParams();
  const { search } = useLocation();
  return (
    <>
      <PageHeader title="목적지까지 도보 안내" backTo={parkingPath(placeId, lotId, search)} />
      <ParkingResource>
        {(data, option) => <WalkingContent data={data} option={option} />}
      </ParkingResource>
    </>
  );
}

function WalkingContent({
  data,
  option,
}: {
  data: PlaceParkingResponse;
  option: PlaceParkingOption;
}) {
  const points = useMemo(
    () => [
      {
        id: option.lot.id,
        label: option.lot.name,
        coordinates: option.lot.entranceCoordinates,
        kind: 'parking' as const,
      },
      {
        id: data.place.id,
        label: data.place.name,
        coordinates: data.place.coordinates,
        kind: 'place' as const,
      },
    ],
    [data.place, option.lot],
  );
  return (
    <div className="page walking-page">
      <MapView points={points} label="주차장과 목적지 위치 지도" />
      <p className="fine-print map-caption">
        출발·도착 위치를 표시한 지도예요. 실제 도보 경로선은 제공되지 않아요.
      </p>
      <div className="section-heading">
        <h2>도보 예상 정보</h2>
        <Footprints size={20} />
      </div>
      <dl className="walking-stats">
        <div>
          <dt>도보 거리</dt>
          <dd>정보 없음</dd>
        </div>
        <div>
          <dt>예상 소요 시간</dt>
          <dd>
            {option.walkingMinutes !== null ? (
              <>
                {option.walkingMinutes}
                <span>분</span>
              </>
            ) : (
              '정보 없음'
            )}
          </dd>
        </div>
      </dl>
      <div className="route-endpoints">
        <div>
          <ParkingCircle size={19} />
          <span>
            출발지<strong>{option.lot.name}</strong>
          </span>
        </div>
        <div>
          <Flag size={18} />
          <span>
            도착지<strong>{data.place.name}</strong>
          </span>
        </div>
      </div>
      {!isVerifiedEntrance(option.lot) && (
        <Notice warning>
          출발 위치의 실제 입구가 확인되지 않았어요. 보행자 출구와 다를 수 있어요.
        </Notice>
      )}
      <section className="detail-section">
        <div className="section-heading">
          <h2>이렇게 이동하세요</h2>
        </div>
        {option.walkingSteps.length ? (
          <ol className="walking-steps">
            {option.walkingSteps.map((step, index) => (
              <li key={`${index}-${step}`}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted empty-walking">
            등록된 도보 동선이 없어요. 현장 안내나 외부 지도의 경로를 확인해 주세요.
          </p>
        )}
      </section>
      {data.isDemo ? (
        <Notice>체험용 예시 동선이에요. 실제 방문에는 사용할 수 없어요.</Notice>
      ) : (
        <a
          className="button button-primary"
          href={walkingUrl(option.lot, data.place)}
          target="_blank"
          rel="noreferrer"
        >
          <Footprints size={18} />
          카카오맵에서 도보 길찾기
          <ExternalLink size={16} />
        </a>
      )}
    </div>
  );
}
