import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronRight, Clock3, Footprints, Info, MapPin, Navigation, ParkingCircle, Search, ShieldCheck, Ticket, TriangleAlert, X } from 'lucide-react';
import type { ParkingStatus, Place, PlaceParkingOption, PlaceParkingResponse, SearchPlacesResponse } from './domain/parking';
import { ApiError, isMockMode, parkingApi } from './services/parkingApi';
import styles from './App.module.css';

const statusLabels: Record<ParkingStatus, string> = { available: '주차 가능', unavailable: '주차 불가', unknown: '정보 없음' };
const samples = [
  { id: 'place-demo-cafe', name: '모퉁이 커피', region: '천안 · 불당동', category: '카페', status: 'available' as const, text: '건물 주차 · 2시간 무료' },
  { id: 'place-demo-books', name: '온양 작은책방', region: '아산 · 온천동', category: '서점', status: 'unavailable' as const, text: '주변 주차장 도보 3분' },
  { id: 'place-demo-food', name: '공주 느린식탁', region: '공주 · 중동', category: '음식점', status: 'unknown' as const, text: '방문 전 확인이 필요해요' },
];

function StatusBadge({ status }: { status: ParkingStatus }) {
  return <span className={`${styles.badge} ${styles[status]}`}><span />{statusLabels[status]}</span>;
}

function SearchForm({ initialValue = '', compact = false }: { initialValue?: string; compact?: boolean }) {
  const [value, setValue] = useState(initialValue);
  const navigate = useNavigate();
  useEffect(() => { setValue(initialValue); }, [initialValue]);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`);
  }
  return <form onSubmit={submit} className={`${styles.searchBox} ${compact ? styles.compact : ''}`} role="search">
    <Search size={22} aria-hidden="true" />
    <input aria-label="목적지 검색" placeholder="어디로 가시나요? 장소나 지역 검색" value={value} onChange={event => setValue(event.target.value)} required maxLength={100} />
    <button type="submit" aria-label="검색" disabled={!value.trim()}><ArrowRight size={21} /></button>
  </form>;
}

function EntranceIllustration() {
  return <svg viewBox="0 0 640 300" role="img" aria-label="지하 주차장 입구 예시 일러스트. 실제 입구 사진이 아닙니다." className={styles.entranceArt}>
    <rect width="640" height="300" fill="#e8eeea" /><rect x="65" y="25" width="510" height="250" rx="4" fill="#d1dbd4" />
    <path d="M65 87H575M65 142H575M165 25V142M365 25V142" stroke="#bdcbc1" strokeWidth="2" />
    <rect x="215" y="114" width="268" height="162" rx="3" fill="#3a5149" /><path d="M226 276L278 159H424L472 276" fill="#6d7e75" />
    <path d="M349 177V264" stroke="#e9efe9" strokeWidth="4" strokeDasharray="14 12" />
    <path d="M337 243L349 257L361 243" fill="none" stroke="#e9efe9" strokeWidth="4" strokeLinecap="round" />
    <rect x="217" y="75" width="264" height="40" rx="3" fill="#23705d" /><text x="349" y="102" textAnchor="middle" fill="#fff" fontSize="19" fontFamily="sans-serif" fontWeight="bold">P  주차장 입구</text>
    <rect x="97" y="166" width="64" height="109" fill="#f3f5ee" /><rect x="104" y="173" width="50" height="66" fill="#b7cbc0" />
    <circle cx="536" cy="206" r="31" fill="#8cae90" /><rect x="531" y="224" width="10" height="51" fill="#a1ad94" />
    <rect y="275" width="640" height="25" fill="#c1cec5" /><rect x="193" y="241" width="10" height="34" rx="3" fill="#d49a47" /><rect x="492" y="241" width="10" height="34" rx="3" fill="#d49a47" />
  </svg>;
}

function Home() {
  return <>
    <section className={styles.hero}>
      <div className={styles.eyebrow}><span />충남에서 시작하는 편안한 주차</div>
      <h1>가고 싶은 곳,<br /><span>주차부터 알아보고.</span></h1>
      <p>주차장 입구부터 목적지까지.<br className={styles.mobileBreak} /> 차를 가져가도 괜찮을지, 먼저 확인하세요.</p>
      <SearchForm />
      <div className={styles.searchHint}><MapPin size={14} />{isMockMode ? '천안, 아산, 공주 또는 예시 매장명을 검색해 보세요' : '목적지 이름이나 충남 지역명을 검색해 보세요'}</div>
      <div className={styles.heroDrawing} aria-hidden="true"><div className={styles.drawingRoute} /><div className={styles.drawingParking}>P</div><MapPin className={styles.drawingPin} size={55} strokeWidth={1.5} /><span className={styles.drawingLabel}>도착은 입구부터</span></div>
    </section>
    {isMockMode && <section className={styles.examples} aria-labelledby="examples-title">
      <div className={styles.sectionHeading}><div><span className={styles.eyebrow}>먼저 둘러보세요</span><h2 id="examples-title">목적지마다 다른 주차 이야기</h2></div><span className={styles.muted}>테스트용 예시 매장</span></div>
      <div className={styles.sampleGrid}>{samples.map((sample, index) => <Link key={sample.id} to={`/places/${sample.id}`} className={styles.sampleCard}>
        <div className={`${styles.sampleVisual} ${styles[`visual${index}`]}`} aria-hidden="true"><span>{index === 0 ? 'COFFEE' : index === 1 ? 'BOOKS' : 'TABLE'}</span><div className={styles.storeFront}><i /><i /><i /></div><div className={styles.smallParking}>P</div></div>
        <div className={styles.sampleBody}><div className={styles.cardTop}><span>{sample.region}</span><StatusBadge status={sample.status} /></div><h3>{sample.name}<span>{sample.category}</span></h3><p>{sample.text}<ChevronRight size={17} /></p></div>
      </Link>)}</div>
    </section>}
    <section className={styles.promise} aria-label="서비스 안내"><div><Navigation /><strong>매장 대신, 주차장 입구로</strong><p>헤매기 쉬운 마지막 골목까지 확인해요.</p></div><div><Ticket /><strong>무료 주차 조건까지 한 번에</strong><p>요금과 주차 등록 방법을 미리 알아봐요.</p></div><div><Footprints /><strong>차에서 내린 다음도 편하게</strong><p>주차한 곳부터 목적지까지 이어드려요.</p></div></section>
  </>;
}

function PlaceCard({ place }: { place: Place }) {
  return <Link to={`/places/${place.id}`} className={styles.resultCard}>
    <div className={styles.resultIcon}><MapPin size={25} /></div><div className={styles.resultBody}><div className={styles.cardTop}><span>{place.category}</span><StatusBadge status={place.parkingStatus} /></div><h2>{place.name}</h2><p>{place.address}</p><strong>{place.parkingSummary}</strong></div><ChevronRight size={21} className={styles.resultArrow} />
  </Link>;
}

function Message({ title, children, retry }: { title: string; children?: React.ReactNode; retry?: () => void }) {
  return <div className={styles.empty}><Search size={31} /><h2>{title}</h2><p>{children}</p>{retry ? <button className={styles.secondaryButton} onClick={retry}>다시 시도</button> : <Link to="/" className={styles.secondaryButton}>처음으로</Link>}</div>;
}

function Loading() { return <div className={styles.loading} role="status"><span />주차 정보를 불러오고 있어요.</div>; }

function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [result, setResult] = useState<SearchPlacesResponse | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError('');
    parkingApi.searchPlaces(query, controller.signal).then(setResult).catch(reason => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : '검색 중 문제가 발생했어요.');
    });
    return () => controller.abort();
  }, [query, attempt]);
  return <div className={styles.searchPage}><Link to="/" className={styles.back}><ArrowLeft size={18} />처음으로</Link><h1>어디에 주차하면 좋을까요?</h1><SearchForm initialValue={query} compact />
    {error ? <Message title="검색 결과를 불러오지 못했어요" retry={() => setAttempt(value => value + 1)}>{error}</Message> : !result ? <Loading /> : <>
      <div className={styles.resultHeading}><h2>{query ? `‘${query}’ 검색 결과` : '목적지를 입력해 주세요'}</h2><span>{result.total}곳</span></div>
      {result.items.length ? <div className={styles.resultList}>{result.items.map(place => <PlaceCard place={place} key={place.id} />)}</div> : <Message title={query ? '검색 결과가 없어요' : '어디로 가실 예정인가요?'}>{isMockMode ? '목업에서는 천안, 아산, 공주 또는 예시 매장명으로 검색할 수 있어요.' : '다른 장소명이나 지역명으로 검색해 주세요.'}</Message>}
    </>}
  </div>;
}

function NavigationSheet({ option, onClose, onPreview }: { option: PlaceParkingOption; onClose: () => void; onPreview: (app: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [app, setApp] = useState(() => { try { return localStorage.getItem('ipgu.navigation-app') || '네이버지도'; } catch { return '네이버지도'; } });
  const [remember, setRemember] = useState(true);
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => element?.close(); }, []);
  function confirm() {
    try { if (remember) localStorage.setItem('ipgu.navigation-app', app); else localStorage.removeItem('ipgu.navigation-app'); } catch { /* 저장 불가 환경에서도 미리보기는 가능 */ }
    onPreview(app);
  }
  return <dialog ref={dialog} className={styles.dialog} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="nav-title">
    <div className={styles.dialogBody}><button className={styles.closeButton} onClick={onClose} aria-label="닫기"><X size={22} /></button><span className={styles.eyebrow}>익숙한 앱으로 편하게</span><h2 id="nav-title">어떤 내비로 출발할까요?</h2><p className={styles.navDestination}><ParkingCircle size={19} />{option.lot.name} <strong>입구</strong></p>
      <fieldset className={styles.navOptions}><legend className={styles.srOnly}>내비게이션 앱 선택</legend>{['네이버지도', '카카오내비', '티맵'].map((name, index) => <label key={name} className={app === name ? styles.selectedNav : ''}><span className={`${styles.appIcon} ${styles[`app${index}`]}`}>{['N', 'K', 'T'][index]}</span><span>{name}</span><input type="radio" name="navigation-app" value={name} checked={app === name} onChange={() => setApp(name)} /></label>)}</fieldset>
      <label className={styles.remember}><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />다음에도 이 앱으로 안내받기</label><div className={styles.demoNote}><Info size={17} /><span>지금은 테스트용 목업이에요. 실제 내비 앱을 실행하지 않고 안내 흐름만 확인해요.</span></div><button className={styles.primaryButton} onClick={confirm}><Navigation size={18} />길안내 미리보기</button>
    </div>
  </dialog>;
}

function ParkingDetails({ option, warning }: { option: PlaceParkingOption; warning: string | null }) {
  const { lot } = option;
  return <>
    <section className={styles.panel} aria-labelledby="entrance-title"><div className={styles.panelHeading}><span className={styles.number}>01</span><h2 id="entrance-title">어디로 들어가나요?</h2></div>
      <div className={styles.entranceImage}>{lot.entrancePhotoUrl ? <img src={lot.entrancePhotoUrl} alt={`${lot.name} 입구`} /> : <><EntranceIllustration /><span className={styles.imageCaption}>예시 일러스트 · 실제 입구 사진 없음</span></>}</div><div className={styles.entranceText}><MapPin size={19} /><p>{lot.entranceGuide ?? '입구 안내 정보가 없어요. 방문 전 확인해 주세요.'}</p></div>
    </section>
    <section className={styles.panel}><div className={styles.panelHeading}><span className={styles.number}>02</span><h2>요금과 이용 시간을 확인하세요</h2></div><dl className={styles.infoList}><div><dt><Ticket size={17} />주차 혜택</dt><dd>{option.benefitDescription ?? '매장 주차 할인 정보 없음'}</dd></div><div><dt><ParkingCircle size={17} />주차 요금</dt><dd>{lot.feeDescription ?? '정보 없음'}</dd></div><div><dt><Clock3 size={17} />운영시간</dt><dd>{lot.hoursDescription ?? '정보 없음'}</dd></div></dl>{warning && <div className={styles.warning}><TriangleAlert size={19} /><p>{warning}</p></div>}</section>
    <section className={styles.panel}><div className={styles.panelHeading}><span className={styles.number}>03</span><h2>주차 후, 목적지까지</h2>{option.walkingMinutes !== null && <span className={styles.walkTime}><Footprints size={15} />{option.walkingMinutes}분</span>}</div>{option.walkingSteps.length ? <ol className={styles.steps}>{option.walkingSteps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol> : <p className={styles.muted}>도보 동선 정보가 없어요.</p>}</section>
    <section className={styles.validation}><div className={styles.validationIcon}><Ticket size={24} /></div><div><h2>{option.benefitDescription ? '무료 주차, 이렇게 등록하세요' : '정산은 이렇게 하세요'}</h2><p>{option.validationInstructions ?? '주차 등록·정산 방법 정보가 없어요. 현장 안내를 확인해 주세요.'}</p></div></section>
  </>;
}

function DetailContent({ data }: { data: PlaceParkingResponse }) {
  const { place } = data;
  const options = [...data.primaryParking, ...data.alternatives.slice().sort((a, b) => (a.walkingMinutes ?? Infinity) - (b.walkingMinutes ?? Infinity))];
  const [selectedId, setSelectedId] = useState(options[0]?.lot.id);
  const option = options.find(item => item.lot.id === selectedId) ?? options[0];
  const [showNavigation, setShowNavigation] = useState(false);
  const [notice, setNotice] = useState('');
  const navButton = useRef<HTMLButtonElement>(null);
  function closeNavigation() { setShowNavigation(false); navButton.current?.focus(); }
  const lastVerified = option?.lot.verifiedAt ? `${new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(option.lot.verifiedAt))} 확인` : '확인 시점 정보 없음';
  return <article className={styles.detail}>
    <Link to={`/search?q=${encodeURIComponent(place.name)}`} className={styles.back}><ArrowLeft size={18} />검색 결과</Link>
    <header className={styles.detailHeader}><div className={styles.detailMeta}><span>{place.category}</span><span>충청남도</span></div><h1>{place.name}</h1><p><MapPin size={15} />{place.address}</p><p><Clock3 size={15} />매장 {data.placeHoursDescription ?? '운영시간 정보 없음'}</p></header>
    <div className={`${styles.summary} ${place.parkingStatus === 'available' ? styles.summaryAvailable : ''}`}><StatusBadge status={place.parkingStatus} /><strong>{place.parkingSummary}</strong><p>{place.parkingStatus === 'available' ? '출발 전 입구와 무료 주차 조건을 확인하세요.' : place.parkingStatus === 'unavailable' ? (data.alternatives.length ? '목적지 주변에서 이용할 수 있는 주차장을 찾았어요.' : '목적지 주변의 주차 정보도 아직 없어요. 방문 전 확인해 주세요.') : '주차 가능 여부가 아직 확인되지 않았어요. 방문 전 목적지에 문의해 주세요.'}</p></div>
    {option ? <div className={styles.detailGrid}><aside className={styles.parkingAside}><div className={styles.sectionHeading}><h2>이용할 주차장</h2><span className={styles.muted}>{options.length}곳</span></div><div className={styles.parkingOptions}>{options.map(item => <button key={item.lot.id} onClick={() => { setSelectedId(item.lot.id); setNotice(''); }} className={`${styles.parkingOption} ${item.lot.id === option.lot.id ? styles.selectedParking : ''}`} aria-pressed={item.lot.id === option.lot.id}>
      <div className={styles.optionTop}><span>{({ dedicated: '매장 전용', shared: '건물 공용', partner: '제휴 주차장', nearby: '주변 주차장' })[item.relationship]}</span>{item.lot.id === option.lot.id && <CheckCircle2 size={18} />}</div><strong>{item.lot.name}</strong><p>{item.benefitDescription ?? item.lot.feeDescription ?? '요금 정보 없음'}</p><span className={styles.optionWalk}><Footprints size={14} />{item.walkingMinutes !== null ? `목적지까지 도보 ${item.walkingMinutes}분` : '도보 시간 정보 없음'}</span>
    </button>)}</div><div className={styles.freshness}><ShieldCheck size={17} /><span>{lastVerified}{data.isDemo && <small>예시 데이터 기준</small>}</span></div>{data.alternatives.length > 0 && options.length > 1 && <p className={styles.asideTip}><Info size={15} />만차라면 주변 주차장을 선택해 보세요.</p>}</aside><div className={styles.detailPanels}><ParkingDetails option={option} warning={data.primaryParking.some(item => item.lot.id === option.lot.id) ? data.operatingHoursWarning : null} /></div></div> : <section className={styles.noParking}><ParkingCircle size={33} /><h2>주변 주차장 정보도 준비 중이에요</h2><p>확인된 정보가 생기면 이곳에 안내할게요.</p><Link to="/" className={styles.secondaryButton}>다른 목적지 찾기</Link></section>}
    {notice && <div className={styles.previewNotice} role="status"><CheckCircle2 size={21} /><div><strong>{notice}</strong><p>주차장 입구가 목적지로 선택됐어요. 실제 길안내는 실행되지 않았습니다.</p></div><button aria-label="안내 닫기" onClick={() => setNotice('')}><X size={18} /></button></div>}
    {option && <div className={styles.departBar}><div><small>선택한 주차장 입구로</small><strong>{option.lot.name}</strong></div><button ref={navButton} className={styles.primaryButton} onClick={() => setShowNavigation(true)}><Navigation size={19} />내비로 출발<ArrowRight size={18} /></button></div>}
    {showNavigation && option && <NavigationSheet option={option} onClose={closeNavigation} onPreview={app => { setNotice(`${app} 길안내 미리보기`); closeNavigation(); }} />}
  </article>;
}

function DetailPage() {
  const { placeId = '' } = useParams();
  const [data, setData] = useState<PlaceParkingResponse | null>(null);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(''); setNotFound(false);
    parkingApi.getPlaceParking(placeId, controller.signal).then(setData).catch(reason => {
      if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : '정보를 불러오지 못했어요.'); setNotFound(reason instanceof ApiError && reason.status === 404); }
    });
    return () => controller.abort();
  }, [placeId, attempt]);
  if (error) return <Message title={notFound ? '목적지를 찾을 수 없어요' : '주차 정보를 불러오지 못했어요'} retry={notFound ? undefined : () => setAttempt(value => value + 1)}>{error}</Message>;
  return data ? <DetailContent key={data.place.id} data={data} /> : <Loading />;
}

export default function App() {
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname, location.search]);
  return <><a href="#main" className={styles.skipLink}>본문으로 바로가기</a><header className={styles.siteHeader}><Link to="/" className={styles.brand} aria-label="입구 홈"><span><ParkingCircle size={25} strokeWidth={2.5} /></span>입구<span className={styles.brandSubtitle}>목적지보다 한 걸음 먼저</span></Link><span className={styles.headerLabel}>{isMockMode ? 'CHUNGNAM · PROTOTYPE' : 'CHUNGNAM'}</span></header>{isMockMode && <div className={styles.prototypeBanner}><Info size={14} /><span>테스트용 목업입니다. 매장·위치·요금은 모두 가상의 예시입니다.</span></div>}<main id="main" className={styles.main}><Routes><Route path="/" element={<Home />} /><Route path="/search" element={<SearchPage />} /><Route path="/places/:placeId" element={<DetailPage />} /><Route path="*" element={<Message title="페이지를 찾을 수 없어요">주소를 확인하거나 처음부터 다시 찾아주세요.</Message>} /></Routes></main><footer className={styles.footer}><span>입구</span><p>주차부터 도착까지, 조금 더 편안하게.</p><span>충남 주차 안내{isMockMode ? ' · 테스트 목업' : ''}</span></footer></>;
}
