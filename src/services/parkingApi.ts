import { z } from 'zod';
import {
  placeParkingSchema,
  searchPlacesSchema,
  searchLimit,
  type ParkingApi,
} from '../domain/parking';
import { mockParkingApi } from '../mocks/parkingApi';
import { ApiError } from './ApiError';

interface ApiOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export function createHttpParkingApi({
  baseUrl,
  fetcher = fetch,
  timeoutMs = 10000,
}: ApiOptions): ParkingApi {
  const base = baseUrl.replace(/\/+$/, '');
  async function get<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, timeoutMs);
    try {
      const response = await fetcher(`${base}${path}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok)
        throw new ApiError(
          response.status,
          response.status === 404
            ? '목적지를 찾을 수 없어요.'
            : '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
        );
      const body: unknown = await response.json().catch((error) => {
        if (controller.signal.aborted) throw error;
        throw new ApiError(502, '주차 정보 형식을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      });
      const parsed = schema.safeParse(body);
      if (!parsed.success)
        throw new ApiError(502, '주차 정보 형식을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
      return parsed.data;
    } catch (error) {
      if (signal?.aborted || error instanceof ApiError) throw error;
      throw new ApiError(
        0,
        controller.signal.aborted
          ? '응답이 늦어지고 있어요. 다시 시도해 주세요.'
          : '서버에 연결하지 못했어요. 네트워크를 확인해 주세요.',
      );
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }
  return {
    searchPlaces: (query, signal, options) =>
      get(
        `/places?query=${encodeURIComponent(query.trim())}&limit=${searchLimit(options?.limit)}`,
        searchPlacesSchema,
        signal,
      ),
    getPlaceParking: (id, signal) =>
      get(`/places/${encodeURIComponent(id)}/parking`, placeParkingSchema, signal),
  };
}
const apiBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const isMockMode = !apiBase;
export const parkingApi = apiBase ? createHttpParkingApi({ baseUrl: apiBase }) : mockParkingApi;
