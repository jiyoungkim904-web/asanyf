import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { useAuth } from '../../lib/auth'
import { GROUPBUY_STATUS_LABEL } from '../../lib/types'
import type { Farm, FarmProduct, GroupBuy, SanjiEpisode } from '../../lib/types'
import { Art, Button, Loading, Notice } from '../../components/ui'
import { PayModal } from '../../components/PayModal'

function useCountdown(deadline: string) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(deadline).getTime() - Date.now()))
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(deadline).getTime() - Date.now())), 1000)
    return () => clearInterval(t)
  }, [deadline])
  const d = Math.floor(left / 86400000)
  const h = Math.floor((left % 86400000) / 3600000)
  const m = Math.floor((left % 3600000) / 60000)
  const s = Math.floor((left % 60000) / 1000)
  const p = (n: number) => String(n).padStart(2, '0')
  return left <= 0 ? '마감' : `${d}일 ${p(h)}:${p(m)}:${p(s)}`
}

export default function ShopGroupBuy() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { buyer } = useAuth()
  const [data, setData] = useState<{ gb: GroupBuy; farm: Farm; product?: FarmProduct } | null>(null)
  const [episode, setEpisode] = useState<SanjiEpisode | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [pay, setPay] = useState(false)
  const [joined, setJoined] = useState(false)

  const load = async () => {
    if (!id) return
    try {
      const d = await api.buyer.getGroupBuy(id)
      setData(d)
      const eps = await api.buyer.sanji()
      setEpisode((eps as any[]).find((e) => e.ep.productId === d.gb.productId)?.ep ?? null)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [id])

  const countdown = useCountdown(data?.gb.deadline ?? new Date().toISOString())

  if (loading) return <div className="page"><div className="container"><Loading /></div></div>
  if (!data)
    return (
      <div className="page">
        <div className="container">
          <Notice tone="danger">
            공동구매를 찾을 수 없어요. <Link to="/shop/groupbuy">목록으로</Link>
          </Notice>
        </div>
      </div>
    )

  const { gb, farm, product } = data
  const pct = Math.min(100, Math.round((gb.currentQty / gb.targetQty) * 100))
  const closed = gb.status === 'closed' || countdown === '마감'
  const kg = gb.kgPerUnit ?? 1
  const participants = gb.participants.length

  async function doJoin() {
    if (!buyer) {
      navigate('/shop/login', { state: { from: `/shop/groupbuy/${id}` } })
      return
    }
    await api.buyer.joinGroupBuy(buyer.id, gb.id, qty)
    setPay(false)
    setJoined(true)
    load()
  }

  return (
    <div className="page">
      <div className="container">
        <Link to="/shop/groupbuy" className="back-link">← 공동구매</Link>

        {/* 메인 공동구매 카드 */}
        <div className="card card-pad">
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 68, height: 68, borderRadius: 14, position: 'relative', overflow: 'hidden', background: 'var(--brand-50)', flexShrink: 0 }}>
              <Art name={product?.name ?? gb.title} photos={product?.photos} />
            </div>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: 16 }}>{gb.title}</b>
              <div className="muted" style={{ fontSize: 12.5 }}>{farm.farmName} · 신선한 제철 배를 산지직송으로</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6 }}>
                <s style={{ fontSize: 13, color: 'var(--muted)', marginRight: 6 }}>{won(gb.normalPrice)}</s>
                {won(gb.groupPrice)}
              </div>
            </div>
          </div>

          <div className="row" style={{ gap: 8, marginTop: 14, textAlign: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{participants}명</div>
              <div className="muted" style={{ fontSize: 11 }}>현재 참여</div>
            </div>
            <div style={{ flex: 1.4 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--amber-600)' }}>{countdown}</div>
              <div className="muted" style={{ fontSize: 11 }}>남은 기간</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{gb.targetQty * kg}kg</div>
              <div className="muted" style={{ fontSize: 11 }}>목표 수량</div>
            </div>
          </div>

          <div className="gb-progress" style={{ height: 12, marginTop: 12 }}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="spread" style={{ fontSize: 12, marginTop: 4 }}>
            <span className="muted">{gb.currentQty * kg}kg 모집</span>
            <b>{pct}%</b>
          </div>

          {joined ? (
            <div style={{ marginTop: 14 }}>
              <Notice tone="ok">
                참여 완료! <Link to="/shop/mypage">내 주문 보기 →</Link>
              </Notice>
            </div>
          ) : closed ? (
            <div style={{ marginTop: 14 }}><Notice tone="warn">마감된 공동구매입니다.</Notice></div>
          ) : (
            <div className="row" style={{ gap: 10, marginTop: 14 }}>
              <div className="qty">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)}>+</button>
              </div>
              <Button block onClick={() => (buyer ? setPay(true) : doJoin())}>
                참여하기 ({won(qty * gb.groupPrice)})
              </Button>
            </div>
          )}
        </div>

        {/* 서영왔서영 */}
        {episode && (
          <div className="app-section">
            <div className="sec-head">
              <h2>📍 서영왔서영</h2>
              <Link to="/shop/sanji">전체보기</Link>
            </div>
            <Link to="/shop/sanji" className="ep-card">
              <div className="ep-thumb" style={{ aspectRatio: '16/8' }}>
                <span className="ep-badge">EP.{episode.epNo}</span>
                <span className="ep-play" />
                <span className="ep-cap">{episode.title}</span>
              </div>
              <div className="ep-body">
                <div className="ep-meta">{farm.farmName} · 조회 {(episode.views / 10000).toFixed(1)}만</div>
                <div className="ep-sum">{episode.summary}</div>
              </div>
            </Link>
          </div>
        )}

        {/* 인사이트 */}
        <div className="app-section">
          <div className="sec-head">
            <h2>인사이트</h2>
            <span className="badge badge-neutral">데모</span>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="card card-pad">
              <div className="muted" style={{ fontSize: 12 }}>AI 시세분석</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>주간 시세 상승 추이</div>
              <div style={{ color: 'var(--brand-700)', fontWeight: 800 }}>+12.4%</div>
            </div>
            <div className="card card-pad">
              <div className="muted" style={{ fontSize: 12 }}>콘텐츠 성과</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>조회수 24.5K</div>
              <div className="muted" style={{ fontSize: 12 }}>참여율 8.7%</div>
            </div>
            <div className="card card-pad">
              <div className="muted" style={{ fontSize: 12 }}>자동 업로드 일정</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>05.23 (금) 10:00</div>
            </div>
            <div className="card card-pad">
              <div className="muted" style={{ fontSize: 12 }}>채팅 · 정산</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4 }}>문의 3건</div>
              <div className="muted" style={{ fontSize: 12 }}>정산 대기 2건</div>
            </div>
          </div>
        </div>
      </div>

      {pay && (
        <PayModal
          title="공동구매 참여"
          amount={qty * gb.groupPrice}
          note={`${gb.title} · ${qty}구좌 (${qty * kg}kg)`}
          confirmLabel="결제하고 참여"
          onConfirm={doJoin}
          onClose={() => setPay(false)}
        />
      )}
    </div>
  )
}
