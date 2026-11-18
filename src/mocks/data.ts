import type { PlaceParkingOption, PlaceParkingResponse } from '../domain/parking';

const nearby: PlaceParkingOption = {
  lot: {
    id: 'lot-demo-public',
    name: '가온 공영주차장',
    address: '충남 천안시 불당동 · 예시 주소',
    entranceCoordinates: { latitude: 36.8152, longitude: 127.1078 },
    coordinateType: 'entrance',
    entrancePhotoUrl: null,
    entranceGuide: '큰길에서 파란 P 표지판을 따라 진입하세요.',
    feeDescription: '최초 30분 500원 · 이후 10분당 200원',
    hoursDescription: '매일 08:00–23:00',
    verifiedAt: null,
  },
  relationship: 'nearby',
  benefitDescription: null,
  validationInstructions: '출차 전 1층 무인 정산기에서 결제하세요.',
  walkingMinutes: 5,
  walkingSteps: [
    '주차장 보행자 출구로 나와주세요.',
    '큰길을 따라 직진한 뒤 횡단보도를 건너세요.',
    '오른쪽 골목의 목적지 정문으로 들어가세요.',
  ],
};

export const placeParkingData: PlaceParkingResponse[] = [
  {
    place: {
      id: 'place-demo-cafe',
      name: '모퉁이 커피',
      category: '카페',
      address: '충남 천안시 불당동 · 예시 매장',
      coordinates: { latitude: 36.815, longitude: 127.1085 },
      parkingStatus: 'available',
      parkingSummary: '건물 주차 가능 · 음료 구매 시 2시간 무료',
    },
    placeHoursDescription: '매일 10:00–22:00',
    operatingHoursWarning:
      '주차장은 21:00에 닫혀요. 매장 마감보다 1시간 빠르니 이용 시간을 확인해 주세요.',
    primaryParking: [
      {
        lot: {
          id: 'lot-demo-cafe',
          name: '모퉁이 빌딩 주차장',
          address: '충남 천안시 불당동 · 예시 주소',
          entranceCoordinates: { latitude: 36.8148, longitude: 127.1082 },
          coordinateType: 'entrance',
          entrancePhotoUrl: null,
          entranceGuide: '매장 정문 반대편, 건물 오른쪽 골목의 지하 입구로 들어가세요.',
          feeDescription: '무료 시간 초과 시 10분당 500원',
          hoursDescription: '매일 09:00–21:00',
          verifiedAt: '2026-11-07T09:00:00+09:00',
        },
        relationship: 'shared',
        benefitDescription: '음료 1잔 이상 구매 시 2시간 무료',
        validationInstructions:
          '주문할 때 카운터에 차량번호 뒤 4자리를 알려주세요. 출차 전 등록 여부를 확인하세요.',
        walkingMinutes: 2,
        walkingSteps: [
          'B1 주차 후 중앙 엘리베이터로 이동하세요.',
          '엘리베이터를 타고 1층에서 내려주세요.',
          '건물 정문으로 나와 왼쪽 모퉁이 매장으로 들어가세요.',
        ],
      },
    ],
    alternatives: [nearby],
    isDemo: true,
  },
  {
    place: {
      id: 'place-demo-books',
      name: '온양 작은책방',
      category: '서점',
      address: '충남 아산시 온천동 · 예시 매장',
      coordinates: { latitude: 36.7803, longitude: 127.0022 },
      parkingStatus: 'unavailable',
      parkingSummary: '매장 주차 불가 · 주변 주차장 확인',
    },
    placeHoursDescription: '화–일 11:00–20:00 · 월요일 휴무',
    operatingHoursWarning: null,
    primaryParking: [],
    alternatives: [
      {
        ...nearby,
        lot: {
          ...nearby.lot,
          id: 'lot-demo-onyang',
          name: '온양 마을주차장',
          address: '충남 아산시 온천동 · 예시 주소',
          entranceCoordinates: { latitude: 36.7807, longitude: 127.003 },
          hoursDescription: '24시간',
          feeDescription: '30분 600원 · 이후 10분당 200원',
        },
        walkingMinutes: 3,
        walkingSteps: [
          '보행자 출구로 나와 시장 방향으로 걸어주세요.',
          '첫 번째 골목에서 왼쪽으로 이동하세요.',
          '책방 간판이 있는 1층으로 들어가세요.',
        ],
      },
    ],
    isDemo: true,
  },
  {
    place: {
      id: 'place-demo-food',
      name: '공주 느린식탁',
      category: '음식점',
      address: '충남 공주시 중동 · 예시 매장',
      coordinates: { latitude: 36.4544, longitude: 127.1248 },
      parkingStatus: 'unknown',
      parkingSummary: '주차 정보 없음 · 방문 전 확인 필요',
    },
    placeHoursDescription: null,
    operatingHoursWarning: null,
    primaryParking: [],
    alternatives: [],
    isDemo: true,
  },
];
