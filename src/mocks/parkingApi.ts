import { searchLimit, type ParkingApi } from '../domain/parking';
import { ApiError } from '../services/ApiError';
import { placeParkingData } from './data';

function delay(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, 200);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
export const mockParkingApi: ParkingApi = {
  async searchPlaces(query, signal, options) {
    const limit = searchLimit(options?.limit);
    await delay(signal);
    if (query.trim().length > 100) throw new ApiError(400, '검색어는 100자 이내로 입력해 주세요.');
    const term = query.trim().replace(/\s/g, '').toLocaleLowerCase();
    const items = term
      ? placeParkingData
          .map(({ place }) => place)
          .filter((place) =>
            `${place.name}${place.address}${place.category}`
              .replace(/\s/g, '')
              .toLocaleLowerCase()
              .includes(term),
          )
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      : [];
    return { items: items.slice(0, limit), total: items.length };
  },
  async getPlaceParking(id, signal) {
    await delay(signal);
    const data = placeParkingData.find(({ place }) => place.id === id);
    if (!data) throw new ApiError(404, '목적지를 찾을 수 없어요.');
    return data;
  },
};
