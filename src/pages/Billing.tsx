import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { ORDER_PRICE, won } from '../lib/billing'
import type { Entitlement, Order, OrderType, Plan, Subscription } from '../lib/types'
import { ORDER_LABEL, ORDER_STATUS_LABEL } from '../lib/types'
import { formatDate } from '../lib/format'
import { Button, Loading, Notice } from '../components/ui'
import { PayModal } from '../components/PayModal'

interface Billing {
  subscription: Subscription | null
  plan: Plan | null
  quotaRemaining: number
  orders: Order[]
  entitlement: Entitlement
}

function entitlementInfo(e: Entitlement): { tone: 'ok' | 'info' | 'warn'; text: string } {
  if (e.kind === 'subscription')
    return {
      tone: 'ok',
      text: `지금 콘텐츠를 만들면 ${e.plan.name} 구독 한도에서 차감됩니다. (잔여 ${e.remaining}건)`,
    }
  return {
    tone: 'warn',
    text: `콘텐츠 구독이 없거나 한도를 모두 사용했어요. 지금 만들면 건별 ${won(e.price)}(예시)이 결제됩니다.`,
  }
}

export default function BillingPage() {
  const { farm } = useAuth()
  const [data, setData] = useState<Billing | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderType, setOrderType] = useState<OrderType | null>(null)

  const load = useCallback(async () => {
    if (!farm) return
    const b = await api.getBilling(farm.id)
    setData(b as Billing)
    setLoading(false)
  }, [farm])

  useEffect(() => {
    load()
  }, [load])

  if (!farm) return null

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 24, maxWidth: 900 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            결제·구독 관리
          </h1>
          <p className="muted">구독 상태와 사용량, 결제 내역을 확인하세요.</p>
        </div>

        {loading || !data ? (
          <Loading />
        ) : (
          <>
            <Notice tone="info">
              이 페이지는 <b>AI 콘텐츠 제작 구독</b>이에요. 농산물을 파는{' '}
              <Link to="/store">판매 관리</Link>는 별도입니다.
            </Notice>

            {/* 구독 */}
            <div className="card card-pad">
              <div className="spread">
                <h2 style={{ fontSize: 18 }}>내 구독</h2>
                <Link to="/pricing" className="btn btn-ghost btn-sm">
                  요금제 보기 / 변경 →
                </Link>
              </div>

              {data.subscription && data.plan ? (
                <>
                  <div className="spread" style={{ marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>
                        {data.plan.name}{' '}
                        <span className="muted" style={{ fontSize: 15, fontWeight: 600 }}>
                          {won(data.plan.priceMonthly)}
                          {data.plan.priceMonthly > 0 && ' / 월'}
                        </span>
                      </div>
                      <p className="muted" style={{ fontSize: 14 }}>
                        다음 결제일 {formatDate(data.subscription.renewsAt)}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 24, fontWeight: 800 }}>
                        {data.quotaRemaining} / {data.plan.monthlyQuota}건
                      </div>
                      <div className="muted" style={{ fontSize: 13 }}>이번 달 잔여</div>
                    </div>
                  </div>
                  <div className="meter" style={{ marginTop: 12 }}>
                    <span
                      style={{
                        width: `${(data.subscription.usedThisCycle / data.plan.monthlyQuota) * 100}%`,
                      }}
                    />
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 14, color: 'var(--danger)' }}
                    onClick={async () => {
                      if (confirm('구독을 해지하시겠어요? 이번 주기 종료까지는 계속 이용할 수 있어요.')) {
                        await api.cancelSubscription(farm.id)
                        load()
                      }
                    }}
                  >
                    구독 해지
                  </button>
                </>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <Notice tone="info">
                    구독 중인 요금제가 없어요. 구독하면 매월 정해진 수만큼 콘텐츠를 만들 수 있어요.
                  </Notice>
                  <Link to="/pricing" className="btn btn-primary" style={{ marginTop: 12 }}>
                    요금제 보러 가기
                  </Link>
                </div>
              )}
            </div>

            {/* 이번 콘텐츠 제작 시 적용 */}
            {(() => {
              const info = entitlementInfo(data.entitlement)
              return <Notice tone={info.tone}>{info.text}</Notice>
            })()}

            {/* 건별 부가 서비스 */}
            <div>
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                부가 서비스 (건별 결제)
              </h2>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {(Object.keys(ORDER_LABEL) as OrderType[]).map((t) => (
                  <div className="card card-pad" key={t}>
                    <b>{ORDER_LABEL[t]}</b>
                    <div style={{ fontSize: 20, fontWeight: 800, margin: '6px 0' }}>
                      {won(ORDER_PRICE[t])}
                      <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}> (예시)</span>
                    </div>
                    <Button size="sm" variant="outline" block onClick={() => setOrderType(t)}>
                      신청하기
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 결제 내역 */}
            <div>
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                결제 내역
              </h2>
              {data.orders.length === 0 ? (
                <p className="muted">아직 결제 내역이 없어요.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>일자</th>
                        <th>항목</th>
                        <th>메모</th>
                        <th>금액</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => (
                        <tr key={o.id}>
                          <td>{formatDate(o.createdAt)}</td>
                          <td>{ORDER_LABEL[o.type]}</td>
                          <td className="muted">{o.memo || '-'}</td>
                          <td>{won(o.amount)}</td>
                          <td>
                            <span className="badge badge-neutral">{ORDER_STATUS_LABEL[o.status]}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {orderType && (
        <PayModal
          title={ORDER_LABEL[orderType]}
          amount={ORDER_PRICE[orderType]}
          note="운영자가 확인 후 진행합니다."
          confirmLabel="결제하고 신청"
          onConfirm={async () => {
            await api.createOrder({ farmId: farm.id, type: orderType })
            setOrderType(null)
            load()
          }}
          onClose={() => setOrderType(null)}
        />
      )}
    </div>
  )
}
