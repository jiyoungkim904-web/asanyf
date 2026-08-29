import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Content, ContentRequest, Entitlement, FarmProduct } from '../lib/types'
import { ContentCard } from '../components/ContentCard'
import { Empty, Loading } from '../components/ui'
import { won } from '../lib/billing'

export default function Dashboard() {
  const { farm } = useAuth()
  const [products, setProducts] = useState<FarmProduct[]>([])
  const [requests, setRequests] = useState<ContentRequest[]>([])
  const [contents, setContents] = useState<Content[]>([])
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!farm) return
    let alive = true
    const load = async () => {
      const [p, r, c, e] = await Promise.all([
        api.listProducts(farm.id),
        api.listRequests(farm.id),
        api.listContents(farm.id),
        api.getEntitlement(farm.id),
      ])
      if (!alive) return
      setProducts(p)
      setRequests(r)
      setContents(c)
      setEntitlement(e)
      setLoading(false)
    }
    load()
    const t = setInterval(load, 3000) // 자동 진행 상태 반영
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [farm])

  if (!farm) return null

  const producing = contents.filter((c) => ['analyzing', 'scripting', 'producing'].includes(c.status)).length
  const requested = contents.filter((c) => c.status === 'requested').length
    + requests.filter((r) => r.status === 'requested' && !contents.some((c) => c.requestId === r.id)).length
  const inReview = contents.filter((c) => c.status === 'review').length
  const doneCount = contents.filter((c) => c.status === 'published').length
  const productMap = new Map(products.map((p) => [p.id, p]))

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 28 }}>
        <div>
          <div className="dash-hello">
            안녕하세요, <span className="farm">{farm.farmName}</span> 사장님 👋
          </div>
          <p className="muted" style={{ marginTop: 4 }}>
            오늘도 우리 농산물 이야기를 콘텐츠로 만들어보세요.
          </p>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <>
            {/* 상태 카드 */}
            <div className="stat-grid">
              <div className="stat">
                <div className="label">🌱 등록된 농산물</div>
                <div className="value">
                  {products.length}
                  <span className="unit">개</span>
                </div>
              </div>
              <div className="stat">
                <div className="label">📨 콘텐츠 제작 요청</div>
                <div className="value">
                  {requested + inReview}
                  <span className="unit">건</span>
                </div>
              </div>
              <div className="stat">
                <div className="label">⏳ 제작 중</div>
                <div className="value">
                  {producing}
                  <span className="unit">건</span>
                </div>
              </div>
              <div className="stat accent">
                <div className="label">✅ 완성된 콘텐츠</div>
                <div className="value">
                  {doneCount}
                  <span className="unit">개</span>
                </div>
              </div>
            </div>

            {inReview > 0 && (
              <div className="notice notice-warn">
                <span className="ico">🔎</span>
                <div>
                  <b>{inReview}건</b>의 콘텐츠가 운영자 검수를 기다리고 있어요. 검수가 끝나면 알려드릴게요.
                </div>
              </div>
            )}

            {/* 이용권 상태 */}
            {entitlement && (
              <Link
                to="/billing"
                className="card card-pad card-hover"
                style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}
              >
                <span style={{ fontSize: 22 }}>
                  {entitlement.kind === 'subscription' ? '🗓️' : '💳'}
                </span>
                <div style={{ flex: 1 }}>
                  <b style={{ color: 'var(--ink)' }}>
                    {entitlement.kind === 'subscription'
                      ? `${entitlement.plan.name} 콘텐츠 구독 중`
                      : '콘텐츠 구독 없음'}
                  </b>
                  <div className="muted" style={{ fontSize: 14 }}>
                    {entitlement.kind === 'subscription'
                      ? `이번 달 콘텐츠 제작 잔여 ${entitlement.remaining}건`
                      : `콘텐츠 제작은 건별 ${won(entitlement.price)}(예시). 구독하면 더 저렴해요`}
                  </div>
                </div>
                <span className="muted">관리 →</span>
              </Link>
            )}

            {/* 주요 CTA */}
            <div className="cta-cards">
              <Link to="/products/new" className="cta-card amber">
                <span className="ci">➕</span>
                <div>
                  <div className="ct">새로운 농산물 등록</div>
                  <div className="cd">품목·재배정보·농가 이야기·사진을 입력해요</div>
                </div>
              </Link>
              <Link to="/content/request" className="cta-card green">
                <span className="ci">✨</span>
                <div>
                  <div className="ct">AI 콘텐츠 제작 요청</div>
                  <div className="cd">등록한 농산물로 SNS 영상을 만들어요</div>
                </div>
              </Link>
            </div>

            {/* 최근 콘텐츠 */}
            <div>
              <div className="spread" style={{ marginBottom: 16 }}>
                <h2 className="section-title">최근 콘텐츠</h2>
                <Link to="/contents" className="btn btn-ghost btn-sm">
                  전체 보기 →
                </Link>
              </div>

              {contents.length === 0 ? (
                <Empty
                  emoji="🎬"
                  title="아직 만들어진 콘텐츠가 없어요"
                  desc="농산물을 등록하고 AI 콘텐츠 제작을 요청해보세요."
                  action={
                    <Link to="/content/request" className="btn btn-primary">
                      AI 콘텐츠 제작 요청하기
                    </Link>
                  }
                />
              ) : (
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
                  {contents.slice(0, 4).map((c) => (
                    <ContentCard key={c.id} content={c} product={productMap.get(c.productId)} />
                  ))}
                </div>
              )}
            </div>

            {/* 내 농산물 요약 */}
            {products.length > 0 && (
              <div>
                <h2 className="section-title" style={{ marginBottom: 16 }}>
                  내 농산물
                </h2>
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                  {products.map((p) => (
                    <Link to={`/products/${p.id}`} className="card card-pad card-hover" key={p.id} style={{ display: 'block', textDecoration: 'none' }}>
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <b style={{ fontSize: 16, color: 'var(--ink)' }}>{p.name}</b>
                        <span className="badge badge-neutral">{p.variety || '품종 미입력'}</span>
                      </div>
                      <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>
                        {p.region} · {p.harvestSeason} 수확
                      </p>
                      <span className="btn btn-outline btn-sm" style={{ marginTop: 12 }}>
                        관리 · 상세페이지 · 콘텐츠 →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
