import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { Content, ContentRequest, DetailPage, Farm, FarmProduct, GroupBuy, Listing, ProduceSub } from '../../lib/types'
import { CULTIVATION_LABEL, GROUPBUY_STATUS_LABEL, LENGTH_LABEL, LISTING_STATUS_LABEL } from '../../lib/types'
import { won } from '../../lib/billing'
import { Loading, Notice, StatusBadge, VideoThumb } from '../../components/ui'

interface Detail {
  farm: Farm
  products: FarmProduct[]
  detailPages: DetailPage[]
  requests: ContentRequest[]
  contents: Content[]
  listings: Listing[]
  groupBuys: GroupBuy[]
  produceSubs: ProduceSub[]
}

export default function AdminFarmDetail() {
  const { id } = useParams()
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.admin
      .farmDetail(id)
      .then((d) => setDetail(d as Detail))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page"><div className="container"><Loading /></div></div>
  if (error || !detail)
    return (
      <div className="page">
        <div className="container">
          <Notice tone="danger">{error || '농가를 찾을 수 없습니다.'}</Notice>
        </div>
      </div>
    )

  const { farm, products, contents } = detail
  const productMap = new Map(products.map((p) => [p.id, p]))
  const dpByProduct = new Map(detail.detailPages.map((d) => [d.productId, d]))

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 24 }}>
        <Link to="/admin" className="back-link">
          ← 농가 목록
        </Link>

        {/* 농가 정보 */}
        <div className="card card-pad">
          <div className="spread">
            <div>
              <h1 style={{ fontSize: 24 }}>{farm.farmName}</h1>
              <p className="muted">
                {farm.ownerName} 대표 · {farm.region}
              </p>
            </div>
            <span className="badge badge-neutral">가입일 {formatDate(farm.createdAt)}</span>
          </div>
          <div className="divider" />
          <div className="review-card">
            <dl>
              <dt>연락처</dt>
              <dd>{farm.phone}</dd>
              <dt>이메일</dt>
              <dd>{farm.email}</dd>
            </dl>
          </div>
        </div>

        {/* 농산물 데이터 */}
        <div>
          <h2 className="section-title" style={{ marginBottom: 14 }}>
            등록 농산물 ({products.length})
          </h2>
          <div className="stack" style={{ gap: 14 }}>
            {products.map((p) => (
              <div className="card card-pad" key={p.id}>
                <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <VideoThumb productName={p.name} photo={p.photos[0]} showPlay={false} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="spread">
                      <b style={{ fontSize: 17 }}>{p.name}</b>
                      <span className="row" style={{ gap: 6 }}>
                        {dpByProduct.get(p.id) ? (
                          <span className={`badge ${dpByProduct.get(p.id)!.status === 'published' ? 'badge-ok' : 'badge-warn'}`}>
                            상세페이지 {dpByProduct.get(p.id)!.status === 'published' ? '확정' : '초안'}
                          </span>
                        ) : (
                          <span className="badge badge-neutral">상세페이지 없음</span>
                        )}
                        <span className="badge badge-ok">{CULTIVATION_LABEL[p.method]}</span>
                      </span>
                    </div>
                    <p className="muted" style={{ fontSize: 14, margin: '4px 0 8px' }}>
                      품종 {p.variety || '-'} · {p.region} · {p.harvestSeason} 수확 · 사진 {p.photos.length}장
                    </p>
                    <p style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{p.story}</p>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="muted">등록된 농산물이 없습니다.</p>}
          </div>
        </div>

        {/* 콘텐츠 요청 현황 */}
        <div>
          <h2 className="section-title" style={{ marginBottom: 14 }}>
            콘텐츠 ({contents.length})
          </h2>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>콘텐츠 제목</th>
                  <th>농산물</th>
                  <th>길이</th>
                  <th>요청일</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((c) => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{productMap.get(c.productId)?.name ?? '-'}</td>
                    <td>{LENGTH_LABEL[c.length]}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <Link to={`/admin/contents/${c.id}`} className="btn btn-outline btn-sm">
                        {c.status === 'review' ? '검수' : '보기'}
                      </Link>
                    </td>
                  </tr>
                ))}
                {contents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted center">
                      콘텐츠 요청이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 커머스 */}
        <div>
          <h2 className="section-title" style={{ marginBottom: 14 }}>
            판매 · 공동구매 · 정기구독
          </h2>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="card card-pad">
              <b style={{ fontSize: 15 }}>판매 상품 ({detail.listings.length})</b>
              <div className="stack" style={{ gap: 6, marginTop: 8 }}>
                {detail.listings.map((l) => (
                  <div key={l.id} className="spread" style={{ fontSize: 14 }}>
                    <span>{l.title}</span>
                    <span className="muted">{won(l.price)} · {LISTING_STATUS_LABEL[l.status]}</span>
                  </div>
                ))}
                {detail.listings.length === 0 && <span className="muted" style={{ fontSize: 14 }}>없음</span>}
              </div>
            </div>
            <div className="card card-pad">
              <b style={{ fontSize: 15 }}>공동구매 ({detail.groupBuys.length})</b>
              <div className="stack" style={{ gap: 6, marginTop: 8 }}>
                {detail.groupBuys.map((g) => (
                  <div key={g.id} className="spread" style={{ fontSize: 14 }}>
                    <span>{g.title}</span>
                    <span className="muted">{g.currentQty}/{g.targetQty} · {GROUPBUY_STATUS_LABEL[g.status]}</span>
                  </div>
                ))}
                {detail.groupBuys.length === 0 && <span className="muted" style={{ fontSize: 14 }}>없음</span>}
              </div>
            </div>
            <div className="card card-pad">
              <b style={{ fontSize: 15 }}>정기구독자 ({detail.produceSubs.filter((s) => s.status === 'active').length})</b>
              <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
                {detail.produceSubs.length === 0
                  ? '없음'
                  : `${detail.produceSubs.length}명 (활성 ${detail.produceSubs.filter((s) => s.status === 'active').length})`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
