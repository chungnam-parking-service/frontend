import { z } from 'zod';
import {
  placeParkingSchema,
  searchPlacesSchema,
  searchLimit,
  type ParkingApi,
} from '../domain/parking';
import { mockParkingApi } from '../mocks/parkingApi';
import { ApiError } from './ApiError';
import {
  feedbackInputSchema,
  feedbackReceiptSchema,
  reportReceiptSchema,
  validateReport,
} from '../domain/contributions';

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
  async function request<T>(
    path: string,
    schema: z.ZodType<T>,
    signal?: AbortSignal,
    init?: RequestInit,
  ): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(
      abort,
      init?.body instanceof FormData ? Math.max(timeoutMs, 30000) : timeoutMs,
    );
    try {
      const response = await fetcher(`${base}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...init?.headers },
      });
      if (!response.ok) {
        const errorBody: unknown = await response.json().catch(() => null);
        const code = z.object({ code: z.string() }).safeParse(errorBody);
        const messages: Record<number, string> = {
          400: '입력한 내용과 사진 형식을 확인해 주세요.',
          403: '이 요청을 허용하지 않는 서버 설정이에요. 운영자에게 문의해 주세요.',
          404: '목적지나 주차장을 찾을 수 없어요.',
          409: '오늘 이미 피드백을 남겼어요. 고맙습니다.',
          413: '사진은 5MB 이하로 첨부해 주세요.',
          429: '오늘 제보 가능한 횟수를 초과했어요. 내일 다시 시도해 주세요.',
        };
        const codeMessages: Record<string, string> = {
          EMPTY_REPORT: '수정할 정보나 사진을 하나 이상 입력해 주세요.',
          INVALID_PHOTO: 'JPG, PNG, WebP 형식의 사진인지 확인해 주세요.',
        };
        throw new ApiError(
          response.status,
          (code.success ? codeMessages[code.data.code] : undefined) ??
            messages[response.status] ??
            '정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
          code.success ? code.data.code : undefined,
        );
      }
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
      request(
        `/places?query=${encodeURIComponent(query.trim())}&limit=${searchLimit(options?.limit)}`,
        searchPlacesSchema,
        signal,
      ),
    getPlaceParking: (id, signal) =>
      request(`/places/${encodeURIComponent(id)}/parking`, placeParkingSchema, signal),
    sendFeedback: (placeId, lotId, input, signal) =>
      request(
        `/places/${encodeURIComponent(placeId)}/parking/${encodeURIComponent(lotId)}/feedback`,
        feedbackReceiptSchema,
        signal,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(feedbackInputSchema.parse(input)),
        },
      ),
    sendReport: (placeId, input, photo, signal) => {
      const report = validateReport(input, photo);
      if (photo) {
        const body = new FormData();
        body.append('report', new Blob([JSON.stringify(report)], { type: 'application/json' }));
        body.append('photo', photo);
        return request(
          `/places/${encodeURIComponent(placeId)}/reports`,
          reportReceiptSchema,
          signal,
          { method: 'POST', body },
        );
      }
      return request(
        `/places/${encodeURIComponent(placeId)}/reports`,
        reportReceiptSchema,
        signal,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        },
      );
    },
  };
}
const apiBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const isMockMode = !apiBase;
export const parkingApi = apiBase ? createHttpParkingApi({ baseUrl: apiBase }) : mockParkingApi;
