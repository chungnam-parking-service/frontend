import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Navigation, Settings2, X } from 'lucide-react';
import {
  navigationApps,
  navigationUrl,
  parkingMapUrl,
  readNavigationApp,
  saveNavigationApp,
  type NavigationApp,
} from '../domain/navigation';
import { isVerifiedEntrance, type ParkingLot } from '../domain/parking';
import { Notice } from './Feedback';

export function NavigationButton({ lot, isDemo }: { lot: ParkingLot; isDemo: boolean }) {
  const [open, setOpen] = useState(false);
  const [preferred, setPreferred] = useState(readNavigationApp);
  const [notice, setNotice] = useState('');
  const verified = isVerifiedEntrance(lot);
  const label = verified ? '이 입구로 길 안내' : '이 주차장으로 길 안내';
  const selected = navigationApps.find((app) => app.id === preferred);
  return (
    <>
      <div className="navigation-actions">
        {preferred && !isDemo && verified ? (
          <a className="button button-primary" href={navigationUrl(preferred, lot)}>
            <Navigation size={18} />
            {selected?.name}로 출발
          </a>
        ) : (
          <button className="button button-primary" onClick={() => setOpen(true)}>
            <Navigation size={18} />
            {label}
          </button>
        )}
        <button
          className="icon-button nav-settings"
          aria-label="내비 앱 선택"
          onClick={() => setOpen(true)}
        >
          <Settings2 size={18} />
        </button>
      </div>
      {notice && (
        <p className="inline-status" role="status">
          {notice}
        </p>
      )}
      {open && (
        <NavigationDialog
          lot={lot}
          isDemo={isDemo}
          initialApp={preferred ?? 'naver'}
          onClose={() => setOpen(false)}
          onChoose={(app, remember) => {
            saveNavigationApp(remember ? app : null);
            setPreferred(remember ? app : null);
            if (isDemo) {
              setNotice('체험을 완료했어요. 가상 위치이므로 실제 내비는 실행하지 않았어요.');
              setOpen(false);
            }
          }}
        />
      )}
    </>
  );
}

function NavigationDialog({
  lot,
  isDemo,
  initialApp,
  onClose,
  onChoose,
}: {
  lot: ParkingLot;
  isDemo: boolean;
  initialApp: NavigationApp;
  onClose: () => void;
  onChoose: (app: NavigationApp, remember: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [app, setApp] = useState(initialApp);
  const [remember, setRemember] = useState(true);
  const verified = isVerifiedEntrance(lot);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="navigation-dialog"
      onCancel={onClose}
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      aria-labelledby="navigation-title"
    >
      <div className="dialog-content">
        <button className="icon-button dialog-close" onClick={onClose} aria-label="닫기">
          <X size={21} />
        </button>
        <span className="eyebrow">익숙한 앱으로 편하게</span>
        <h2 id="navigation-title">어떤 내비로 출발할까요?</h2>
        <p className="muted">{lot.name}</p>
        {!verified && (
          <Notice warning>
            실제 입구가 확인되지 않은 좌표예요. 주차장 주변에 도착하면 현장 입구를 확인해 주세요.
          </Notice>
        )}
        <fieldset className="navigation-options">
          <legend className="sr-only">내비게이션 앱</legend>
          {navigationApps.map((item) => (
            <label key={item.id} className={app === item.id ? 'selected' : ''}>
              <span className={`app-icon app-icon-${item.id}`}>{item.letter}</span>
              <span>{item.name}</span>
              <input
                type="radio"
                name="navigation"
                checked={app === item.id}
                onChange={() => setApp(item.id)}
              />
            </label>
          ))}
        </fieldset>
        <label className="remember-app">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          다음에도 이 앱으로 안내받기
        </label>
        {isDemo ? (
          <>
            <Notice>체험용 가상 위치예요. 실제 내비 앱을 실행하지 않아요.</Notice>
            <button className="button button-primary" onClick={() => onChoose(app, remember)}>
              길안내 흐름 체험하기
            </button>
          </>
        ) : (
          <>
            <a
              className="button button-primary"
              href={navigationUrl(app, lot)}
              onClick={() => onChoose(app, remember)}
            >
              <Navigation size={18} />
              {verified ? '입구로 안내 시작' : '주차장 위치로 안내 시작'}
            </a>
            <a
              className="text-link web-map-link"
              href={parkingMapUrl(lot)}
              target="_blank"
              rel="noreferrer"
            >
              앱이 열리지 않으면 웹 지도 보기
              <ExternalLink size={14} />
            </a>
            <p className="fine-print">
              네이버지도는 앱 설치가 필요해요. 실제 길안내는 선택한 지도 앱에서 시작됩니다.
            </p>
          </>
        )}
      </div>
    </dialog>
  );
}
