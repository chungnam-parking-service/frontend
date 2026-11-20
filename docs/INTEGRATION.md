# 디자인·백엔드 연동

최신 확인: 2026-11-20. 백엔드 기준: `cc98df9`, 명세 v1.4. 채팅 기능은 팀 합의로 제외.

- 디자인: https://driver-rigid-05767558.figma.site/
- 서버 명세: https://github.com/chungnam-parking-service/parking-backend/blob/main/docs/API_SPEC.md
- 최초 제안서는 `docs/API.md`. 현재 연동 기준은 서버 명세와 `src/domain/parking.ts`이다.

## 화면과 코드

모바일 홈 → 목적지 검색 → 목적지별 지도·주차장 목록 → 주차장 상세 → 내비 선택/도보 안내.
원래 요구사항의 주차 혜택·등록·정산, 운영시간 경고, 확인 시점도 표시한다.
화면, 공통 컴포넌트, 도메인/스키마, 요청 훅, HTTP/목 어댑터, 화면별 스타일을 분리했다.

## 사용하는 API

- `GET /places?query=...&limit=...`
- `GET /places/{placeId}/parking`
- `POST /places/{placeId}/parking/{lotId}/feedback`
- `POST /places/{placeId}/reports`

검색은 기본 20개, 최대 50개. `total`은 전체 일치 수이며 `items.length`와 다를 수 있다.
50개 보기는 추가 페이지를 이어 붙이는 기능이 아니라 상위 결과의 조회 한도를 확대하는 기능이다.
50개를 넘으면 검색어를 구체화하도록 안내한다. 검색어·limit은 URL에 저장해 상세 → 돌아가기에서도 유지한다.
홈에서는 실제 서버의 시·군 검색 규칙에 맞춰 `천안`과 `limit=3`으로 조회한다.

API 응답은 Zod로 검증한다. 오류 메시지는 서버 내부 메시지 대신 프론트 문구를 사용한다.
조회·JSON 전송 10초, 사진 포함 전송 30초 시간 초과, 화면 전환 시 취소, 오래된 요청 결과 차단, 빈 결과·404·재시도 상태를 처리한다.
목 모드뿐 아니라 실제 서버의 `isDemo: true` 데이터에서도 외부 길안내를 실행하지 않는다.

## AI 데이터와 좌표 처리

백엔드가 AI Releases 데이터를 가져와 프론트 계약으로 정규화한다.
관리자 가져오기 API와 키는 사용자 프론트에 연결하지 않는다.

| coordinateType   | 프론트 표시 | 의미                                                |
| ---------------- | ----------- | --------------------------------------------------- |
| `entrance`       | 입구 확인   | 백엔드가 입구 좌표로 제공                           |
| `representative` | 대표 위치   | 주차장 대표 좌표 또는 입구 좌표 대신 넣은 매장 좌표 |
| 누락/`unknown`   | 입구 미확인 | 이전 서버 호환. 정확도를 추정하지 않음              |

v1.1의 `entranceCoordinates`는 여전히 필수 좌표 객체다. 입구가 없다고 `null`로 보내는 계약이 아니다.
매장·주차장 대표 좌표를 넣은 데이터도 목록과 지도에 표시하며, 상세·지도 핀·내비 선택·도보 화면에서 일관되게 구분한다.
대표 좌표로 길안내하기 전 실제 주차 위치·입구와 다를 수 있다고 안내한다.
주차장과 목적지 좌표가 같으면 외부 도보 링크를 만들지 않는다. 임의의 거리·시간·경로도 만들지 않는다.

주소 `""`는 주소 정보 없음, `verifiedAt: null`은 확인 시점 정보 없음으로 표시한다.
`walkingMinutes`는 확인된 시간이다. 없으면 `estimatedWalkingMinutes`를 “약 N분”으로 표시하고, 두 필드가 모두 없으면 정보 없음으로 표시한다. `distanceMeters`는 직선거리로 명시한다. 대안은 확인 시간 또는 추정 시간 기준으로 정렬한다.
시연 목 데이터도 최신 서버와 같이 `coordinateType: entrance`를 포함한다.

## 검증

2026-11-18, 운영 서버가 아닌 별도 로컬 H2 DB에서 검증했다.

- AI 공개 데이터 가져오기: 39,365건, 건너뜀 0건. 전체 행의 상세 API를 하나씩 호출한 검증은 아니다.
- 독립 테스트 23개 + 시연 API 계약 5개 + AI 실연동 8개, 총 36개 통과.
- AI 실연동: 시·군+매장명 검색, limit/total 구분, 실제 매장 5곳 상세, 입구가 없던 매장의 대표 좌표와 도보 링크 차단.
- TypeScript 검사·프로덕션 빌드·코드 포맷 검사 통과.
- 모바일 브라우저: 천안 검색 전체 10,931건 중 20→50개 조회, 실제 AI 매장 상세·대표 위치 안내·도보 정보 없음 표시 확인.
- 기존 모바일 흐름·지도 핀·등록 조건·빈 결과·오류 복구는 2026-11-17 검증을 포함한다.

기본 `npm test`는 서버가 필요한 13개 테스트를 건너뛴다. 명시적인 실연동 실행:

```sh
BACKEND_TEST_URL=http://localhost:8080 BACKEND_AI_TESTS=1 npm test
```

테스트는 AI 데이터를 가져오거나 관리 API를 호출하지 않는다. 데이터가 준비된 검증 서버에서 실행한다.

## 배포와 남은 작업

공개 HTTPS 백엔드 주소와 프론트 출처의 CORS 허용이 필요하다. 개발 프록시는 정적 배포에는 적용되지 않는다.
실제 iOS·Android에서 내비 설치/미설치/복귀 동작은 추가 검증이 필요하다.
실제 보행 경로·거리와 방문 예정 시간 기반 자동 경고는 추가 연동이 필요하다. 현재 서버가 주는 운영시간 경고는 그대로 표시한다.

지도는 Leaflet + OpenStreetMap, 내비는 네이버 URL Scheme과 카카오 HTTPS 링크를 사용한다.

- 네이버: https://guide.ncloud-docs.com/docs/maps-url-scheme
- 카카오: https://apis.map.kakao.com/web/guide/#routeurl
- Leaflet: https://leafletjs.com/examples/quick-start/
- 타일 정책: https://operations.osmfoundation.org/policies/tiles/

## 피드백·제보 연결

- 피드백: 맞아요는 원탭 전송, 달라요는 선택 의견(300자)을 추가해 전송. 중복 전송 409는 이미 접수한 상태로 표시한다. 전송 중 중복 클릭을 막고 화면 이동 시 요청을 취소한다. 자동 재전송은 하지 않는다.
- 제보: `/report`에서 목적지 검색 → `/places/:placeId/report`. 상세 진입 시 `lotId`를 전달한다. 제보할 주차장이 없으면 목적지 전체/새 주차장 알림을 선택한다.
- 비운 칸은 기존 값을 유지한다. 빈 제보, 좌표 한쪽 누락, 범위 밖 좌표, 도보 안내 10단계 초과를 검증한다.
- 사진 없이 JSON, 사진 포함 시 `report` JSON Blob + `photo` File을 FormData로 전송한다. multipart Content-Type 경계는 브라우저가 설정한다.
- JPG/PNG/WebP, 5MB 이하. 최종 형식 판별은 백엔드가 수행한다. 400/413/429는 입력/용량/횟수 제한 안내로 표시한다.
- 201 응답은 검토 대기 접수증이다. 관리자 승인 전 화면 정보를 낙관적으로 변경하지 않는다. lotId 없는 새 주차장 제보는 관리자의 별도 등록이 필요하다.
- 목 모드는 실제 전송·저장하지 않는다. 실서버의 isDemo 데이터에는 쓰기를 막는다. 관리자 키는 프론트에 포함하지 않는다.
- 로컬 프록시 POST도 백엔드의 Origin 검사를 받는다. 개발에 사용하는 정확한 프론트 출처를 `CORS_ALLOWED_ORIGINS`에 추가해야 한다.
- Netlify `/backend` 프록시 설정은 팀원의 최신 main 변경을 유지했다. 사용하려면 빌드 환경변수 `VITE_API_BASE_URL=/backend`가 필요하다.

## 백엔드 입구 수정 오류 수정안

입구 좌표 제보가 승인되어도 이전 `walkingMinutes`, `distanceMeters`, `estimatedWalkingMinutes`, 도보 단계가 남는 오류를 확인했다.
좌표가 실제로 바뀌면 이전 확인 시간·동선을 비우고 직선거리와 추정 시간을 다시 계산한다. 같은 제보의 새 도보 단계는 적용하며, 좌표가 같으면 기존 시간을 유지한다.

수정 및 회귀 테스트 3개를 [백엔드 패치](backend/refresh-walking-estimates.patch)에 포함했다. 백엔드 전체 64개 테스트를 통과했다.
백엔드 저장소 쓰기 권한이 없어 직접 푸시하지 못했다. 백엔드 팀원이 최신 main에서 다음 명령으로 적용할 수 있다.

```sh
git am /path/to/frontend/docs/backend/refresh-walking-estimates.patch
bash ./gradlew test --console=plain
```

2026-11-20 로컬 H2에서 사진 업로드·사진 URL 조회·승인 전 원본 유지·승인 후 정보/좌표/거리 재계산을 검증했다.
프론트 독립 테스트 29개, 빌드와 포맷 검사를 통과했다. 모바일 브라우저에서는 실제 피드백 접수를 확인했다.
사진 선택 브라우저 검증은 중단되었으며, 사진 업로드와 승인 반영은 직접 API 검증 결과다.

최종 실연동 검사: `BACKEND_TEST_URL=http://127.0.0.1:18080 BACKEND_AI_TESTS=1 BACKEND_WRITE_TESTS=1 npm test` — 44개 모두 통과.
공개 AI 파일 39,365건을 내려받아 `AI_CARDS_URL=file:/...`로 가져온 임시 H2 서버를 사용했다. Java의 원격 HTTPS 가져오기는 해당 환경에서 시간 초과가 나 로컬 파일로 전환했다.
`BACKEND_WRITE_TESTS=1`은 실제 제보와 테스트 사진을 저장하므로 폐기 가능한 검증 DB에서만 사용한다. 기본 실행에서는 실연동 15개를 건너뛴다.
