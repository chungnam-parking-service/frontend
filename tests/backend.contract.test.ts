import { describe, expect, it } from 'vitest';
import { createHttpParkingApi } from '../src/services/parkingApi';
import { placeParkingData } from '../src/mocks/data';

const baseUrl = process.env.BACKEND_TEST_URL;
describe.skipIf(!baseUrl)('실제 Spring Boot API 계약', () => {
  const api = createHttpParkingApi({ baseUrl: baseUrl ?? '' });
  it('목적지 검색 응답을 파싱한다', async () => {
    const result = await api.searchPlaces('천안');
    expect(result.items.some((place) => place.id === 'place-demo-cafe')).toBe(true);
  });
  it.each(placeParkingData)(
    '$place.id의 실응답이 프론트 목 데이터와 일치한다',
    async (expected) => {
      await expect(api.getPlaceParking(expected.place.id)).resolves.toEqual(expected);
    },
  );
  it('빈 검색과 없는 목적지의 상태를 구분한다', async () => {
    await expect(api.searchPlaces('')).resolves.toEqual({ items: [], total: 0 });
    await expect(api.getPlaceParking('missing')).rejects.toMatchObject({ status: 404 });
  });
});
