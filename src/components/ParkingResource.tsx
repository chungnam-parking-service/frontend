import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import {
  getParkingOptions,
  type PlaceParkingOption,
  type PlaceParkingResponse,
} from '../domain/parking';
import { usePlaceParking } from '../hooks/usePlaceParking';
import { Message, RequestView } from './Feedback';

export function ParkingResource({
  children,
}: {
  children: (data: PlaceParkingResponse, option: PlaceParkingOption) => ReactNode;
}) {
  const { placeId = '', lotId } = useParams();
  const { state, retry } = usePlaceParking(placeId);
  return (
    <RequestView state={state} retry={retry}>
      {(data) => {
        const option = getParkingOptions(data).find((item) => item.lot.id === lotId);
        return option ? (
          children(data, option)
        ) : (
          <Message title="연결된 주차장을 찾을 수 없어요">
            목적지 주차 안내에서 다시 선택해 주세요.
          </Message>
        );
      }}
    </RequestView>
  );
}
