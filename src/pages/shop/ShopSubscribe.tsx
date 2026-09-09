import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { useAuth } from '../../lib/auth'
import { PRODUCE_PLAN_LABEL } from '../../lib/types'
import type { Farm, ProducePlan } from '../../lib/types'
import { Art, Button, Loading, Notice } from '../../components/ui'
import { PayModal } from '../../components/PayModal'

interface Box {
  farm: Farm
  boxName: string
  items: string[]
  monthly: number
  biweekly: number
}

export default function ShopSubscribe() {
  const navigate = useNavigate()
  const { buyer } = useAuth()
  const [boxes, setBoxes] = useState<Box[]>([])
  const [loading, setLoading] = useState(true)
  const [pick, setPick] = useState<{ box: Box; plan: ProducePlan } | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    api.buyer.produceBoxes().then((b) => {
      setBoxes(b as Box[])
      setLoading(false)
    })
  }, [])

  async function subscribe() {
    if (!pick) return
    if (!buyer) {
      navigate('/shop/login', { state: { from: '/shop/subscribe' } })
      return
    }
    await api.buyer.subscribeProduce(buyer.id, pick.box.farm.id, pick.plan)
    setDone(pick.box.boxName)
    setPick(null)
  }

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 20 }}>
        <div>
          <h1 className="app-title">농산물 정기구독</h1>
          <p className="app-sub">좋아하는 농가의 제철 농산물을 매번 주문 없이 자동 배송으로 받아보세요.</p>
        </div>

        {done && (
          <Notice tone="ok">
            <b>{done}</b> 정기구독을 시작했어요! <Link to="/shop/mypage">내 구독 관리 →</Link>
          </Notice>
        )}

        <Notice tone="info">
          이 정기구독은 <b>농산물</b>을 받는 소비자용이에요. 농가가 AI 콘텐츠를 만드는{' '}
          <Link to="/pricing">콘텐츠 제작 예치금(코인)</Link>과는 다릅니다.
        </Notice>

        {loading ? (
          <Loading />
        ) : (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {boxes.map((box) => (
              <div className="card card-pad stack" key={box.farm.id} style={{ gap: 12 }}>
                <div className="row" style={{ gap: 10 }}>
                  <span style={{ width: 48, height: 48, borderRadius: 12, position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'block' }}>
                    <Art name={box.items[0] ?? ''} />
                  </span>
                  <div>
                    <b style={{ fontSize: 16 }}>{box.boxName}</b>
                    <div className="muted" style={{ fontSize: 13 }}>{box.farm.region}</div>
                  </div>
                </div>
                <p className="muted" style={{ fontSize: 13 }}>구성 예시: {box.items.join(', ')}</p>
                <div className="row" style={{ gap: 8 }}>
                  <Button size="sm" variant="outline" block onClick={() => setPick({ box, plan: 'biweekly' })}>
                    2주 1회 {won(box.biweekly)}
                  </Button>
                  <Button size="sm" block onClick={() => setPick({ box, plan: 'monthly' })}>
                    월 1회 {won(box.monthly)}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {pick && (
        <PayModal
          title={`${pick.box.boxName} 정기구독`}
          amount={pick.plan === 'monthly' ? pick.box.monthly : pick.box.biweekly}
          cycle={PRODUCE_PLAN_LABEL[pick.plan]}
          note="첫 박스가 곧 발송되고, 이후 자동 결제·배송됩니다. 언제든 해지할 수 있어요."
          confirmLabel="정기구독 시작"
          onConfirm={subscribe}
          onClose={() => setPick(null)}
        />
      )}
    </div>
  )
}
