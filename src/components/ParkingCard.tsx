import { ChevronRight, Footprints, ParkingCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  coordinateInfo,
  relationshipLabels,
  walkingTime,
  type PlaceParkingOption,
} from '../domain/parking';

export function parkingPath(placeId: string, lotId: string, search = '') {
  return `/places/${encodeURIComponent(placeId)}/parking/${encodeURIComponent(lotId)}${search}`;
}
export function ParkingCard({
  option,
  placeId,
  search = '',
}: {
  option: PlaceParkingOption;
  placeId: string;
  search?: string;
}) {
  return (
    <Link to={parkingPath(placeId, option.lot.id, search)} className="parking-card">
      <span className="parking-symbol" aria-hidden="true">
        <ParkingCircle size={22} />
      </span>
      <div className="parking-card-body">
        <span className="eyebrow">{relationshipLabels[option.relationship]}</span>
        <h3>{option.lot.name}</h3>
        <p>{option.benefitDescription ?? option.lot.feeDescription ?? '요금 정보 없음'}</p>
        <div className="parking-card-meta">
          <span>
            <Footprints size={14} />
            {`목적지까지 도보 ${walkingTime(option)}`}
          </span>
          <span>{coordinateInfo(option.lot).label}</span>
        </div>
      </div>
      <ChevronRight size={19} aria-hidden="true" />
    </Link>
  );
}
