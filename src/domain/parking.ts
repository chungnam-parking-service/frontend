import { z } from 'zod';

export const coordinatesSchema = z.object({
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
});

export const placeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string(),
  address: z.string(),
  coordinates: coordinatesSchema,
  parkingStatus: z.enum(['available', 'unavailable', 'unknown']),
  parkingSummary: z.string(),
});

const photoSchema = z
  .string()
  .url()
  .refine((value) => /^https?:\/\//i.test(value));
export const parkingLotSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string(),
  entranceCoordinates: coordinatesSchema,
  entrancePhotoUrl: photoSchema.nullable(),
  entranceGuide: z.string().nullable(),
  feeDescription: z.string().nullable(),
  hoursDescription: z.string().nullable(),
  verifiedAt: z.string().datetime({ offset: true }).nullable(),
  // v1.1: 입구 미확인 시설도 대표 좌표로 제공한다. 이전 서버의 필드 누락도 수용한다.
  coordinateType: z.enum(['entrance', 'representative', 'unknown']).optional(),
});

export const parkingOptionSchema = z.object({
  lot: parkingLotSchema,
  relationship: z.enum(['dedicated', 'shared', 'partner', 'nearby']),
  benefitDescription: z.string().nullable(),
  validationInstructions: z.string().nullable(),
  walkingMinutes: z.number().finite().nonnegative().nullable(),
  walkingSteps: z.array(z.string()),
});

export const placeParkingSchema = z.object({
  place: placeSchema,
  placeHoursDescription: z.string().nullable(),
  operatingHoursWarning: z.string().nullable(),
  primaryParking: z.array(parkingOptionSchema),
  alternatives: z.array(parkingOptionSchema),
  isDemo: z.boolean(),
});
export const searchPlacesSchema = z.object({
  items: z.array(placeSchema),
  total: z.number().int().nonnegative(),
});

export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Place = z.infer<typeof placeSchema>;
export type ParkingStatus = Place['parkingStatus'];
export type ParkingLot = z.infer<typeof parkingLotSchema>;
export type PlaceParkingOption = z.infer<typeof parkingOptionSchema>;
export type PlaceParkingResponse = z.infer<typeof placeParkingSchema>;
export type SearchPlacesResponse = z.infer<typeof searchPlacesSchema>;
export interface SearchOptions {
  limit?: number;
}
export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_SEARCH_LIMIT = 50;

export function searchLimit(limit = DEFAULT_SEARCH_LIMIT) {
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SEARCH_LIMIT) {
    throw new RangeError('검색 결과 수는 1–50 사이의 정수여야 합니다.');
  }
  return limit;
}

export interface ParkingApi {
  searchPlaces(
    query: string,
    signal?: AbortSignal,
    options?: SearchOptions,
  ): Promise<SearchPlacesResponse>;
  getPlaceParking(placeId: string, signal?: AbortSignal): Promise<PlaceParkingResponse>;
}
export const statusLabels: Record<ParkingStatus, string> = {
  available: '주차 가능',
  unavailable: '주차 불가',
  unknown: '정보 없음',
};
export const relationshipLabels: Record<PlaceParkingOption['relationship'], string> = {
  dedicated: '매장 전용',
  shared: '건물 공용',
  partner: '제휴 주차장',
  nearby: '주변 주차장',
};

export function getParkingOptions(data: PlaceParkingResponse) {
  const seen = new Set<string>();
  const alternatives = [...data.alternatives].sort(
    (a, b) => (a.walkingMinutes ?? Number.MAX_VALUE) - (b.walkingMinutes ?? Number.MAX_VALUE),
  );
  return [...data.primaryParking, ...alternatives].filter(({ lot }) => {
    if (seen.has(lot.id)) return false;
    seen.add(lot.id);
    return true;
  });
}
export function isVerifiedEntrance(lot: ParkingLot) {
  return lot.coordinateType === 'entrance';
}

const coordinateDescriptions = {
  entrance: {
    label: '입구 확인',
    title: '주차장 입구 위치',
    description: '차량 진입 입구 좌표예요. 현장 진입 안내도 확인해 주세요.',
    action: '이 입구로 길 안내',
    start: '입구로 안내 시작',
  },
  representative: {
    label: '대표 위치',
    title: '매장·주차장 대표 위치',
    description:
      '매장 또는 주차장의 대표 좌표예요. 실제 주차장이나 차량 진입 입구와 다를 수 있어요.',
    action: '대표 위치로 길 안내',
    start: '대표 위치로 안내 시작',
  },
  unknown: {
    label: '입구 미확인',
    title: '주차장 위치',
    description: '실제 입구가 확인되지 않은 좌표예요. 도착 후 현장 입구를 확인해 주세요.',
    action: '이 위치로 길 안내',
    start: '선택한 위치로 안내 시작',
  },
} as const;

export function coordinateInfo(lot: ParkingLot) {
  return coordinateDescriptions[lot.coordinateType ?? 'unknown'];
}
export function formatVerifiedAt(value: string | null) {
  if (!value) return '확인 시점 정보 없음';
  return `${new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))} 확인`;
}
