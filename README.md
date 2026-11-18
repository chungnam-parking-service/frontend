# 입구 — 충남 주차 안내

디자이너의 [모바일 시안](https://driver-rigid-05767558.figma.site/)을 기준으로 만든 React + TypeScript + Vite 프론트엔드입니다.

목적지 검색 → 목적지별 지도·주차장 목록 → 주차장 상세 → 외부 지도 길안내 / 주차 후 도보 안내.

## 실행

Node.js 22.12 이상(또는 24 이상)을 사용합니다.

```sh
npm ci
npm run dev
```

환경변수가 없으면 가상 데이터로 실행됩니다. `천안`, `아산`, `공주`, `모퉁이커피` 등으로 검색하세요.
가상의 예시 데이터에서는 외부 길안내를 실행하지 않고 앱 선택·저장 흐름을 체험합니다.

```sh
npm run build
npm test
npm run format:check
```

`build`는 TypeScript 검사 후 `dist/`를 생성합니다. 지도 코드는 별도 청크로 필요할 때 불러옵니다.

## 실제 백엔드 연결

백엔드 계약: [parking-backend/docs/API_SPEC.md](https://github.com/chungnam-parking-service/parking-backend/blob/main/docs/API_SPEC.md).

프론트가 사용하는 API는 두 개입니다.

- `GET /places?query=검색어`
- `GET /places/{placeId}/parking`

`.env.example`을 참고해 `.env.local`을 작성합니다. 로컬에서는 Vite 프록시 연결을 권장합니다.

```dotenv
VITE_API_BASE_URL=/backend
API_PROXY_TARGET=http://localhost:8080
```

환경변수 수정 후 개발 서버를 다시 시작하세요. `/backend` 프록시는 개발 서버에서만 동작합니다.

배포에서는 접근 가능한 HTTPS 백엔드 주소를 빌드 시 지정해야 합니다.

```dotenv
VITE_API_BASE_URL=https://your-backend.example.com
```

배포된 프론트 출처를 백엔드 CORS 설정에 허용해야 합니다.
`VITE_` 변수는 브라우저에 공개되므로 관리자 키·인증키를 넣지 않습니다.
API 주소를 지정했을 때 서버 연결이 실패하면 오류를 표시합니다. 조용히 목 데이터로 대체하지 않습니다.

## 구조

```text
src/
  App.tsx                 라우트 정의
  components/             레이아웃·검색·카드·지도·내비 선택·상태 화면
  pages/                  홈·검색·목적지·주차장·도보·서비스 소개
  hooks/                  취소 가능한 요청 상태와 목적지 데이터 조회
  domain/                 Zod 스키마·타입·주차 정렬·내비 링크 생성
  services/               HTTP 어댑터·에러·시간 초과·응답 검증
  mocks/                  목 어댑터와 예시 데이터
  styles/                 공통 토큰·레이아웃·화면별 모바일 스타일
 tests/                   도메인·HTTP·실제 백엔드 계약 테스트
```

API 응답을 런타임에도 검증하며, 페이지는 API URL·응답 파싱·정렬 규칙을 직접 구현하지 않습니다.
요금 혜택과 주차 등록·도보 안내는 목적지와 주차장의 관계로 관리합니다.

## 지도와 길안내

- 지도: Leaflet + OpenStreetMap. 브라우저에서 필요한 타일만 요청하며 출처를 표시합니다. 지도 키는 필요하지 않습니다.
- 지도 타일을 못 불러와도 목록으로 주차장을 선택할 수 있습니다.
- 서버가 `coordinateType: "entrance"`를 명시할 때만 확인된 입구로 표시합니다.
- 백엔드 v1.1은 이 필드를 제공합니다. `representative`는 매장 또는 주차장 대표 좌표로, 실제 주차 위치와 다를 수 있다고 안내합니다. 이전 서버에서 필드가 빠지면 입구 미확인으로 처리합니다.
- 네이버지도: 공식 `nmap://route/car` URL Scheme. 앱 설치가 필요합니다.
- 카카오맵: HTTPS 길안내 링크. 별도의 웹 지도 링크도 제공합니다.
- 내비 앱 기본 선택은 이 브라우저의 localStorage에만 저장합니다.
- 실제 앱 실행·앱 복귀는 iOS·Android 실기기에서 추가 검증해야 합니다.
- 주차장과 목적지의 좌표가 같으면 외부 도보 길찾기 링크를 제공하지 않습니다.
- 현재 API에는 도보 거리·경로선이 없습니다. 지도에는 출발·도착 핀만 표시하고 가짜 경로를 그리지 않습니다.

지도 타일은 [OSM 이용 정책](https://operations.osmfoundation.org/policies/tiles/)을 따릅니다. 트래픽이 큰 운영 서비스에서는 사용량에 맞는 타일 제공자를 선정하세요.

## 실제 백엔드 계약 검사

Spring Boot 서버를 실행한 뒤:

```sh
BACKEND_TEST_URL=http://localhost:8080 npm test

# AI 데이터 가져오기가 완료된 검증 서버에서 추가 실행
BACKEND_TEST_URL=http://localhost:8080 BACKEND_AI_TESTS=1 npm test
```

기본 `npm test`는 외부 서버가 필요 없는 테스트만 실행합니다. `BACKEND_TEST_URL`을 지정하면 실제 시연 목적지 세 곳의 응답과 프론트 목 데이터 일치, 검색, 404까지 검사합니다.

## 배포

Netlify: `npm run build` 후 `dist` 업로드 또는 Git 연동(Build: `npm run build`, Publish: `dist`).
`public/_redirects`가 빌드에 복사되므로 상세 주소로 직접 접속·새로고침할 수 있습니다.
Vercel에서도 `vercel.json`의 SPA rewrite를 사용합니다.
환경변수를 바꾸면 다시 빌드·배포해야 합니다.

## 범위와 남은 서버 작업

등록·수정·정확도 피드백, 외부 장소 검색, 실제 보행 경로·거리, 사진 업로드, 방문 예정 시간에 따른 자동 경고는 백엔드 미구현입니다.
등록 메뉴는 준비 안내로 연결하며 저장 완료를 가장하지 않습니다.

검색은 기본 20개, 최대 50개까지 조회합니다. 전체 일치 수와 표시 건수를 구분하며 50개를 넘으면 검색어를 구체화하도록 안내합니다. 검색어와 조회 제한은 상세 화면에서 돌아갈 때도 유지됩니다.

원래 프론트 초안은 [docs/API.md](docs/API.md), 구현·검증·연동 주의사항은 [docs/INTEGRATION.md](docs/INTEGRATION.md)에 정리했습니다.
