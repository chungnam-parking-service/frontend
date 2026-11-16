export type ParkingStatus = 'available' | 'unavailable' | 'unknown';

export interface Coordinates { latitude: number; longitude: number }

export interface Place {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates: Coordinates;
  parkingStatus: ParkingStatus;
  parkingSummary: string;
}

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  entranceCoordinates: Coordinates;
  entrancePhotoUrl: string | null;
  entranceGuide: string | null;
  feeDescription: string | null;
  hoursDescription: string | null;
  verifiedAt: string | null;
}

// 혜택과 도보 안내는 주차장이 아닌 '목적지 ↔ 주차장' 관계에 속한다.
export interface PlaceParkingOption {
  lot: ParkingLot;
  relationship: 'dedicated' | 'shared' | 'partner' | 'nearby';
  benefitDescription: string | null;
  validationInstructions: string | null;
  walkingMinutes: number | null;
  walkingSteps: string[];
}

export interface PlaceParkingResponse {
  place: Place;
  placeHoursDescription: string | null;
  operatingHoursWarning: string | null;
  primaryParking: PlaceParkingOption[];
  alternatives: PlaceParkingOption[];
  isDemo: boolean;
}

export interface SearchPlacesResponse { items: Place[]; total: number }

export interface ParkingApi {
  searchPlaces(query: string, signal?: AbortSignal): Promise<SearchPlacesResponse>;
  getPlaceParking(placeId: string, signal?: AbortSignal): Promise<PlaceParkingResponse>;
}
