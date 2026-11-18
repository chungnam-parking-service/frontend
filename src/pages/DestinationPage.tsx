import { useMemo } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Clock3, MapPin, ParkingCircle } from 'lucide-react';
import { coordinateInfo, getParkingOptions, type PlaceParkingResponse } from '../domain/parking';
import { usePlaceParking } from '../hooks/usePlaceParking';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/PlaceCard';
import { Notice, RequestView } from '../components/Feedback';
import { ParkingCard, parkingPath } from '../components/ParkingCard';
import { MapView } from '../components/MapView';

export function DestinationPage() {
  const { placeId = '' } = useParams();
  const [params] = useSearchParams();
  const { state, retry } = usePlaceParking(placeId);
  return (
    <>
      <PageHeader
        title="목적지 주차 안내"
        backTo={params.has('q') ? `/search?${params.toString()}` : '/'}
      />
      <RequestView state={state} retry={retry}>
        {(data) => <DestinationContent data={data} />}
      </RequestView>
    </>
  );
}

function DestinationContent({ data }: { data: PlaceParkingResponse }) {
  const { place } = data;
  const { search } = useLocation();
  const navigate = useNavigate();
  const options = useMemo(() => getParkingOptions(data), [data]);
  const points = useMemo(
    () => [
      { id: place.id, label: place.name, coordinates: place.coordinates, kind: 'place' as const },
      ...options.map(({ lot }) => ({
        id: lot.id,
        label: `${lot.name} · ${coordinateInfo(lot).label}`,
        coordinates: lot.entranceCoordinates,
        kind: 'parking' as const,
      })),
    ],
    [place, options],
  );
  return (
    <div className="page destination-page">
      <div className="destination-heading">
        <p className="eyebrow">{place.category || '목적지'} · 충청남도</p>
        <h2>{place.name}</h2>
        <p className="address">
          <MapPin size={15} />
          {place.address || '주소 정보 없음'}
        </p>
        <p className="address">
          <Clock3 size={15} />
          {data.placeHoursDescription ?? '매장 운영시간 정보 없음'}
        </p>
      </div>
      {data.isDemo && <Notice>가상 매장과 좌표로 구성된 체험 데이터예요.</Notice>}
      <section className={`parking-summary parking-summary-${place.parkingStatus}`}>
        <StatusBadge status={place.parkingStatus} />
        <h3>{place.parkingSummary}</h3>
        <p>
          {place.parkingStatus === 'available'
            ? '요금과 입구 안내를 확인하고 출발하세요. 실시간 빈자리는 보장되지 않아요.'
            : place.parkingStatus === 'unavailable'
              ? '매장에 연결된 주차 시설은 없어요. 주변 주차장을 확인해 주세요.'
              : '주차 가능 여부가 아직 확인되지 않았어요. 방문 전 매장에 문의해 주세요.'}
        </p>
      </section>
      <MapView points={points} onSelect={(id) => navigate(parkingPath(place.id, id, search))} />
      <p className="fine-print map-caption">
        {options.length
          ? '주차장 핀이나 아래 목록을 선택해 주세요. 대표 위치는 실제 주차장이나 입구와 다를 수 있어요.'
          : '현재 확인된 목적지 위치만 표시하고 있어요.'}
      </p>
      <div className="section-heading">
        <h2>{data.primaryParking.length ? '이용할 주차장' : '주변 주차장'}</h2>
        <span className="muted">{options.length}곳</span>
      </div>
      {options.length ? (
        <div className="card-list">
          {options.map((option) => (
            <ParkingCard key={option.lot.id} option={option} placeId={place.id} search={search} />
          ))}
        </div>
      ) : (
        <section className="no-parking">
          <ParkingCircle size={30} />
          <h3>주변 주차장 정보도 준비 중이에요</h3>
          <p>확인된 정보가 생기면 이곳에 안내할게요.</p>
          <Link className="button button-secondary" to="/">
            다른 목적지 찾기
          </Link>
        </section>
      )}
    </div>
  );
}
