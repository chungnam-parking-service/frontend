import { useCallback } from 'react';
import { Footprints, MapPin, Navigation, Ticket } from 'lucide-react';
import { SearchForm } from '../components/SearchForm';
import { PlaceCard } from '../components/PlaceCard';
import { Loading } from '../components/Feedback';
import { useRequest } from '../hooks/useRequest';
import { isMockMode, parkingApi } from '../services/parkingApi';

export function HomePage() {
  const load = useCallback((signal: AbortSignal) => parkingApi.searchPlaces('충', signal), []);
  const { state, retry } = useRequest(load, 'home-places');
  const featured =
    state.status === 'success'
      ? [...state.data.items]
          .sort((a, b) => {
            const order = { available: 0, unavailable: 1, unknown: 2 };
            return order[a.parkingStatus] - order[b.parkingStatus];
          })
          .slice(0, 3)
      : [];
  return (
    <div className="home-page">
      <section className="hero">
        <p className="eyebrow">
          <span className="live-dot" />
          충남에서 시작하는 편안한 주차
        </p>
        <h1>
          가고 싶은 곳,
          <br />
          <span>주차부터 알아보고.</span>
        </h1>
        <p className="hero-description">
          주차장 입구부터 목적지까지,
          <br />
          차를 가져가도 괜찮을지 먼저 확인하세요.
        </p>
        <SearchForm />
        <p className="search-hint">
          <MapPin size={14} />
          천안, 아산, 공주 또는 매장명 검색
        </p>
      </section>
      <section className="home-examples">
        <p className="eyebrow">먼저 둘러보세요</p>
        <div className="section-heading">
          <h2>목적지마다 다른 주차 이야기</h2>
        </div>
        {state.status === 'loading' ? (
          <Loading />
        ) : state.status === 'error' ? (
          <div className="home-error">
            <p>목적지를 불러오지 못했어요. 직접 검색하거나 다시 시도해 주세요.</p>
            <button className="text-link" onClick={retry}>
              다시 시도
            </button>
          </div>
        ) : state.data.items.length ? (
          <div className="card-list">
            {featured.map((place) => (
              <PlaceCard key={place.id} place={place} featured />
            ))}
          </div>
        ) : (
          <p className="muted">등록된 목적지가 아직 없어요.</p>
        )}
        {isMockMode && <p className="fine-print">화면의 매장·위치·요금은 테스트용 예시입니다.</p>}
      </section>
      <section className="service-points" aria-label="서비스 특징">
        <div>
          <Navigation />
          <h2>매장 대신, 주차장 입구로</h2>
          <p>확인된 입구와 주차장 위치를 구분해 안내해요.</p>
        </div>
        <div>
          <Ticket />
          <h2>무료 주차 조건까지 한 번에</h2>
          <p>할인 조건과 주차 등록 방법을 확인해요.</p>
        </div>
        <div>
          <Footprints />
          <h2>차에서 내린 다음도 편하게</h2>
          <p>주차한 곳부터 목적지까지 이어드려요.</p>
        </div>
      </section>
    </div>
  );
}
