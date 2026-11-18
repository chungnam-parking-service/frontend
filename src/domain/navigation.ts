import type { ParkingLot, Place } from './parking';

export const navigationApps = [
  { id: 'naver', name: '네이버지도', letter: 'N' },
  { id: 'kakao', name: '카카오맵', letter: 'K' },
] as const;
export type NavigationApp = (typeof navigationApps)[number]['id'];
const storageKey = 'ipgu.navigation-app.v1';
export function readNavigationApp(): NavigationApp | null {
  try {
    const value = localStorage.getItem(storageKey);
    return navigationApps.some((app) => app.id === value) ? (value as NavigationApp) : null;
  } catch {
    return null;
  }
}
export function saveNavigationApp(app: NavigationApp | null) {
  try {
    if (app) localStorage.setItem(storageKey, app);
    else localStorage.removeItem(storageKey);
  } catch {
    /* 저장이 차단되어도 길안내는 계속 사용할 수 있다. */
  }
}
export function navigationUrl(app: NavigationApp, lot: ParkingLot) {
  const { latitude, longitude } = lot.entranceCoordinates;
  if (app === 'kakao')
    return `https://map.kakao.com/link/to/${encodeURIComponent(lot.name)},${latitude},${longitude}`;
  const params = new URLSearchParams({
    dlat: String(latitude),
    dlng: String(longitude),
    dname: lot.name,
    appname: 'com.chungnam.ipgu',
  });
  return `nmap://route/car?${params}`;
}
export function parkingMapUrl(lot: ParkingLot) {
  const { latitude, longitude } = lot.entranceCoordinates;
  return `https://map.kakao.com/link/map/${encodeURIComponent(lot.name)},${latitude},${longitude}`;
}
export function walkingUrl(lot: ParkingLot, place: Place) {
  const from = lot.entranceCoordinates,
    to = place.coordinates;
  if (from.latitude === to.latitude && from.longitude === to.longitude) return null;
  return `https://map.kakao.com/link/by/walk/${encodeURIComponent(lot.name)},${from.latitude},${from.longitude}/${encodeURIComponent(place.name)},${to.latitude},${to.longitude}`;
}
