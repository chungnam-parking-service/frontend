import { describe, expect, it } from 'vitest';
import {
  coordinateInfo,
  getParkingOptions,
  isVerifiedEntrance,
  placeParkingSchema,
  searchLimit,
} from '../src/domain/parking';
import { navigationUrl, walkingUrl } from '../src/domain/navigation';
import { placeParkingData } from '../src/mocks/data';

describe('백엔드 계약과 위치 정보', () => {
  it.each(placeParkingData)('$place.name 응답이 계약을 만족한다', (data) => {
    expect(placeParkingSchema.parse(data)).toEqual(data);
  });
  it('입구 출처가 없는 좌표를 확인된 입구로 표시하지 않는다', () => {
    const lot = placeParkingData[0].primaryParking[0].lot;
    expect(isVerifiedEntrance({ ...lot, coordinateType: undefined })).toBe(false);
    expect(isVerifiedEntrance({ ...lot, coordinateType: 'representative' })).toBe(false);
    expect(isVerifiedEntrance({ ...lot, coordinateType: 'entrance' })).toBe(true);
  });
  it('대표 좌표가 매장 좌표일 수도 있음을 설명하고 입구 확인과 구분한다', () => {
    const lot = {
      ...placeParkingData[0].primaryParking[0].lot,
      coordinateType: 'representative' as const,
    };
    const info = coordinateInfo(lot);
    expect(info.label).toBe('대표 위치');
    expect(info.description).toContain('매장 또는 주차장');
    expect(info.action).toBe('대표 위치로 길 안내');
    expect(coordinateInfo({ ...lot, coordinateType: undefined }).label).toBe('입구 미확인');
  });
  it('검색 제한은 1–50 정수만 허용한다', () => {
    expect(searchLimit()).toBe(20);
    expect(searchLimit(50)).toBe(50);
    for (const invalid of [0, -1, 51, 1.5, NaN])
      expect(() => searchLimit(invalid)).toThrow(RangeError);
  });
  it('유효하지 않은 좌표와 실행 가능한 이미지 URL을 거부한다', () => {
    const data = structuredClone(placeParkingData[0]);
    data.primaryParking[0].lot.entranceCoordinates.latitude = 91;
    expect(placeParkingSchema.safeParse(data).success).toBe(false);
    data.primaryParking[0].lot.entranceCoordinates.latitude = 36;
    data.primaryParking[0].lot.entrancePhotoUrl = 'javascript:alert(1)';
    expect(placeParkingSchema.safeParse(data).success).toBe(false);
  });
  it('잘못된 검증일과 음수 도보 시간을 거부한다', () => {
    const data = structuredClone(placeParkingData[0]);
    data.primaryParking[0].lot.verifiedAt = '어제';
    expect(placeParkingSchema.safeParse(data).success).toBe(false);
    data.primaryParking[0].lot.verifiedAt = null;
    data.primaryParking[0].walkingMinutes = -1;
    expect(placeParkingSchema.safeParse(data).success).toBe(false);
  });
  it('연결 주차장을 우선하고 주변 주차장은 도보 시간순, 미확인은 마지막에 둔다', () => {
    const data = structuredClone(placeParkingData[0]);
    const sample = data.alternatives[0];
    data.alternatives = [
      { ...sample, lot: { ...sample.lot, id: 'unknown' }, walkingMinutes: null },
      { ...sample, lot: { ...sample.lot, id: 'far' }, walkingMinutes: 10 },
      { ...sample, lot: { ...sample.lot, id: 'near' }, walkingMinutes: 1 },
      data.primaryParking[0],
    ];
    const original = structuredClone(data);
    expect(getParkingOptions(data).map((item) => item.lot.id)).toEqual([
      'lot-demo-cafe',
      'near',
      'far',
      'unknown',
    ]);
    expect(data).toEqual(original);
  });
});

describe('외부 길안내 좌표', () => {
  const data = placeParkingData[0];
  const lot = data.primaryParking[0].lot;
  it('네이버지도에는 매장이 아닌 주차장 입구 좌표를 전달한다', () => {
    const url = new URL(navigationUrl('naver', { ...lot, name: '한글 & #주차장' }));
    expect(url.protocol).toBe('nmap:');
    expect(url.searchParams.get('dlat')).toBe(String(lot.entranceCoordinates.latitude));
    expect(url.searchParams.get('dlng')).toBe(String(lot.entranceCoordinates.longitude));
    expect(url.searchParams.get('dname')).toBe('한글 & #주차장');
    expect(url.searchParams.get('appname')).toBeTruthy();
  });
  it('카카오맵 링크는 이름을 인코딩하고 위도·경도를 유지한다', () => {
    const url = navigationUrl('kakao', { ...lot, name: 'A/B & 주차장' });
    expect(url).toBe(
      `https://map.kakao.com/link/to/${encodeURIComponent('A/B & 주차장')},36.8148,127.1082`,
    );
  });
  it('도보 길찾기는 주차장에서 목적지로 연결한다', () => {
    expect(walkingUrl(lot, data.place)).toContain('/link/by/walk/');
    expect(walkingUrl(lot, data.place)).toContain('36.8148,127.1082/');
    expect(walkingUrl(lot, data.place)).toMatch(/36\.815,127\.1085$/);
  });
  it('주차장에 매장 좌표가 대입된 경우 같은 지점 간 도보 링크를 만들지 않는다', () => {
    const representative = {
      ...lot,
      coordinateType: 'representative' as const,
      entranceCoordinates: data.place.coordinates,
    };
    expect(walkingUrl(representative, data.place)).toBeNull();
  });
});
