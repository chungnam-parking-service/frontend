import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpParkingApi } from '../src/services/parkingApi';
import { placeParkingData } from '../src/mocks/data';
import { mockParkingApi } from '../src/mocks/parkingApi';

afterEach(() => vi.useRealTimers());

describe('HTTP 어댑터', () => {
  it('검색어를 인코딩하고 계약에 맞는 응답을 반환한다', async () => {
    const body = { items: [placeParkingData[0].place], total: 1 };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(body));
    const api = createHttpParkingApi({ baseUrl: 'https://api.example.com/', fetcher });
    await expect(api.searchPlaces(' 천안 & 카페 ')).resolves.toEqual(body);
    expect(fetcher.mock.calls[0][0]).toBe(
      `https://api.example.com/places?query=${encodeURIComponent('천안 & 카페')}&limit=20`,
    );
  });
  it('검색 제한과 전체 일치 수를 별개로 처리한다', async () => {
    const body = { items: [placeParkingData[0].place], total: 1200 };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(body));
    const api = createHttpParkingApi({ baseUrl: '/backend', fetcher });
    await expect(api.searchPlaces('천안', undefined, { limit: 50 })).resolves.toEqual(body);
    expect(fetcher.mock.calls[0][0]).toBe('/backend/places?query=%EC%B2%9C%EC%95%88&limit=50');
  });
  it('추가 오류 필드와 내부 메시지는 화면 문구로 노출하지 않는다', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json({ message: 'INTERNAL_SQL_DETAIL' }, { status: 500 }));
    const api = createHttpParkingApi({ baseUrl: '/backend', fetcher });
    await expect(api.searchPlaces('천안')).rejects.toMatchObject({
      status: 500,
      message: '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
    });
  });
  it('404와 잘못된 응답 형식을 구분한다', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({}, { status: 404 }))
      .mockResolvedValueOnce(Response.json({ items: null, total: 1 }));
    const api = createHttpParkingApi({ baseUrl: '/backend', fetcher });
    await expect(api.getPlaceParking('missing')).rejects.toMatchObject({ status: 404 });
    await expect(api.searchPlaces('천안')).rejects.toMatchObject({ status: 502 });
  });
  it('JSON이 아닌 응답을 네트워크 오류와 구분한다', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('<html>proxy error</html>'));
    const api = createHttpParkingApi({ baseUrl: '/backend', fetcher });
    await expect(api.searchPlaces('천안')).rejects.toMatchObject({ status: 502 });
  });
  const hangingFetch: typeof fetch = (_url, options) =>
    new Promise((_resolve, reject) => {
      const abort = () => reject(new DOMException('Aborted', 'AbortError'));
      if (options?.signal?.aborted) abort();
      else options?.signal?.addEventListener('abort', abort, { once: true });
    });
  it('오래 걸리는 요청을 중단하고 재시도 가능한 오류로 바꾼다', async () => {
    vi.useFakeTimers();
    const api = createHttpParkingApi({
      baseUrl: '/backend',
      fetcher: hangingFetch,
      timeoutMs: 100,
    });
    const assertion = expect(api.searchPlaces('천안')).rejects.toMatchObject({
      status: 0,
      message: '응답이 늦어지고 있어요. 다시 시도해 주세요.',
    });
    await vi.advanceTimersByTimeAsync(100);
    await assertion;
  });
  it('화면 이동으로 취소된 요청은 사용자 오류로 바꾸지 않는다', async () => {
    const controller = new AbortController();
    const api = createHttpParkingApi({ baseUrl: '/backend', fetcher: hangingFetch });
    const request = api.searchPlaces('천안', controller.signal);
    controller.abort();
    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('목 어댑터', () => {
  it('공백 검색은 빈 목록, 공백 없는 매장명 검색도 일치한다', async () => {
    await expect(mockParkingApi.searchPlaces('  ')).resolves.toEqual({ items: [], total: 0 });
    expect((await mockParkingApi.searchPlaces('모퉁이커피')).items[0].id).toBe('place-demo-cafe');
  });
  it('없는 목적지는 404로 반환한다', async () => {
    await expect(mockParkingApi.getPlaceParking('missing')).rejects.toMatchObject({ status: 404 });
  });
  it('목 검색도 limit만큼 반환하면서 total은 유지한다', async () => {
    const data = await mockParkingApi.searchPlaces('충', undefined, { limit: 1 });
    expect(data.items).toHaveLength(1);
    expect(data.total).toBe(3);
  });
});
