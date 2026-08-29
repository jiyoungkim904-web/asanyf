import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { useAuth } from '../../lib/auth'
import { formatDate } from '../../lib/format'
import {
  PRODUCE_PLAN_LABEL, PRODUCE_SUB_STATUS_LABEL, SHOP_ORDER_STATUS_LABEL, SOURCING_STATUS_LABEL,
} from '../../lib/types'
import type { Farm, FarmProduct, ProduceSub, ShopOrder, SourcingRequest } from '../../lib/types'
import { Button, Empty, Loading } from '../../components/ui'

export default function ShopMyPage() {
  const { buyer } = useAuth()
  const [orders, setOrders] = useState<ShopOrder[]>([])
  const [subs, setSubs] = useState<{ sub: ProduceSub; farm: Farm }[]>([])
  const [sourcing, setSourcing] = useState<{ req: SourcingRequest; farm: Farm; product: FarmProduct }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!buyer) return
    const [o, s, src] = await Promise.all([
      api.buyer.myOrders(buyer.id),
      api.buyer.myProduceSubs(buyer.id),
      api.buyer.mySourcing(buyer.id),
    ])
    setOrders(o)
    setSubs(s)
    setSourcing(src as any)
    setLoading(false)
  }, [buyer])

  useEffect(() => {
    load()
  }, [load])

  if (!buyer) return null

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 26, maxWidth: 820 }}>
        <div>
          <h1 className="app-title">{buyer.name}님의 주문·구독</h1>
          <p className="app-sub">{buyer.email}</p>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            {/* 소싱 내역 */}
            {sourcing.length > 0 && (
              <div>
                <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                  소싱 내역 (B2B)
                </h2>
                <div className="stack" style={{ gap: 10 }}>
                  {sourcing.map(({ req, farm, product }) => (
                    <div className="card card-pad" key={req.id}>
                      <div className="spread">
                        <div>
                          <b style={{ fontSize: 14 }}>{farm.farmName} · {product.name}</b>
                          <div className="muted" style={{ fontSize: 13 }}>
                            {req.qtyKg}kg · 거래액 {won(req.amount)} (수수료 {won(req.fee)})
                          </div>
                        </div>
                        <span className="badge badge-info">{SOURCING_STATUS_LABEL[req.status]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 정기구독 */}
            <div>
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                농산물 정기구독
              </h2>
              {subs.length === 0 ? (
                <Empty
                  emoji="📦"
                  title="구독 중인 농산물 박스가 없어요"
                  action={
                    <Link to="/shop/subscribe" className="btn btn-primary">
                      정기구독 둘러보기
                    </Link>
                  }
                />
              ) : (
                <div className="stack" style={{ gap: 12 }}>
                  {subs.map(({ sub, farm }) => (
                    <div className="card card-pad" key={sub.id}>
                      <div className="spread">
                        <div>
                          <b style={{ fontSize: 16 }}>{sub.boxName}</b>
                          <p className="muted" style={{ fontSize: 13 }}>
                            {farm.region} · {PRODUCE_PLAN_LABEL[sub.plan]} · {won(sub.boxPrice)}
                          </p>
                        </div>
                        <span className={`badge ${sub.status === 'active' ? 'badge-ok' : 'badge-neutral'}`}>
                          {PRODUCE_SUB_STATUS_LABEL[sub.status]}
                        </span>
                      </div>
                      {sub.status !== 'canceled' && (
                        <>
                          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                            다음 배송 예정: {formatDate(sub.nextDelivery)}
                          </p>
                          <div className="row" style={{ gap: 8, marginTop: 10 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await api.buyer.setProduceSubStatus(
                                  buyer.id,
                                  sub.id,
                                  sub.status === 'active' ? 'paused' : 'active',
                                )
                                load()
                              }}
                            >
                              {sub.status === 'active' ? '일시 정지' : '재개'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                if (confirm('정기구독을 해지할까요?')) {
                                  await api.buyer.setProduceSubStatus(buyer.id, sub.id, 'canceled')
                                  load()
                                }
                              }}
                            >
                              해지
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 주문 내역 */}
            <div>
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                주문 내역
              </h2>
              {orders.length === 0 ? (
                <Empty emoji="🧾" title="주문 내역이 없어요" />
              ) : (
                <div className="stack" style={{ gap: 12 }}>
                  {orders.map((o) => (
                    <div className="card card-pad" key={o.id}>
                      <div className="spread">
                        <span className="muted" style={{ fontSize: 13 }}>
                          {formatDate(o.createdAt)} ·{' '}
                          {o.kind === 'groupbuy' ? '공동구매' : o.kind === 'subscription' ? '정기구독' : '일반구매'}
                        </span>
                        <span className="badge badge-info">{SHOP_ORDER_STATUS_LABEL[o.status]}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {o.items.map((it, i) => (
                          <div key={i} style={{ fontSize: 14 }}>
                            {it.title} × {it.qty} — {won(it.qty * it.unitPrice)}
                          </div>
                        ))}
                      </div>
                      <div className="spread" style={{ marginTop: 8, fontWeight: 700 }}>
                        <span>결제 금액</span>
                        <span>{won(o.total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
