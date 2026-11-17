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
  // 백엔드 v1에는 없는 선택 필드. 없으면 입구 정확도를 단정하지 않는다.
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

export interface ParkingApi {
  searchPlaces(query: string, signal?: AbortSignal): Promise<SearchPlacesResponse>;
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
export function formatVerifiedAt(value: string | null) {
  if (!value) return '확인 시점 정보 없음';
  return `${new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))} 확인`;
}
