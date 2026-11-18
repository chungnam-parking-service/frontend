import { describe, expect, it } from 'vitest';
import { createHttpParkingApi } from '../src/services/parkingApi';
import { coordinateInfo, isVerifiedEntrance } from '../src/domain/parking';
import { walkingUrl } from '../src/domain/navigation';

// 데이터 가져오기는 테스트가 실행하지 않는다. AI 데이터가 준비된 검증 서버에서만 사용한다.
describe.skipIf(!process.env.BACKEND_TEST_URL || process.env.BACKEND_AI_TESTS !== '1')(
  'AI 데이터 실연동',
  () => {
    const api = createHttpParkingApi({ baseUrl: process.env.BACKEND_TEST_URL ?? '' });
    it('지역 검색의 전체 건수와 limit 결과를 구분한다', async () => {
      const result = await api.searchPlaces('천안', undefined, { limit: 1 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBeGreaterThan(1);
    });
    it('시·군과 매장명으로 AI 매장을 찾는다', async () => {
      const result = await api.searchPlaces('천안 배나무숲');
      expect(result.items.some((place) => place.id === 'sangga-MA010120220808573659')).toBe(true);
    });
    it.each([
      ['sangga-MA010120220808573659', '배나무숲'],
      ['sangga-MA010120220806009229', '빙빙반점'],
      ['sangga-MA010120220805917240', '백제의집'],
      ['sangga-MA010120220803118414', '에그드랍'],
      ['sangga-MA010120220813748539', '뚜레쥬르 아산모종점'],
    ])('%s 실제 AI 상세를 스키마로 검증한다', async (id, name) => {
      const data = await api.getPlaceParking(id);
      expect(data.place.name).toBe(name);
      expect(data.isDemo).toBe(false);
    });
    it('입구 좌표가 없던 매장은 매장 대표 좌표로 제공된다', async () => {
      const data = await api.getPlaceParking('sangga-MA010120220808573659');
      const lot = data.primaryParking[0].lot;
      expect(lot.coordinateType).toBe('representative');
      expect(lot.entranceCoordinates).toEqual(data.place.coordinates);
      expect(isVerifiedEntrance(lot)).toBe(false);
      expect(coordinateInfo(lot).label).toBe('대표 위치');
      expect(walkingUrl(lot, data.place)).toBeNull();
      expect(data.alternatives.every((option) => option.walkingMinutes === null)).toBe(true);
    });
  },
);
