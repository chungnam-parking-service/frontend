import { useCallback } from 'react';
import { parkingApi } from '../services/parkingApi';
import { useRequest } from './useRequest';

export function usePlaceParking(id: string) {
  const load = useCallback((signal: AbortSignal) => parkingApi.getPlaceParking(id, signal), [id]);
  return useRequest(load, id);
}
