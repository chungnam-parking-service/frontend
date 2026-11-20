import { describe, expect, it, vi } from 'vitest';
import { validateReport } from '../src/domain/contributions';
import {
  parkingOptionSchema,
  straightDistance,
  walkingTime,
  getParkingOptions,
} from '../src/domain/parking';
import { createHttpParkingApi } from '../src/services/parkingApi';
import { placeParkingData } from '../src/mocks/data';
import { mockParkingApi } from '../src/mocks/parkingApi';

const place = placeParkingData[0];
const option = place.primaryParking[0];
const receipt = {
  id: 1,
  status: 'pending',
  placeId: place.place.id,
  lotId: option.lot.id,
  photoUrl: null,
  createdAt: new Date().toISOString(),
};

describe('도보 정보', () => {
  it('추정 필드를 보존하고 확인된 시간을 우선한다', () => {
    const value = parkingOptionSchema.parse({
      ...option,
      distanceMeters: 250,
      estimatedWalkingMinutes: 4,
    });
    expect(value.distanceMeters).toBe(250);
    expect(walkingTime(value)).toBe(`${option.walkingMinutes}분`);
    expect(walkingTime({ ...value, walkingMinutes: null })).toBe('약 4분');
    expect(walkingTime({ ...option, walkingMinutes: null })).toBe('정보 없음');
    expect(straightDistance(1250)).toBe('약 1.3km');
    expect(straightDistance(0)).toBe('약 0m');
    expect(straightDistance()).toBe('정보 없음');
  });
  it('확인 시간 또는 추정 시간을 기준으로 대안을 정렬한다', () => {
    const alternatives = [
      { ...option, lot: { ...option.lot, id: 'unknown' }, walkingMinutes: null },
      {
        ...option,
        lot: { ...option.lot, id: 'estimate' },
        walkingMinutes: null,
        estimatedWalkingMinutes: 2,
      },
      { ...option, lot: { ...option.lot, id: 'confirmed' }, walkingMinutes: 1 },
    ];
    expect(
      getParkingOptions({ ...place, primaryParking: [], alternatives }).map(({ lot }) => lot.id),
    ).toEqual(['confirmed', 'estimate', 'unknown']);
  });
});

describe('제보 검증과 전송', () => {
  it('빈 제보, 좌표 한쪽만 입력, 단계 초과와 잘못된 사진을 거절한다', () => {
    expect(() => validateReport({ lotId: option.lot.id, comment: ' ' })).toThrow();
    expect(() => validateReport({ entranceLatitude: 36.8 })).toThrow();
    expect(() => validateReport({ walkingSteps: Array(11).fill('단계') })).toThrow();
    expect(() => validateReport({}, new File(['x'], 'a.gif', { type: 'image/gif' }))).toThrow();
    expect(() =>
      validateReport(
        {},
        new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'a.png', { type: 'image/png' }),
      ),
    ).toThrow();
    expect(validateReport({ entranceLatitude: 36.8, entranceLongitude: 127.1 })).toMatchObject({
      entranceLatitude: 36.8,
    });
  });
  it('사진 없는 제보는 JSON, 사진은 JSON 파트가 있는 multipart로 전송한다', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => Response.json(receipt, { status: 201 }));
    const api = createHttpParkingApi({ baseUrl: '/backend', fetcher });
    await api.sendReport(place.place.id, { comment: '확인 부탁드려요' });
    expect(fetcher.mock.calls[0][1]?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    const photo = new File(['png'], 'entrance.png', { type: 'image/png' });
    await api.sendReport(place.place.id, { lotId: option.lot.id }, photo);
    const init = fetcher.mock.calls[1][1]!;
    expect(init.headers).not.toHaveProperty('Content-Type');
    const form = init.body as FormData;
    expect(JSON.parse(await (form.get('report') as Blob).text())).toEqual({ lotId: option.lot.id });
    expect((form.get('photo') as File).name).toBe('entrance.png');
    expect(fetcher.mock.calls[1][0]).toBe(`/backend/places/${place.place.id}/reports`);
  });
  it('중복 피드백을 식별하고 내부 오류 문구는 숨긴다', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json({ code: 'DUPLICATE_FEEDBACK', message: 'secret' }, { status: 409 }),
      );
    const api = createHttpParkingApi({ baseUrl: '/backend', fetcher });
    await expect(
      api.sendFeedback(place.place.id, option.lot.id, { accurate: true }),
    ).rejects.toMatchObject({ status: 409, code: 'DUPLICATE_FEEDBACK' });
    expect(JSON.parse(fetcher.mock.calls[0][1]?.body as string)).toEqual({ accurate: true });
  });
  it('체험용 제보는 원래 주차 정보를 변경하지 않는다', async () => {
    const before = structuredClone(await mockParkingApi.getPlaceParking(place.place.id));
    await expect(
      mockParkingApi.sendReport(place.place.id, {
        lotId: option.lot.id,
        feeDescription: '수정 요청',
      }),
    ).resolves.toMatchObject({ status: 'pending' });
    expect(await mockParkingApi.getPlaceParking(place.place.id)).toEqual(before);
  });
});
