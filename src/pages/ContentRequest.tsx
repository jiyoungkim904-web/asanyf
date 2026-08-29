import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { aiProvider } from '../lib/ai'
import { won } from '../lib/billing'
import type { Content, ContentLength, Entitlement, FarmProduct } from '../lib/types'
import { Button, Empty, Loading, Notice, TempOptionTag, VideoThumb } from '../components/ui'
import { PayModal } from '../components/PayModal'

type Phase = 'form' | 'progress'

const PIPELINE: { key: Content['status']; title: string; desc: string }[] = [
  { key: 'analyzing', title: 'AI가 농산물 데이터를 분석하고 있습니다', desc: '품목·재배방식·수확시기·농가 이야기를 읽는 중' },
  { key: 'scripting', title: '스크립트를 생성하고 있습니다', desc: '장면 구성과 나레이션 문구를 작성하는 중' },
  { key: 'producing', title: '콘텐츠를 제작하고 있습니다', desc: '영상 장면과 자막을 구성하는 중' },
  { key: 'review', title: '운영자 검수를 기다리고 있습니다', desc: '영팜마켓AI 운영자가 확인 후 발행합니다' },
]
const ORDER: Content['status'][] = ['requested', 'analyzing', 'scripting', 'producing', 'review', 'published']

export default function ContentRequest() {
  const { farm } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const preselect = (location.state as { productId?: string; justCreated?: boolean }) || {}

  const [products, setProducts] = useState<FarmProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [productId, setProductId] = useState(preselect.productId ?? '')
  const [length, setLength] = useState<ContentLength>('15s')
  const [phase, setPhase] = useState<Phase>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [content, setContent] = useState<Content | null>(null)
  const [previewScript, setPreviewScript] = useState<Content['script'] | null>(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null)
  const [showPay, setShowPay] = useState(false)
  const [detailOk, setDetailOk] = useState<boolean | null>(null)

  useEffect(() => {
    if (!farm) return
    Promise.all([api.listProducts(farm.id), api.getEntitlement(farm.id)]).then(([p, ent]) => {
      setProducts(p)
      setEntitlement(ent)
      if (!productId && p[0]) setProductId(p[0].id)
      setLoading(false)
    })
  }, [farm])

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId])

  // 선택한 농산물의 상세페이지 확정 여부
  useEffect(() => {
    if (!farm || !productId) return
    setDetailOk(null)
    api.getDetailPage(farm.id, productId).then((d) => setDetailOk(!!d && d.status === 'published'))
  }, [farm, productId])

  // 예시 스크립트 미리보기
  useEffect(() => {
    if (!product) {
      setPreviewScript(null)
      return
    }
    let alive = true
    aiProvider.generateScript({ product, length }).then((r) => {
      if (!alive) return
      setPreviewScript(r.script)
      setPreviewTitle(r.title)
    })
    return () => {
      alive = false
    }
  }, [product, length])

  // 진행 상태 폴링
  useEffect(() => {
    if (phase !== 'progress' || !content || !farm) return
    if (content.status === 'review' || content.status === 'published') return
    const t = setInterval(async () => {
      const fresh = await api.getContent(farm.id, content.id)
      if (fresh) setContent(fresh)
    }, 1500)
    return () => clearInterval(t)
  }, [phase, content, farm])

  async function submit(payForThis = false) {
    if (!farm || !product) return
    if (entitlement?.kind === 'payg' && !payForThis) {
      setShowPay(true)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const { content: c } = await api.requestContent({
        farmId: farm.id,
        productId: product.id,
        length,
        payForThis,
      })
      setContent(c)
      setPhase('progress')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
      setShowPay(false)
    }
  }

  function entitlementBanner() {
    if (!entitlement) return null
    if (entitlement.kind === 'subscription')
      return (
        <Notice tone="info">
          {entitlement.plan.name} 구독 한도에서 <b>1건 차감</b>됩니다. (이번 달 잔여{' '}
          {entitlement.remaining}건)
        </Notice>
      )
    return (
      <Notice tone="warn">
        콘텐츠 구독이 없거나 한도를 모두 사용했어요. 이 콘텐츠는 건별 <b>{won(entitlement.price)}</b>(예시)이
        결제됩니다.{' '}
        <Link to="/pricing">구독하면 더 저렴해요 →</Link>
      </Notice>
    )
  }

  if (!farm) return null

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 860 }}>
        <h1 className="section-title" style={{ fontSize: 22 }}>
          AI 콘텐츠 제작 요청
        </h1>
        <p className="section-sub">등록한 농산물을 선택하면 AI가 SNS 영상 초안을 만들어드려요.</p>

        {preselect.justCreated && phase === 'form' && (
          <div style={{ marginBottom: 20 }}>
            <Notice tone="ok">
              농산물이 등록되었어요! 이어서 바로 콘텐츠 제작을 요청해보세요.
            </Notice>
          </div>
        )}

        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <Empty
            emoji="🌱"
            title="먼저 농산물을 등록해주세요"
            desc="콘텐츠를 만들려면 농산물 정보가 필요해요."
            action={
              <Link to="/products/new" className="btn btn-primary">
                농산물 등록하러 가기
              </Link>
            }
          />
        ) : phase === 'form' ? (
          <div className="detail-grid">
            {/* 왼쪽: 입력 */}
            <div className="card card-pad stack" style={{ gap: 22 }}>
              {error && <Notice tone="danger">{error}</Notice>}
              {entitlementBanner()}

              <div className="field">
                <label>농산물 선택</label>
                <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.variety ? `(${p.variety})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {detailOk === true && (
                <Notice tone="ok">
                  확정된 <b>AI 상세페이지</b>를 토대로 영상이 만들어집니다.
                </Notice>
              )}
              {detailOk === false && (
                <Notice tone="warn">
                  이 농산물은 상세페이지가 아직 없어요. <Link to={`/products/${productId}/detail`}>상세페이지를 먼저 만들면</Link>{' '}
                  영상 결과가 더 좋아집니다. (없이도 제작은 가능)
                </Notice>
              )}

              <div className="field">
                <label>콘텐츠 유형</label>
                <div className="choice-group">
                  <button type="button" className="choice selected">
                    📱 SNS 숏폼 영상
                  </button>
                  <button type="button" className="choice" disabled title="v1에서는 숏폼 영상만 제공합니다">
                    카드뉴스 (준비 중)
                  </button>
                </div>
                <span className="hint">v1은 SNS 숏폼 영상 한 가지로 제공됩니다.</span>
              </div>

              <div className="field">
                <label>
                  콘텐츠 길이 <TempOptionTag />
                </label>
                <div className="choice-group">
                  {(['15s', '30s'] as ContentLength[]).map((l) => (
                    <button
                      type="button"
                      key={l}
                      className={`choice ${length === l ? 'selected' : ''}`}
                      onClick={() => setLength(l)}
                    >
                      {l === '15s' ? '15초' : '30초'}
                    </button>
                  ))}
                </div>
                <span className="hint">
                  영상 길이는 아직 확정되지 않은 항목이에요. 나중에 운영 정책에 맞춰 조정될 수 있습니다.
                </span>
              </div>

              <Button size="lg" block onClick={() => submit()} loading={submitting}>
                {entitlement?.kind === 'payg'
                  ? `결제하고 콘텐츠 제작 요청 (${won(entitlement.price)})`
                  : '콘텐츠 제작 요청하기'}
              </Button>
            </div>

            {/* 오른쪽: 예시 미리보기 */}
            <div className="card card-pad">
              <div className="row" style={{ marginBottom: 12 }}>
                <span className="badge badge-info">AI가 이런 콘텐츠를 만들어드립니다</span>
              </div>
              <div style={{ maxWidth: 180, margin: '0 auto 16px' }}>
                <VideoThumb
                  productName={product?.name ?? '농산물'}
                  caption={previewTitle || product?.name}
                  length={length === '15s' ? '15초' : '30초'}
                  photo={product?.photos[0]}
                  showPlay={false}
                />
              </div>
              {previewScript ? (
                <div className="script-box">
                  <b style={{ fontSize: 14 }}>{previewTitle}</b>
                  <p style={{ fontSize: 14, marginTop: 4, color: 'var(--green-800)' }}>
                    “{previewScript.hook}”
                  </p>
                  <div style={{ marginTop: 8 }}>
                    {previewScript.scenes.map((s, i) => (
                      <div className="script-scene" key={i}>
                        <span className="st">{s.time}</span>
                        <div>
                          <div className="sv">{s.visual}</div>
                          <div className="sn">“{s.narration}”</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Loading label="예시 스크립트를 준비 중..." />
              )}
              <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                * 실제 콘텐츠는 운영자 검수 후 조금 달라질 수 있어요.
              </p>
            </div>
          </div>
        ) : (
          <ProgressView content={content!} onNavigate={navigate} />
        )}
      </div>

      {showPay && entitlement?.kind === 'payg' && (
        <PayModal
          title="콘텐츠 1건 제작"
          amount={entitlement.price}
          note={`${product?.name ?? '농산물'} · SNS 숏폼 ${length === '15s' ? '15초' : '30초'}`}
          confirmLabel="결제하고 제작 요청"
          onConfirm={() => submit(true)}
          onClose={() => setShowPay(false)}
        />
      )}
    </div>
  )
}

function ProgressView({
  content,
  onNavigate,
}: {
  content: Content
  onNavigate: (to: string) => void
}) {
  const currentIndex = ORDER.indexOf(content.status)
  const atReview = content.status === 'review' || content.status === 'published'

  return (
    <div className="card card-pad" style={{ maxWidth: 620, margin: '0 auto' }}>
      <div className="center" style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 40 }}>{atReview ? '🔎' : '🤖'}</div>
        <h2 style={{ fontSize: 21, marginTop: 8 }}>
          {atReview ? '콘텐츠 초안이 만들어졌어요!' : 'AI가 콘텐츠를 만들고 있어요'}
        </h2>
        <p className="muted">{content.title}</p>
      </div>

      <div className="timeline" style={{ marginTop: 12 }}>
        {PIPELINE.map((step) => {
          const stepIndex = ORDER.indexOf(step.key)
          const state =
            stepIndex < currentIndex ? 'done' : stepIndex === currentIndex ? 'current' : 'pending'
          return (
            <div className={`timeline-item ${state}`} key={step.key}>
              <div className="timeline-icon">
                {state === 'done' ? '✓' : state === 'current' ? '●' : stepIndex}
              </div>
              <div>
                <div className="t-title">{step.title}</div>
                <div className="t-desc">{step.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="divider" />

      {atReview ? (
        <div className="stack">
          <Notice tone="ok">
            초안 제작이 끝났어요. 운영자 검수가 완료되면 대시보드에서 알려드리고, 완성된 영상을 다운로드할
            수 있어요.
          </Notice>
          <div className="row" style={{ gap: 10 }}>
            <Button block onClick={() => onNavigate(`/contents/${content.id}`)}>
              콘텐츠 상세 보기
            </Button>
            <Button variant="outline" block onClick={() => onNavigate('/dashboard')}>
              대시보드로
            </Button>
          </div>
        </div>
      ) : (
        <p className="center muted" style={{ fontSize: 14 }}>
          잠시만 기다려주세요. 이 화면을 벗어나도 제작은 계속 진행돼요.
          <br />
          <Link to="/dashboard">대시보드로 이동</Link>
        </p>
      )}
    </div>
  )
}
