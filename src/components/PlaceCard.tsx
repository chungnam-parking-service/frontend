import { Coffee, Utensils, BookOpen, MapPin, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { statusLabels, type Place } from '../domain/parking';

export function StatusBadge({ status }: { status: Place['parkingStatus'] }) {
  return <span className={`badge badge-${status}`}>{statusLabels[status]}</span>;
}
export function PlaceCard({
  place,
  featured = false,
  search = '',
}: {
  place: Place;
  featured?: boolean;
  search?: string;
}) {
  const Icon = place.category.includes('카페')
    ? Coffee
    : place.category.includes('서점')
      ? BookOpen
      : place.category.includes('음식')
        ? Utensils
        : MapPin;
  const to = `/places/${encodeURIComponent(place.id)}${search}`;
  return (
    <Link className={`place-card${featured ? ' place-featured' : ''}`} to={to}>
      {featured && (
        <div className="place-art" aria-hidden="true">
          <Icon size={29} strokeWidth={1.7} />
        </div>
      )}
      <div className="card-title">
        <h3>{place.name}</h3>
        <StatusBadge status={place.parkingStatus} />
      </div>
      <p className="place-meta">
        {place.address}
        {place.category && ` · ${place.category}`}
      </p>
      <div className="card-bottom">
        <p>{place.parkingSummary}</p>
        <ChevronRight size={18} aria-hidden="true" />
      </div>
    </Link>
  );
}
