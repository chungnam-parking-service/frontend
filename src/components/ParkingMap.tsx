import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Coordinates } from '../domain/parking';

export interface MapPoint {
  id: string;
  label: string;
  coordinates: Coordinates;
  kind: 'place' | 'parking';
}
interface Props {
  points: MapPoint[];
  onSelect?: (id: string) => void;
  label?: string;
}

export default function ParkingMap({
  points,
  onSelect,
  label = '목적지와 주차장 위치 지도',
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const select = useRef(onSelect);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!container.current || !points.length) return;
    const map = L.map(container.current, { scrollWheelZoom: false, zoomControl: false });
    L.control
      .zoom({ position: 'bottomright', zoomInTitle: '확대', zoomOutTitle: '축소' })
      .addTo(map);
    setTileError(false);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    })
      .on('tileerror', () => setTileError(true))
      .addTo(map);
    points.forEach((point) => {
      const text = document.createElement('span');
      text.textContent = point.label;
      const marker = L.marker([point.coordinates.latitude, point.coordinates.longitude], {
        icon: L.divIcon({
          className: `map-marker map-marker-${point.kind}`,
          html: `<span>${point.kind === 'place' ? '●' : 'P'}</span>`,
          iconSize: [44, 44],
          iconAnchor: [22, 44],
        }),
        title: point.label,
        keyboard: true,
      })
        .bindTooltip(text)
        .on('add', (event: L.LeafletEvent) => {
          (event.target as L.Marker).getElement()?.setAttribute('aria-label', point.label);
        })
        .addTo(map);
      if (point.kind === 'parking' && onSelect)
        marker.on('click', () => select.current?.(point.id));
    });
    map.fitBounds(
      L.latLngBounds(
        points.map((point) => [point.coordinates.latitude, point.coordinates.longitude]),
      ),
      { padding: [45, 45], maxZoom: 17 },
    );
    const resize = new ResizeObserver(() => map.invalidateSize());
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.remove();
    };
  }, [points, Boolean(onSelect)]);
  return (
    <div className="map-frame">
      <div ref={container} className="parking-map" role="region" aria-label={label} />
      <div className="map-legend">
        {points.some((point) => point.kind === 'place') && (
          <span>
            <i className="place-dot" />
            목적지
          </span>
        )}
        {points.some((point) => point.kind === 'parking') && (
          <span>
            <i className="parking-dot" />
            주차장
          </span>
        )}
      </div>
      {tileError && (
        <p className="map-error" role="status">
          지도를 불러오지 못했어요. 아래 목록에서도 선택할 수 있어요.
        </p>
      )}
    </div>
  );
}
