import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Info, Menu } from 'lucide-react';
import { isMockMode } from '../services/parkingApi';

export function AppLayout() {
  const location = useLocation();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (menu.current) menu.current.open = false;
  }, [location.pathname, location.search]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        본문으로 바로가기
      </a>
      {location.pathname === '/' && (
        <header className="app-header">
          <Link to="/" className="brand" aria-label="입구 홈">
            <span>P</span>입구
          </Link>
          <details
            ref={menu}
            className="menu"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && menu.current) menu.current.open = false;
            }}
          >
            <summary aria-label="메뉴 열기">
              <Menu size={22} />
            </summary>
            <nav aria-label="주 메뉴">
              <Link to="/about">서비스 소개</Link>
              <Link to="/report">주차 정보 등록·수정</Link>
            </nav>
          </details>
        </header>
      )}
      {isMockMode && (
        <div className="demo-banner">
          <Info size={13} />
          <span>체험 모드 · 매장·좌표·요금은 가상 데이터예요.</span>
        </div>
      )}
      <main id="main">
        <Outlet />
      </main>
      {location.pathname === '/' && (
        <footer className="app-footer">
          <Link className="brand brand-small" to="/">
            입구
          </Link>
          <p>주차부터 도착까지, 조금 더 편안하게.</p>
          <Link to="/about">서비스 소개</Link>
        </footer>
      )}
    </div>
  );
}
