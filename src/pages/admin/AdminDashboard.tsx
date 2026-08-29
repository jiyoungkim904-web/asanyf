import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { won } from '../../lib/billing'
import { Loading } from '../../components/ui'

interface Overview {
  totalFarms: number
  totalBuyers: number
  requests: number
  reviewWaiting: number
  published: number
  openGroupBuys: number
  produceSubs: number
  gmv: number
}
interface FarmRow {
  farm: { id: string; farmName: string; ownerName: string; region: string; createdAt: string }
  productCount: number
  productNames: string[]
  requestCount: number
  reviewWaiting: number
  published: number
  listings: number
}
interface RevenueLite {
  contentMrr: number
  orderRev: number
  sourcingFee: number
  selfSaleFee: number
  groupBuyFee: number
  produceSubFee: number
  total: number
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [farms, setFarms] = useState<FarmRow[]>([])
  const [revenue, setRevenue] = useState<RevenueLite | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      const [o, f, r] = await Promise.all([api.admin.overview(), api.admin.farms(), api.admin.revenue()])
      if (!alive) return
      setOverview(o)
      setFarms(f)
      setRevenue(r as RevenueLite)
      setLoading(false)
    }
    load()
    const t = setInterval(load, 3000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 26 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            운영자 대시보드
          </h1>
          <p className="muted">농가·구매자·콘텐츠·커머스 현황을 한눈에 관리하세요.</p>
        </div>

        {loading || !overview ? (
          <Loading />
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat">
                <div className="label">전체 농가</div>
                <div className="value">{overview.totalFarms}</div>
              </div>
              <div className="stat">
                <div className="label">전체 구매자</div>
                <div className="value">{overview.totalBuyers}</div>
              </div>
              <div className="stat accent">
                <div className="label">콘텐츠 검수 대기</div>
                <div className="value">{overview.reviewWaiting}</div>
              </div>
              <div className="stat">
                <div className="label">진행 중 공동구매</div>
                <div className="value">{overview.openGroupBuys}</div>
              </div>
            </div>

            {overview.reviewWaiting > 0 && (
              <div className="notice notice-warn">
                <span className="ico">🔎</span>
                <div>
                  검수 대기 중인 콘텐츠가 <b>{overview.reviewWaiting}건</b> 있어요.{' '}
                  <Link to="/admin/contents">검수하러 가기 →</Link>
                </div>
              </div>
            )}

            {/* BM별 매출 요약 */}
            {revenue && (
              <div>
                <div className="spread" style={{ marginBottom: 12 }}>
                  <h2 className="section-title" style={{ fontSize: 18 }}>
                    수익모델별 현황 <span className="badge badge-warn">금액 예시</span>
                  </h2>
                  <Link to="/admin/revenue" className="btn btn-ghost btn-sm">자세히 →</Link>
                </div>
                <div className="rev-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                  <Link to="/admin/commerce" className="stat card-hover" style={{ textDecoration: 'none' }}>
                    <div className="label">🌱 유통 소싱</div>
                    <div className="value" style={{ fontSize: 20 }}>{won(revenue.sourcingFee)}</div>
                  </Link>
                  <Link to="/admin/revenue" className="stat card-hover" style={{ textDecoration: 'none' }}>
                    <div className="label">🎬 콘텐츠 구독</div>
                    <div className="value" style={{ fontSize: 20 }}>{won(revenue.contentMrr)}</div>
                  </Link>
                  <Link to="/admin/revenue" className="stat card-hover" style={{ textDecoration: 'none' }}>
                    <div className="label">➕ 콘텐츠 건별</div>
                    <div className="value" style={{ fontSize: 20 }}>{won(revenue.orderRev)}</div>
                  </Link>
                  <Link to="/admin/commerce" className="stat card-hover" style={{ textDecoration: 'none' }}>
                    <div className="label">🏷️ 자체 판매</div>
                    <div className="value" style={{ fontSize: 20 }}>{won(revenue.selfSaleFee)}</div>
                  </Link>
                  <Link to="/admin/commerce" className="stat card-hover" style={{ textDecoration: 'none' }}>
                    <div className="label">🤝 공동구매</div>
                    <div className="value" style={{ fontSize: 20 }}>{won(revenue.groupBuyFee)}</div>
                  </Link>
                  <Link to="/admin/commerce" className="stat card-hover" style={{ textDecoration: 'none' }}>
                    <div className="label">📦 정기구독</div>
                    <div className="value" style={{ fontSize: 20 }}>{won(revenue.produceSubFee)}</div>
                  </Link>
                </div>
                <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>
                  누적 커머스 거래액(GMV) {won(overview.gmv)} · 정기구독 {overview.produceSubs}건
                </p>
              </div>
            )}

            <div>
              <div className="spread" style={{ marginBottom: 14 }}>
                <h2 className="section-title">농가 목록</h2>
                <Link to="/admin/commerce" className="btn btn-outline btn-sm">커머스 현황 →</Link>
              </div>
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>농가명</th><th>대표자</th><th>지역</th><th>농산물</th>
                      <th>요청 콘텐츠</th><th>검수 대기</th><th>판매 상품</th><th>가입일</th><th>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farms.map((row) => (
                      <tr key={row.farm.id}>
                        <td><b>{row.farm.farmName}</b></td>
                        <td>{row.farm.ownerName}</td>
                        <td>{row.farm.region}</td>
                        <td>
                          {row.productCount > 0 ? (
                            <span title={row.productNames.join(', ')}>
                              {row.productNames.slice(0, 2).join(', ')}
                              {row.productCount > 2 && ` 외 ${row.productCount - 2}`}
                            </span>
                          ) : (
                            <span className="muted">없음</span>
                          )}
                        </td>
                        <td>{row.requestCount}건</td>
                        <td>
                          {row.reviewWaiting > 0 ? (
                            <span className="badge badge-warn">{row.reviewWaiting}</span>
                          ) : (
                            <span className="muted">0</span>
                          )}
                        </td>
                        <td>{row.listings}개</td>
                        <td>{formatDate(row.farm.createdAt)}</td>
                        <td>
                          <Link to={`/admin/farms/${row.farm.id}`} className="btn btn-outline btn-sm">상세</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
