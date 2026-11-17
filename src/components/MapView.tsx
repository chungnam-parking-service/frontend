import { Component, lazy, Suspense, type ReactNode } from 'react';
import type { MapPoint } from './ParkingMap';
const ParkingMap = lazy(() => import('./ParkingMap'));

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="map-fallback">지도를 표시하지 못했어요. 주차장 목록을 이용해 주세요.</div>
    ) : (
      this.props.children
    );
  }
}
export function MapView(props: {
  points: MapPoint[];
  onSelect?: (id: string) => void;
  label?: string;
}) {
  return (
    <MapBoundary>
      <Suspense
        fallback={
          <div className="map-fallback" role="status">
            지도를 준비하고 있어요.
          </div>
        }
      >
        <ParkingMap {...props} />
      </Suspense>
    </MapBoundary>
  );
}
