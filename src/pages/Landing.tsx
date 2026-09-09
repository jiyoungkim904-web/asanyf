import { Link } from 'react-router-dom'
import { PublicLayout } from '../components/Layout'
import { LinkButton } from '../components/ui'
import { HeroPhone } from '../components/HeroPhone'

const HOW = [
  { ico: '🧺', title: '농산물 발굴·소싱', desc: '우수한 지역 농산물 산지를 발굴하고 도매로 연결합니다.' },
  { ico: '🗄️', title: '농산물 데이터 등록', desc: '산지·품종·수확시기·가격·재고·스토리를 데이터로 정리해요.' },
  { ico: '✨', title: 'AI 콘텐츠 자동 생성', desc: '숏폼·상세페이지·광고카피를 AI가 자동으로 만듭니다.' },
  { ico: '📍', title: '산지 방문 콘텐츠', desc: '"서영왔서영" — 농가 방문·인터뷰·수확 체험 콘텐츠로 신뢰를 더합니다.' },
  { ico: '🛒', title: '온라인 판매·공동구매', desc: '네이버·쿠팡·SNS·공동구매로 실제 판매까지 연동합니다.' },
]

const FEATURES = [
  { fi: '🌱', title: '농산물 특화 AI', desc: '산지·시장·판매 데이터를 이해하는 도메인 특화 AI.' },
  { fi: '🎬', title: '콘텐츠 자동화', desc: '기획부터 제작까지 AI가 자동으로 생성합니다.' },
  { fi: '📍', title: '서영왔서영', desc: '배우·아나운서 출신 대표가 직접 찾아가는 산지 방문 콘텐츠.' },
  { fi: '🤝', title: '공동구매·판매 연동', desc: '콘텐츠에서 공동구매·온라인 판매로 완전 연동.' },
  { fi: '📈', title: '판매성과 학습', desc: '조회수·클릭률·전환율을 반영해 AI가 지속적으로 최적화.' },
  { fi: '🔒', title: '신뢰', desc: '산지 검증과 방문 콘텐츠로 소비자 신뢰를 구축합니다.' },
]

export default function Landing() {
  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1>
              전국 농산물의 실제 데이터를 기반으로
              <br />
              콘텐츠 제작과 온라인 판매를 자동화하는
              <br />
              <span className="accent">농업 특화 생성형 AI 커머스 플랫폼</span>
            </h1>
            <p className="lead">
              농산물 정보만 입력하면,
              <br />
              똑똑한 AI가 우리 농가의 이야기를 콘텐츠로 만들어드립니다.
            </p>
            <p className="lead">
              콘텐츠 제작부터 공동구매 · 온라인 판매까지 한 번에!
              <br />
              농산물 데이터 · 생성형 AI 콘텐츠 · 유튜브 채널 &lt;서영왔서영&gt;
            </p>
            <div className="cta-row">
              <LinkButton to="/signup" variant="primary" size="lg">
                농가·셀러 회원가입
              </LinkButton>
              <LinkButton to="/studio/video" variant="outline" size="lg">
                🎬 AI 영상 만들기
              </LinkButton>
            </div>
          </div>

          <div className="hero-visual">
            <HeroPhone />
          </div>
        </div>
      </section>

      {/* ── 이용 방법 ── */}
      <section className="lp-section" id="how">
        <div className="container">
          <div className="lp-head">
            <h2>산지 데이터 → AI 콘텐츠 → 실제 판매</h2>
            <p>발굴·소싱부터 공동구매까지, 다섯 단계로 연결합니다.</p>
          </div>
          <div className="how-grid how-grid-5">
            {HOW.map((h, i) => (
              <div className="how-card" key={h.title}>
                <span className="num">{i + 1}</span>
                <div className="ico">{h.ico}</div>
                <h3>{h.title}</h3>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 어떤 콘텐츠를 만들어주는지 ── */}
      <section className="lp-section sink">
        <div className="container">
          <div className="lp-head">
            <h2>이런 콘텐츠를 만들어드립니다</h2>
            <p>농가가 입력한 정보가 그대로 콘텐츠가 됩니다.</p>
          </div>
          <div className="example-grid">
            <div className="card card-pad">
              <span className="badge badge-ok" style={{ marginBottom: 12 }}>
                농가 입력 정보
              </span>
              <h3 style={{ fontSize: 20 }}>성환 배</h3>
              <div className="spec-list">
                <div className="spec">
                  <span className="k">농가 경력</span>
                  <span className="v">20년 배 농사</span>
                </div>
                <div className="spec">
                  <span className="k">재배방식</span>
                  <span className="v">친환경 재배</span>
                </div>
                <div className="spec">
                  <span className="k">수확시기</span>
                  <span className="v">9월 수확</span>
                </div>
                <div className="spec">
                  <span className="k">지역</span>
                  <span className="v">성환 지역 농가</span>
                </div>
              </div>
            </div>

            <div>
              <div className="example-arrow">AI 제작 · 운영자 검수 ↓</div>
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: 16 }}>
                  <div className="video-thumb wide" style={{ margin: '0 auto' }}>
                    <img src="/byoung.png" alt="서영왔서영 — 본격적으로 성환 배 따는 서영" />
                    <span className="play" aria-hidden />
                    <span className="len">15초</span>
                  </div>
                </div>
                <div style={{ padding: '0 20px 20px', textAlign: 'center' }}>
                  <div className="badge badge-info" style={{ marginBottom: 8 }}>
                    SNS 숏폼 영상
                  </div>
                  <p className="muted" style={{ fontSize: 14 }}>
                    "성환에서 20년째 배 농사를 짓고 있습니다…"
                    <br />
                    농가 이야기를 담은 15초 영상 + 게시글 문구
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="center" style={{ marginTop: 28 }}>
            <Link to="/studio/video" className="btn btn-primary btn-lg">
              🎬 AI로 직접 영상 만들어보기
            </Link>
            <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
              OpenRouter API 키만 있으면 텍스트·사진으로 바로 생성됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* ── 서비스 특징 ── */}
      <section className="lp-section">
        <div className="container">
          <div className="lp-head">
            <h2>서비스 특징</h2>
          </div>
          <div className="feature-grid">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <span className="fi">{f.fi}</span>
                <div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 이용 방법(BM) ── */}
      <section className="lp-section sink">
        <div className="container">
          <div className="lp-head">
            <h2>수익 모델</h2>
            <p>온라인 농산물 시장 14조원. 중소 셀러와 산지직송 시장을 공략합니다.</p>
          </div>
          <div className="bm-grid">
            <div className="bm-card">
              <span className="bi">🌱</span>
              <div>
                <h3>유통 소싱 수수료</h3>
                <p>산지↔셀러 도매 거래 중개. 거래액의 <b>3~7%</b>.</p>
              </div>
            </div>
            <div className="bm-card">
              <span className="bi">🎬</span>
              <div>
                <h3>AI 콘텐츠 예치금(코인)</h3>
                <p>구독 없이 <b>코인 선충전</b> 후 제작 시 차감. 대량 충전 시 <b>보너스 코인</b>.</p>
              </div>
            </div>
            <div className="bm-card">
              <span className="bi">🤝</span>
              <div>
                <h3>공동구매·라이브커머스 수수료</h3>
                <p>공동구매·라이브 판매액의 <b>5~15%</b>.</p>
              </div>
            </div>
            <div className="bm-card">
              <span className="bi">📦</span>
              <div>
                <h3>PB·브랜드 상품</h3>
                <p>자체 브랜드 상품 마진 <b>15~35%</b>. (정기구독 포함)</p>
              </div>
            </div>
          </div>
          <div className="center" style={{ marginTop: 28 }}>
            <Link to="/pricing" className="btn btn-outline btn-lg">
              요금·수익모델 자세히
            </Link>
          </div>
        </div>
      </section>

      {/* ── 최종 CTA ── */}
      <section className="final-cta">
        <div className="container">
          <h2>농산물을 더 젊고, 더 신뢰도 높게, 더 잘 팔리게</h2>
          <p>AI로 새로운 농산물 온라인 유통 시대를 엽니다.</p>
          <div className="row" style={{ gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn btn-amber btn-lg">
              스토어 둘러보기
            </Link>
            <Link to="/signup" className="btn btn-outline btn-lg" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}>
              농가·셀러 회원가입
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
