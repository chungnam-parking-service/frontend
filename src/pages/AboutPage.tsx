import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function AboutPage() {
  return (
    <>
      <PageHeader title="입구를 소개해요" />
      <article className="page about-page">
        <p className="eyebrow">목적지보다 한 걸음 먼저</p>
        <h2>
          주차부터 도착까지,
          <br />
          조금 더 편안하게.
        </h2>
        <p>
          입구는 충남에서 차로 목적지를 방문할 때 주차장 위치와 이용 조건, 주차 후 이동 방법을 함께
          확인하는 서비스예요.
        </p>
        <section>
          <h3>알고 있는 정보만 안내해요</h3>
          <p>
            주차 가능은 실시간 빈자리 보장을 뜻하지 않아요. 확인되지 않은 입구, 요금, 도보 시간은
            미확인으로 표시해요. 출발 전 운영시간과 현장 안내를 확인해 주세요.
          </p>
        </section>
        <section id="registration">
          <h3>주차 정보 등록 안내</h3>
          <p>
            현재는 등록·수정 접수 기능을 준비하고 있어요. 매장별 입구 사진과 좌표, 주차 혜택, 등록
            방법을 확인한 뒤 제공할 예정이에요.
          </p>
        </section>
        <Link className="button button-primary" to="/">
          목적지 찾아보기
        </Link>
      </article>
    </>
  );
}
