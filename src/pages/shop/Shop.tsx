import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { Art, Loading } from '../../components/ui'
import type { Content, Farm, FarmPost, FarmProduct, GroupBuy, Listing, SanjiEpisode } from '../../lib/types'

interface Home {
  recommended: { listing: Listing; farm: Farm; product?: FarmProduct }[]
  groupBuys: { gb: GroupBuy; farm: Farm }[]
  latestEpisode?: SanjiEpisode
  latestPosts: { post: FarmPost; farm: Farm }[]
  reels: { content: Content; farm: Farm; product?: FarmProduct }[]
}

const SLIDES = [
  { cls: '', kicker: '오늘의 산지', h: '아산 배 농장', p: '신선한 제철 배를 만나보세요!' },
  { cls: 'g2', kicker: '공동구매', h: '모여서 더 싸게', p: '목표 수량 채우면 최대 20% 할인' },
  { cls: 'g3', kicker: '정기구독', h: '제철 박스 정기배송', p: '주문 안 해도 알아서 도착해요' },
]

export default function Shop() {
  const [data, setData] = useState<Home | null>(null)
  const [loading, setLoading] = useState(true)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    api.buyer.home().then((h) => {
      setData(h as Home)
      setLoading(false)
    })
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 3500)
    return () => clearInterval(t)
  }, [])

  if (loading || !data) return <div className="page"><div className="container"><Loading /></div></div>

  return (
    <div className="page">
      <div className="container">
        {/* 히어로 캐러셀 */}
        <div className="hero-carousel">
          {SLIDES.map((s, i) => (
            <div key={i} className={`hero-slide ${s.cls} ${i === slide ? 'on' : ''}`}>
              <span className="kicker">{s.kicker}</span>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
          <div className="hero-dots">
            {SLIDES.map((_, i) => (
              <span key={i} className={i === slide ? 'on' : ''} onClick={() => setSlide(i)} />
            ))}
          </div>
        </div>

        {/* 퀵 메뉴 */}
        <div className="quick-grid">
          <Link to="/shop/sourcing">
            <div className="q-ico g">🌱</div>
            <span>농장별 소싱</span>
          </Link>
          <Link to="/shop/studio">
            <div className="q-ico a">🎬</div>
            <span>AI 숏폼 제작</span>
          </Link>
          <Link to="/shop/groupbuy">
            <div className="q-ico g">👥</div>
            <span>공동구매</span>
          </Link>
          <Link to="/shop/sanji">
            <div className="q-ico a">📍</div>
            <span>산지왔서영</span>
          </Link>
        </div>

        {/* 추천 농산물 */}
        <div className="app-section">
          <div className="sec-head">
            <h2>추천 농산물</h2>
            <Link to="/shop/search">전체보기</Link>
          </div>
          <div className="h-rail">
            {data.recommended.map(({ listing, farm, product }) => (
              <Link key={listing.id} to={`/shop/product/${listing.id}`} className="rail-card">
                <div className="rc-thumb">
                  <Art name={product?.name ?? listing.title} photos={product?.photos} />
                </div>
                <div className="rc-farm">{farm.farmName}</div>
                <div className="rc-title">{listing.title}</div>
                <div className="rc-price">{won(listing.price)}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* 산지왔서영 최신 */}
        {data.latestEpisode && (
          <div className="app-section">
            <div className="sec-head">
              <h2>📍 산지왔서영</h2>
              <Link to="/shop/sanji">전체보기</Link>
            </div>
            <Link to="/shop/sanji" className="ep-card">
              <div className="ep-thumb">
                <span className="ep-badge">EP.{data.latestEpisode.epNo}</span>
                <span className="ep-play" />
                <span className="ep-cap">{data.latestEpisode.title}</span>
              </div>
              <div className="ep-body">
                <div className="ep-meta">
                  {data.latestEpisode.host} · 조회 {(data.latestEpisode.views / 10000).toFixed(1)}만
                </div>
                <div className="ep-sum">{data.latestEpisode.summary}</div>
              </div>
            </Link>
          </div>
        )}

        {/* 공동구매 미리보기 */}
        {data.groupBuys.length > 0 && (
          <div className="app-section">
            <div className="sec-head">
              <h2>🤝 진행 중 공동구매</h2>
              <Link to="/shop/groupbuy">전체보기</Link>
            </div>
            <div className="h-rail">
              {data.groupBuys.map(({ gb, farm }) => {
                const pct = Math.min(100, Math.round((gb.currentQty / gb.targetQty) * 100))
                return (
                  <Link key={gb.id} to={`/shop/groupbuy/${gb.id}`} className="rail-card" style={{ width: 150 }}>
                    <div className="rc-thumb" style={{ width: 150, height: 110 }}>
                      <Art name={gb.title} />
                    </div>
                    <div className="rc-farm">{farm.farmName}</div>
                    <div className="rc-title">{gb.title}</div>
                    <div className="rc-price">
                      <s>{won(gb.normalPrice)}</s>
                      {won(gb.groupPrice)}
                    </div>
                    <div className="gb-progress" style={{ marginTop: 4 }}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <div className="rc-farm" style={{ color: 'var(--muted)' }}>
                      {gb.currentQty}/{gb.targetQty} 참여
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 콘텐츠(숏폼) 레일 */}
        {data.reels.length > 0 && (
          <div className="app-section">
            <div className="sec-head">
              <h2>🎬 농가 숏폼</h2>
              <Link to="/shop/reels">전체보기</Link>
            </div>
            <div className="h-rail">
              {data.reels.map(({ content, farm }) => (
                <Link key={content.id} to="/shop/reels" className="reel-rail-card">
                  <div className="rr-thumb">
                    <Art name={content.title} />
                    <span className="rr-play" />
                    <span className="rr-cap">
                      {farm.farmName}
                      <br />
                      {content.title}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
