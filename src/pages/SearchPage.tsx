import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SearchForm } from '../components/SearchForm';
import { PlaceCard } from '../components/PlaceCard';
import { Message, RequestView } from '../components/Feedback';
import { MapView } from '../components/MapView';
import { useRequest } from '../hooks/useRequest';
import { parkingApi } from '../services/parkingApi';
import type { Place } from '../domain/parking';

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const load = useCallback(
    (signal: AbortSignal) => parkingApi.searchPlaces(query, signal),
    [query],
  );
  const { state, retry } = useRequest(load, query);
  return (
    <>
      <PageHeader title="목적지 검색" />
      <div className="page">
        <SearchForm key={query} initialValue={query} />
        <RequestView state={state} retry={retry}>
          {(data) => (
            <>
              <div className="section-heading search-result-heading">
                <h2>{query ? `‘${query}’ 검색 결과` : '목적지를 입력해 주세요'}</h2>
                <span className="muted">{data.total}곳</span>
              </div>
              {data.items.length ? (
                <SearchResults places={data.items} query={query} />
              ) : (
                <Message title={query ? '검색 결과가 없어요' : '어디로 가실 예정인가요?'}>
                  등록된 목적지의 이름이나 지역명으로 검색해 주세요.
                </Message>
              )}
            </>
          )}
        </RequestView>
      </div>
    </>
  );
}

function SearchResults({ places, query }: { places: Place[]; query: string }) {
  const points = useMemo(
    () =>
      places.map((place) => ({
        id: place.id,
        label: place.name,
        coordinates: place.coordinates,
        kind: 'place' as const,
      })),
    [places],
  );
  return (
    <>
      <MapView points={points} label="검색한 목적지 위치 지도" />
      <p className="fine-print map-caption">
        목적지를 선택하면 연결된 주차장과 주변 주차장을 확인할 수 있어요.
      </p>
      <div className="card-list">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} search={`?q=${encodeURIComponent(query)}`} />
        ))}
      </div>
    </>
  );
}
