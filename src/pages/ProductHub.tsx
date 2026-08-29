import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CULTIVATION_LABEL } from '../lib/types'
import type { Content, DetailPage, FarmProduct } from '../lib/types'
import { formatDate } from '../lib/format'
import { Button, Loading, Notice, StatusBadge } from '../components/ui'

export default function ProductHub() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { farm } = useAuth()
  const [product, setProduct] = useState<FarmProduct | undefined>()
  const [dp, setDp] = useState<DetailPage | null>(null)
  const [contents, setContents] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!farm || !id) return
    Promise.all([
      api.getProduct(farm.id, id),
      api.getDetailPage(farm.id, id),
      api.listContents(farm.id),
    ]).then(([p, d, c]) => {
      setProduct(p)
      setDp(d)
      setContents(c.filter((x) => x.productId === id))
      setLoading(false)
    })
  }, [farm, id])

  if (!farm) return null
  if (loading) return <div className="page"><div className="container"><Loading /></div></div>
  if (!product)
    return (
      <div className="page">
        <div className="container">
          <Notice tone="danger">
            농산물을 찾을 수 없어요. <Link to="/dashboard">대시보드로</Link>
          </Notice>
        </div>
      </div>
    )

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 22, maxWidth: 820 }}>
        <Link to="/dashboard" className="back-link">← 대시보드</Link>

        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>{product.name}</h1>
          <p className="muted">
            {product.variety || '품종 미입력'} · {product.region} · {CULTIVATION_LABEL[product.method]} ·{' '}
            {product.harvestSeason} 수확
          </p>
        </div>

        {/* 1단계: AI 상세페이지 */}
        <div className="card card-pad">
          <div className="spread" style={{ marginBottom: 8 }}>
            <b style={{ fontSize: 16 }}>1. AI 상세페이지</b>
            {dp && (
              <span className={`badge ${dp.status === 'published' ? 'badge-ok' : 'badge-warn'}`}>
                {dp.status === 'published' ? '확정됨' : '초안'}
              </span>
            )}
          </div>
          {!dp ? (
            <>
              <p className="muted" style={{ fontSize: 14 }}>
                입력하신 농산물 정보를 AI가 판매용 상세페이지로 정리해 드립니다. 영상은 이 상세페이지를
                토대로 만들어져요.
              </p>
              <Button style={{ marginTop: 14 }} onClick={() => navigate(`/products/${id}/detail`)}>
                ✨ AI 상세페이지 만들기
              </Button>
            </>
          ) : (
            <>
              <p className="muted" style={{ fontSize: 14 }}>
                {dp.headline} · 최근 수정 {formatDate(dp.updatedAt)}
              </p>
              <div className="row" style={{ gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                <Button variant="outline" onClick={() => navigate(`/products/${id}/detail`)}>
                  {dp.status === 'published' ? '보기 · 수정' : '이어서 확정하기'}
                </Button>
                {dp.status === 'published' && (
                  <Button onClick={() => navigate('/content/request', { state: { productId: id } })}>
                    이 상세페이지로 숏폼 영상 만들기 →
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* 2단계: 콘텐츠 */}
        <div className="card card-pad">
          <div className="spread" style={{ marginBottom: 8 }}>
            <b style={{ fontSize: 16 }}>2. AI 숏폼 영상 ({contents.length})</b>
            {dp?.status === 'published' && (
              <Link to="/content/request" state={{ productId: id }} className="btn btn-ghost btn-sm">
                + 영상 만들기
              </Link>
            )}
          </div>
          {!dp || dp.status !== 'published' ? (
            <Notice tone="info">상세페이지를 먼저 확정하면 그 내용을 토대로 영상을 만들 수 있어요.</Notice>
          ) : contents.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>아직 만든 영상이 없어요.</p>
          ) : (
            <div className="stack" style={{ gap: 8 }}>
              {contents.map((c) => (
                <Link
                  key={c.id}
                  to={`/contents/${c.id}`}
                  className="spread"
                  style={{ padding: '10px 0', borderBottom: '1px solid var(--line)', textDecoration: 'none' }}
                >
                  <span style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
