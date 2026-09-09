import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { CONTENT_COIN_COST, coins, won } from '../../lib/billing'
import { Art, Button, Loading, Notice } from '../../components/ui'
import type { CoinPack, Content, Farm } from '../../lib/types'

const TYPES = [
  { icon: '🖼️', label: '이미지 콘텐츠' },
  { icon: '🎬', label: '영상 콘텐츠' },
  { icon: '▶️', label: '유튜브 숏츠' },
  { icon: '📤', label: '릴 업로드' },
]

export default function ShopStudio() {
  const navigate = useNavigate()
  const [packs, setPacks] = useState<CoinPack[]>([])
  const [reels, setReels] = useState<{ content: Content; farm: Farm }[]>([])
  const [loading, setLoading] = useState(true)
  const [picked, setPicked] = useState('영상 콘텐츠')

  useEffect(() => {
    Promise.all([api.getCoinPacks(), api.buyer.reels()]).then(([p, r]) => {
      setPacks(p)
      setReels((r as any[]).slice(0, 3))
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="page"><div className="container"><Loading /></div></div>

  return (
    <div className="page">
      <div className="container">
        <h1 className="app-title">AI 콘텐츠 스튜디오</h1>
        <p className="app-sub">산지 데이터로 숏폼·상세페이지·광고 카피를 자동 생성</p>

        {/* 콘텐츠 유형 */}
        <div className="quick-grid">
          {TYPES.map((t) => (
            <button
              key={t.label}
              onClick={() => setPicked(t.label)}
              style={{
                background: picked === t.label ? 'var(--brand-50)' : '#fff',
                border: `1px solid ${picked === t.label ? 'var(--brand-300)' : 'var(--line)'}`,
                borderRadius: 16,
                padding: '14px 6px 12px',
                textAlign: 'center',
              }}
            >
              <div className="q-ico a" style={{ background: 'var(--amber-100)' }}>{t.icon}</div>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)' }}>{t.label}</span>
            </button>
          ))}
        </div>

        {/* 콘텐츠 미리보기 */}
        <div className="app-section">
          <div className="sec-head">
            <h2>콘텐츠 미리보기</h2>
            <Link to="/shop/reels">전체보기</Link>
          </div>
          <div className="h-rail">
            {reels.map(({ content, farm }) => (
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

        {/* 예치금 충전 팩 */}
        <div className="app-section">
          <div className="sec-head">
            <h2>예치금 충전 팩</h2>
            <span className="badge badge-warn">금액 예시</span>
          </div>
          <p className="app-sub" style={{ marginTop: -4 }}>
            월 구독 없이, 코인을 충전해 두고 콘텐츠 1건당 {coins(CONTENT_COIN_COST)}씩 차감돼요.
          </p>
          <div className="stack" style={{ gap: 12 }}>
            {packs.map((p) => (
              <div className={`plan ${p.recommended ? 'on' : ''}`} key={p.id} style={{ padding: '20px 18px' }}>
                {p.recommended && <span className="plan-badge">추천</span>}
                <div className="spread">
                  <span className="plan-name">{won(p.won)}</span>
                  <span className="plan-price" style={{ fontSize: 22 }}>{coins(p.coins + p.bonus)}</span>
                </div>
                <ul className="plan-feats" style={{ marginTop: 10 }}>
                  <li>기본 {coins(p.coins)}</li>
                  {p.bonus > 0 && <li>보너스 +{coins(p.bonus)}</li>}
                  <li>숏폼 영상 약 {Math.floor((p.coins + p.bonus) / CONTENT_COIN_COST)}건</li>
                </ul>
                <Button
                  variant={p.recommended ? 'primary' : 'outline'}
                  block
                  style={{ marginTop: 14 }}
                  onClick={() => navigate('/pricing')}
                >
                  충전하기
                </Button>
              </div>
            ))}
          </div>
          <Notice tone="info">가입 시 체험 코인이 지급돼요. 남은 코인은 사라지지 않습니다.</Notice>
        </div>

        <div className="app-section">
          <div className="sec-head">
            <h2>실제 생성형 영상</h2>
            <span className="badge badge-info">OpenRouter</span>
          </div>
          <Notice tone="info">
            내 OpenRouter API 키를 넣으면 Veo·Sora·Seedance 등 실제 비디오 생성 모델로 영상을 만들 수 있어요.
          </Notice>
          <Link to="/studio/video" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
            🎬 AI 영상 생성 스튜디오 열기
          </Link>
        </div>

        <div style={{ position: 'sticky', bottom: 8, marginTop: 20 }}>
          <Button size="lg" block onClick={() => navigate('/content/request')}>
            ✨ 콘텐츠 생성하기
          </Button>
        </div>
      </div>
    </div>
  )
}
