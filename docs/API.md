# 주차 안내 API 초안 v0.1

> 최초 목업의 제안서입니다. 현재 연동 기준은 [백엔드 API 명세 v1.0](https://github.com/chungnam-parking-service/parking-backend/blob/main/docs/API_SPEC.md)과 `src/domain/parking.ts`이며, 후속 변경·주의사항은 [INTEGRATION.md](INTEGRATION.md)를 참고하세요.

백엔드 협의용 제안이며 확정 명세가 아닙니다. 목업 구현 기준 타입은 `src/domain/parking.ts`입니다.
초기에는 인증 없이 조회합니다. 좌표는 WGS84 십진수이고 위도·경도는 명시적인 필드로 구분합니다.
모든 예시는 가상 데이터입니다.

## 1. 목적지 검색

`GET /places?query=천안`

- `query`: 앞뒤 공백 제거, 1–100자. 목 어댑터는 빈 검색에 빈 목록을 반환하며 UI는 빈 제출을 막습니다.
- 실제 검색 대상·충남 지역 필터·외부 장소 ID 매핑은 서버와 협의합니다.
- 초기 목업은 페이지네이션 없이 전체 결과를 반환합니다. 실제 서비스에서는 최대 개수와 페이지네이션을 합의해야 합니다.

```json
{
  "items": [
    {
      "id": "place-demo-cafe",
      "name": "모퉁이 커피",
      "category": "카페",
      "address": "충남 천안시 불당동 · 예시 매장",
      "coordinates": { "latitude": 36.815, "longitude": 127.1085 },
      "parkingStatus": "available",
      "parkingSummary": "건물 주차 가능 · 음료 구매 시 2시간 무료"
    }
  ],
  "total": 1
}
```

`parkingStatus`:

| 값            | 의미                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| `available`   | 목적지에서 이용 가능한 주차 시설이 확인됨. 실시간 빈자리 보장이 아님              |
| `unavailable` | 목적지 자체·연결 주차가 불가한 것으로 확인됨. 주변 주차장은 별도로 존재할 수 있음 |
| `unknown`     | 주차 가능 여부를 모름. 불가로 변환하지 않음                                       |

## 2. 목적지 주차 상세

`GET /places/{placeId}/parking`

매장과 주차장의 관계에 따라 혜택, 주차 등록 방법, 도보 안내가 달라집니다.
`primaryParking`에는 전용·공용·제휴 주차장, `alternatives`에는 주변 주차장을 넣습니다.
모르는 값은 null 또는 빈 배열로 반환합니다. 0분·무료 등으로 대체하지 않습니다.

```json
{
  "place": {
    "id": "place-demo-cafe",
    "name": "모퉁이 커피",
    "category": "카페",
    "address": "충남 천안시 불당동 · 예시 매장",
    "coordinates": { "latitude": 36.815, "longitude": 127.1085 },
    "parkingStatus": "available",
    "parkingSummary": "건물 주차 가능 · 음료 구매 시 2시간 무료"
  },
  "placeHoursDescription": "매일 10:00–22:00",
  "operatingHoursWarning": "주차장은 21:00에 닫혀요. 매장 마감보다 1시간 빠르니 이용 시간을 확인해 주세요.",
  "primaryParking": [
    {
      "lot": {
        "id": "lot-demo-cafe",
        "name": "모퉁이 빌딩 주차장",
        "address": "충남 천안시 불당동 · 예시 주소",
        "entranceCoordinates": { "latitude": 36.8148, "longitude": 127.1082 },
        "entrancePhotoUrl": null,
        "entranceGuide": "매장 정문 반대편, 건물 오른쪽 골목의 지하 입구로 들어가세요.",
        "feeDescription": "무료 시간 초과 시 10분당 500원",
        "hoursDescription": "매일 09:00–21:00",
        "verifiedAt": "2026-11-07T09:00:00+09:00"
      },
      "relationship": "shared",
      "benefitDescription": "음료 1잔 이상 구매 시 2시간 무료",
      "validationInstructions": "주문할 때 카운터에 차량번호 뒤 4자리를 알려주세요. 출차 전 등록 여부를 확인하세요.",
      "walkingMinutes": 2,
      "walkingSteps": [
        "B1 주차 후 중앙 엘리베이터로 이동하세요.",
        "엘리베이터를 타고 1층에서 내려주세요.",
        "건물 정문으로 나와 왼쪽 모퉁이 매장으로 들어가세요."
      ]
    }
  ],
  "alternatives": [],
  "isDemo": true
}
```

### 필드 규칙

- `place`: 검색 응답과 동일한 Place 구조.
- `placeHoursDescription`: 매장 운영시간, 문자열 또는 null.
- `operatingHoursWarning`: 연결 주차장에 대한 경고 문구 또는 null. 현재 목업은 primary 선택 시 표시. 연결 주차장이 여러 개라면 주차장 관계별 경고로 확장해야 함.
- `primaryParking`, `alternatives`: 같은 PlaceParkingOption 배열. 없어도 빈 배열 필수.
- `relationship`: `dedicated`(전용), `shared`(건물 공용), `partner`(제휴), `nearby`(주변).
- `lot.entranceCoordinates`: **매장 좌표와 별개인 입구 좌표.** 현재 타입은 필수이며, 좌표 없는 시설까지 반환하려면 nullable 처리와 출발 버튼 차단 정책을 먼저 추가해야 함.
- `lot.entrancePhotoUrl`: 공개 접근 가능한 사진 URL 또는 null. 없으면 예시/사진 없음 상태.
- `lot.entranceGuide`, `lot.feeDescription`, `lot.hoursDescription`: 안내 문구 또는 null. 오늘은 계산용 숫자·주간 일정 스키마를 도입하지 않음.
- `lot.verifiedAt`: ISO 8601 날짜시각 또는 null. 화면은 Asia/Seoul 날짜로 표시.
- `benefitDescription`: 해당 매장에서 적용되는 할인 조건 또는 null.
- `validationInstructions`: 해당 매장 주차 등록 또는 해당 주차장 정산 안내, 문자열 또는 null.
- `walkingMinutes`: 해당 주차장에서 목적지까지 도보 분, 0 이상의 수 또는 null.
- `walkingSteps`: 순서대로 표시할 안내 문자열 배열. 미확인이면 `[]`.
- `isDemo`: 데이터 자체가 예시인지 표시. 실제 데이터는 false.

대체 주차장은 도보 시간 오름차순으로 표시하고 미확인은 마지막에 놓습니다.
서버에서 실제 보행 경로와 운영 여부를 고려해 추천해야 합니다. 프론트는 직선거리로 도보 시간을 만들어내지 않습니다.

## 오류와 네트워크

| HTTP                            | 의미                    | 화면 동작            |
| ------------------------------- | ----------------------- | -------------------- |
| 200 + 빈 `items`                | 검색 결과 없음          | 빈 결과 안내         |
| 400                             | 유효하지 않은 검색·입력 | 오류와 재시도        |
| 404                             | 존재하지 않는 목적지    | 목적지 없음, 홈 링크 |
| 429 / 500 / 503 / 네트워크 실패 | 일시적인 실패           | 오류와 재시도        |

오류 body 제안: `{ "code": "PLACE_NOT_FOUND", "message": "목적지를 찾을 수 없습니다." }`.
현재 어댑터는 HTTP 상태를 기준으로 처리하고 서버의 message를 그대로 표시하지 않습니다.
목록·상세 전환 시 AbortSignal로 이전 요청을 취소합니다.
다른 출처에 배포하면 서버에서 프론트 출처의 CORS 허용이 필요합니다.

## 후속 MVP 항목

오늘 목업에는 포함하지 않지만 원래 MVP에 있는 정확도 피드백:
`POST /parking-lots/{parkingLotId}/feedback`.
정확함/부정확함, 방문한 목적지 ID, 중복·스팸 제한, 인증 정책을 추가 합의한 뒤 구현합니다.

방문 예정 시각 기반 경고, 실제 입구 사진, 내비 앱 링크, 외부 장소 검색·공공데이터 연동은 별도 구현이 필요합니다.
