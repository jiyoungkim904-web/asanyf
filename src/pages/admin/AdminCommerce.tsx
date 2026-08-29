import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { formatDate } from '../../lib/format'
import {
  GROUPBUY_STATUS_LABEL,
  PRODUCE_PLAN_LABEL,
  PRODUCE_SUB_STATUS_LABEL,
  SHOP_ORDER_STATUS_LABEL,
  SOURCING_STATUS_LABEL,
} from '../../lib/types'
import type {
  Buyer, Farm, FarmProduct, GroupBuy, Listing, ProduceSub, ShopOrder, SourcingRequest,
} from '../../lib/types'
import { Loading, Notice } from '../../components/ui'

interface Commerce {
  feeRate: number
  subFeeRate: number
  listings: { listing: Listing; farm: Farm; sold: number; gross: number; fee: number }[]
  orders: { order: ShopOrder; buyer?: Buyer }[]
  groupBuys: { gb: GroupBuy; farm: Farm }[]
  produceSubs: { sub: ProduceSub; farm: Farm; buyer?: Buyer }[]
  sourcing: { req: SourcingRequest; farm: Farm; product: FarmProduct; seller?: Buyer }[]
  totals: { gmv: number; fee: number; orders: number }
}

const TABS = [
  { key: 'sourcing', label: '소싱' },
  { key: 'orders', label: '주문' },
  { key: 'listings', label: '판매 상품' },
  { key: 'groupbuy', label: '공동구매' },
  { key: 'subs', label: '정기구독' },
] as const

export default function AdminCommerce() {
  const [data, setData] = useState<Commerce | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('sourcing')

  useEffect(() => {
    const load = () => api.admin.commerce().then((d) => {
      setData(d as Commerce)
      setLoading(false)
    })
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [])

  if (loading || !data) return <div className="page"><div className="container"><Loading /></div></div>

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 22 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            커머스 현황
          </h1>
          <p className="muted">
            사이트 내 자체 판매 · 공동구매 · 농산물 정기구독. 수수료 {Math.round(data.feeRate * 100)}%
            (정기구독 {Math.round(data.subFeeRate * 100)}%), 예시.
          </p>
        </div>

        <div className="stat-grid">
          <div className="stat">
            <div className="label">누적 거래액(GMV)</div>
            <div className="value" style={{ fontSize: 22 }}>{won(data.totals.gmv)}</div>
          </div>
          <div className="stat accent">
            <div className="label">플랫폼 수수료</div>
            <div className="value" style={{ fontSize: 22 }}>{won(data.totals.fee)}</div>
          </div>
          <div className="stat">
            <div className="label">주문 수</div>
            <div className="value">{data.totals.orders}</div>
          </div>
          <div className="stat">
            <div className="label">정기구독</div>
            <div className="value">{data.produceSubs.filter((s) => s.sub.status === 'active').length}</div>
          </div>
        </div>

        <div className="pill-tab">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'on' : ''} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="table-wrap">
          {tab === 'sourcing' && (
            <table className="data">
              <thead>
                <tr><th>신청일</th><th>판매자</th><th>농가</th><th>품목</th><th>수량</th><th>거래액</th><th>수수료</th><th>상태</th></tr>
              </thead>
              <tbody>
                {data.sourcing.map(({ req, farm, product, seller }) => (
                  <tr key={req.id}>
                    <td>{formatDate(req.createdAt)}</td>
                    <td>{seller?.name ?? '-'}</td>
                    <td><Link to={`/admin/farms/${farm.id}`}>{farm.farmName}</Link></td>
                    <td>{product.name}</td>
                    <td>{req.qtyKg}kg</td>
                    <td>{won(req.amount)}</td>
                    <td className="muted">{won(req.fee)}</td>
                    <td>
                      <span className={`badge ${req.status === 'confirmed' || req.status === 'shipped' ? 'badge-ok' : req.status === 'inquiry' ? 'badge-neutral' : 'badge-warn'}`}>
                        {SOURCING_STATUS_LABEL[req.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.sourcing.length === 0 && <tr><td colSpan={8} className="muted center">소싱 신청이 없습니다.</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'orders' && (
            <table className="data">
              <thead>
                <tr><th>주문일</th><th>구매자</th><th>상품</th><th>유형</th><th>결제액</th><th>수수료</th><th>상태</th></tr>
              </thead>
              <tbody>
                {data.orders.map(({ order, buyer }) => (
                  <tr key={order.id}>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{buyer?.name ?? '-'}</td>
                    <td>{order.items.map((it) => `${it.title}×${it.qty}`).join(', ')}</td>
                    <td>{order.kind === 'groupbuy' ? '공동구매' : order.kind === 'subscription' ? '정기구독' : '일반'}</td>
                    <td>{won(order.total)}</td>
                    <td className="muted">{won(order.platformFee)}</td>
                    <td><span className="badge badge-info">{SHOP_ORDER_STATUS_LABEL[order.status]}</span></td>
                  </tr>
                ))}
                {data.orders.length === 0 && <tr><td colSpan={7} className="muted center">주문이 없습니다.</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'listings' && (
            <table className="data">
              <thead>
                <tr><th>농가</th><th>상품</th><th>판매가</th><th>누적 판매</th><th>거래액</th><th>수수료</th></tr>
              </thead>
              <tbody>
                {data.listings.map(({ listing, farm, sold, gross, fee }) => (
                  <tr key={listing.id}>
                    <td><Link to={`/admin/farms/${farm.id}`}>{farm.farmName}</Link></td>
                    <td>{listing.title}</td>
                    <td>{won(listing.price)}</td>
                    <td>{sold}건</td>
                    <td>{won(gross)}</td>
                    <td className="muted">{won(fee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'groupbuy' && (
            <table className="data">
              <thead>
                <tr><th>농가</th><th>공동구매</th><th>정상가 → 공구가</th><th>진행</th><th>마감</th><th>상태</th></tr>
              </thead>
              <tbody>
                {data.groupBuys.map(({ gb, farm }) => (
                  <tr key={gb.id}>
                    <td>{farm.farmName}</td>
                    <td>{gb.title}</td>
                    <td>{won(gb.normalPrice)} → {won(gb.groupPrice)}</td>
                    <td>{gb.currentQty}/{gb.targetQty}</td>
                    <td>{formatDate(gb.deadline)}</td>
                    <td>
                      <span className={`badge ${gb.status === 'reached' ? 'badge-ok' : gb.status === 'open' ? 'badge-warn' : 'badge-neutral'}`}>
                        {GROUPBUY_STATUS_LABEL[gb.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.groupBuys.length === 0 && <tr><td colSpan={6} className="muted center">공동구매가 없습니다.</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'subs' && (
            <table className="data">
              <thead>
                <tr><th>구매자</th><th>농가</th><th>박스</th><th>주기</th><th>월 금액</th><th>다음 배송</th><th>상태</th></tr>
              </thead>
              <tbody>
                {data.produceSubs.map(({ sub, farm, buyer }) => (
                  <tr key={sub.id}>
                    <td>{buyer?.name ?? '-'}</td>
                    <td>{farm.farmName}</td>
                    <td>{sub.boxName}</td>
                    <td>{PRODUCE_PLAN_LABEL[sub.plan]}</td>
                    <td>{won(sub.boxPrice)}</td>
                    <td>{formatDate(sub.nextDelivery)}</td>
                    <td>
                      <span className={`badge ${sub.status === 'active' ? 'badge-ok' : 'badge-neutral'}`}>
                        {PRODUCE_SUB_STATUS_LABEL[sub.status]}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.produceSubs.length === 0 && <tr><td colSpan={7} className="muted center">정기구독이 없습니다.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <Notice tone="info">판매·정산 데이터 일부는 프로토타입 예시입니다.</Notice>
      </div>
    </div>
  )
}
