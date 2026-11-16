import type { ParkingApi, PlaceParkingResponse, SearchPlacesResponse } from '../domain/parking';
import { placeParkingData } from '../mocks/data';

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ApiError'; }
}

function delay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, 250);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

const mockApi: ParkingApi = {
  async searchPlaces(query, signal) {
    await delay(signal);
    const term = query.trim().replace(/\s/g, '').toLocaleLowerCase();
    const items = term ? placeParkingData.map(({ place }) => place).filter(place =>
      `${place.name}${place.address}${place.category}`.replace(/\s/g, '').toLocaleLowerCase().includes(term),
    ) : [];
    return { items, total: items.length };
  },
  async getPlaceParking(placeId, signal) {
    await delay(signal);
    const item = placeParkingData.find(({ place }) => place.id === placeId);
    if (!item) throw new ApiError(404, '목적지를 찾을 수 없어요.');
    return item;
  },
};

const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { signal });
  if (!response.ok) throw new ApiError(response.status, '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
  return response.json() as Promise<T>;
}

const httpApi: ParkingApi = {
  searchPlaces: (query, signal) => request<SearchPlacesResponse>(`/places?query=${encodeURIComponent(query)}`, signal),
  getPlaceParking: (id, signal) => request<PlaceParkingResponse>(`/places/${encodeURIComponent(id)}/parking`, signal),
};

// 환경변수가 없으면 목업. 실제 API도 동일한 응답 계약을 사용한다.
export const parkingApi: ParkingApi = apiBase ? httpApi : mockApi;
export const isMockMode = !apiBase;
