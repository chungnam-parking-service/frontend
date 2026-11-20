import { useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { SearchForm } from '../components/SearchForm';
import { PlaceCard } from '../components/PlaceCard';
import { Message, RequestView } from '../components/Feedback';
import { MapView } from '../components/MapView';
import { useRequest } from '../hooks/useRequest';
import { parkingApi } from '../services/parkingApi';
import { DEFAULT_SEARCH_LIMIT, MAX_SEARCH_LIMIT, type Place } from '../domain/parking';

export function SearchPage({ forReport = false }: { forReport?: boolean }) {
  const action = forReport ? '/report' : '/search';
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const limit =
    params.get('limit') === String(MAX_SEARCH_LIMIT) ? MAX_SEARCH_LIMIT : DEFAULT_SEARCH_LIMIT;
  const load = useCallback(
    (signal: AbortSignal) => parkingApi.searchPlaces(query, signal, { limit }),
    [query, limit],
  );
  const { state, retry } = useRequest(load, `${query}:${limit}`);
  const search = `?${new URLSearchParams({ q: query, limit: String(limit) })}`;
  return (
    <>
      <PageHeader title={forReport ? '제보할 목적지 찾기' : '목적지 검색'} />
      <div className="page">
        <SearchForm key={query} initialValue={query} action={action} />
        <p className="fine-print map-caption">
          등록된 충남 카페·식당을 검색해요. 시·군과 매장명을 함께 입력해 보세요.
        </p>
        <RequestView state={state} retry={retry}>
          {(data) => (
            <>
              <div className="section-heading search-result-heading">
                <h2>{query ? `‘${query}’ 검색 결과` : '목적지를 입력해 주세요'}</h2>
                <span className="muted">전체 {data.total.toLocaleString('ko-KR')}곳</span>
              </div>
              {data.items.length ? (
                <>
                  <SearchResults places={data.items} search={search} forReport={forReport} />
                  {data.total > data.items.length && (
                    <div className="search-limit-info">
                      <p className="muted">
                        전체 {data.total.toLocaleString('ko-KR')}곳 중 {data.items.length}곳을
                        표시하고 있어요.
                      </p>
                      {limit < MAX_SEARCH_LIMIT && data.items.length < MAX_SEARCH_LIMIT ? (
                        <Link
                          className="button button-secondary"
                          to={`${action}?${new URLSearchParams({ q: query, limit: String(MAX_SEARCH_LIMIT) })}`}
                        >
                          최대 50곳까지 보기
                        </Link>
                      ) : (
                        <p className="fine-print">
                          지역과 매장명을 함께 입력하면 더 정확하게 찾을 수 있어요.
                        </p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Message title={query ? '검색 결과가 없어요' : '어디로 가실 예정인가요?'}>
                  {query
                    ? '아직 등록되지 않은 매장은 검색되지 않아요. 매장 이름을 확인하거나 시·군과 매장명을 함께 입력해 주세요.'
                    : '충남 카페·식당의 이름이나 시·군으로 검색해 주세요.'}
                </Message>
              )}
            </>
          )}
        </RequestView>
      </div>
    </>
  );
}

function SearchResults({
  places,
  search,
  forReport,
}: {
  places: Place[];
  search: string;
  forReport: boolean;
}) {
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
        {forReport
          ? '정보를 제보할 매장을 선택해 주세요.'
          : '매장을 선택하면 연결된 주차장과 주변 주차장을 확인할 수 있어요.'}
      </p>
      <div className="card-list">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} search={search} forReport={forReport} />
        ))}
      </div>
    </>
  );
}
