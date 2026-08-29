import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { formatDate } from '../../lib/format'
import { ORDER_LABEL, ORDER_STATUS_LABEL } from '../../lib/types'
import type { Farm, Order, Plan } from '../../lib/types'
import { Loading, Notice } from '../../components/ui'

interface Revenue {
  contentMrr: number
  orderRev: number
  sourcingFee: number
  sourcingGmv: number
  selfSaleFee: number
  groupBuyFee: number
  produceSubFee: number
  commerceGmv: number
  total: number
  subsByPlan: { plan: Plan; count: number }[]
  subscribers: { farm: Farm; plan: Plan; used: number; renewsAt: string }[]
  contentOrders: { order: Order; farm: Farm }[]
}

export default function AdminRevenue() {
  const [d, setD] = useState<Revenue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.revenue().then((r) => {
      setD(r as Revenue)
      setLoading(false)
    })
  }, [])

  if (loading || !d) return <div className="page"><div className="container"><Loading /></div></div>

  const rows = [
    { icon: '🌱', label: '유통 소싱 수수료 (거래액 3~7%)', value: d.sourcingFee, to: '/admin/commerce' },
    { icon: '🎬', label: 'AI 콘텐츠 SaaS 구독 (월)', value: d.contentMrr, to: null },
    { icon: '➕', label: 'AI 콘텐츠 건별·부가서비스', value: d.orderRev, to: null },
    { icon: '🏷️', label: '자체 판매 수수료 (5~15%)', value: d.selfSaleFee, to: '/admin/commerce' },
    { icon: '🤝', label: '공동구매·라이브커머스 수수료', value: d.groupBuyFee, to: '/admin/commerce' },
    { icon: '📦', label: '농산물 정기구독 수수료', value: d.produceSubFee, to: '/admin/commerce' },
  ]

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 24 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            매출 현황 <span className="badge badge-warn">금액 예시</span>
          </h1>
          <p className="muted">5가지 수익모델의 예상 매출입니다.</p>
        </div>

        <div className="card card-pad">
          <div className="stack" style={{ gap: 2 }}>
            {rows.map((r) => (
              <div
                key={r.label}
                className="spread"
                style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}
              >
                <span className="row" style={{ gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{r.icon}</span>
                  {r.to ? <Link to={r.to}>{r.label}</Link> : <span>{r.label}</span>}
                </span>
                <b>{won(r.value)}</b>
              </div>
            ))}
            <div className="spread" style={{ padding: '14px 0 2px', fontSize: 18, fontWeight: 800 }}>
              <span>합계</span>
              <span>{won(d.total)}</span>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            소싱 거래액 {won(d.sourcingGmv)} + 커머스 거래액(GMV) {won(d.commerceGmv)} 중 수수료·구독료만 매출로 집계.
          </p>
        </div>

        {/* 구독 분포 */}
        <div>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
            AI 콘텐츠 구독 요금제 분포
          </h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
            {d.subsByPlan.map(({ plan, count }) => (
              <div className="card card-pad" key={plan.id}>
                <b>{plan.name}</b>
                <div style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>{count}곳</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {won(plan.priceMonthly)}{plan.priceMonthly > 0 && '/월'} · 월 {plan.monthlyQuota}건
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 구독 농가 */}
        <div>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>구독 중인 농가</h2>
          {d.subscribers.length === 0 ? (
            <p className="muted">구독 중인 농가가 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>농가</th><th>요금제</th><th>이번 주기 사용</th><th>다음 결제일</th></tr></thead>
                <tbody>
                  {d.subscribers.map((s) => (
                    <tr key={s.farm.id}>
                      <td><b>{s.farm.farmName}</b></td>
                      <td>{s.plan.name} · {won(s.plan.priceMonthly)}/월</td>
                      <td>{s.used} / {s.plan.monthlyQuota}건</td>
                      <td>{formatDate(s.renewsAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 건별 결제 */}
        <div>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>AI 콘텐츠 건별·부가서비스 결제</h2>
          {d.contentOrders.length === 0 ? (
            <p className="muted">내역이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>일자</th><th>농가</th><th>항목</th><th>금액</th><th>상태</th></tr></thead>
                <tbody>
                  {d.contentOrders.map(({ order, farm }) => (
                    <tr key={order.id}>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>{farm.farmName}</td>
                      <td>{ORDER_LABEL[order.type]}{order.memo && <span className="muted"> · {order.memo}</span>}</td>
                      <td>{won(order.amount)}</td>
                      <td><span className="badge badge-neutral">{ORDER_STATUS_LABEL[order.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Notice tone="warn">
          모든 금액은 예시입니다. 요금제·수수료율·단가는 <code>src/lib/billing.ts</code> 한 곳에서 바꿉니다.
        </Notice>
      </div>
    </div>
  )
}
