import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { DetailPage, FarmProduct } from '../lib/types'
import { Button, Loading, Notice } from '../components/ui'
import { DetailPageView } from '../components/DetailPageView'

type Editable = Pick<DetailPage, 'badge' | 'headline' | 'subheadline' | 'story' | 'howto' | 'closing'>

export default function DetailPageEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { farm } = useAuth()
  const [product, setProduct] = useState<FarmProduct | undefined>()
  const [dp, setDp] = useState<DetailPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Editable | null>(null)

  useEffect(() => {
    if (!farm || !id) return
    Promise.all([api.getProduct(farm.id, id), api.getDetailPage(farm.id, id)]).then(([p, d]) => {
      setProduct(p)
      setDp(d)
      setLoading(false)
    })
  }, [farm, id])

  async function generate() {
    if (!farm || !id) return
    setGenerating(true)
    const d = await api.generateDetailPage(farm.id, id)
    setDp(d)
    setEditing(false)
    setGenerating(false)
  }

  function startEdit() {
    if (!dp) return
    setDraft({
      badge: dp.badge, headline: dp.headline, subheadline: dp.subheadline,
      story: dp.story, howto: dp.howto, closing: dp.closing,
    })
    setEditing(true)
  }

  async function save() {
    if (!farm || !dp || !draft) return
    setSaving(true)
    await api.updateDetailPage(farm.id, dp.id, draft)
    setDp({ ...dp, ...draft })
    setEditing(false)
    setSaving(false)
  }

  async function publish() {
    if (!farm || !dp || !id) return
    setSaving(true)
    await api.publishDetailPage(farm.id, dp.id)
    navigate(`/products/${id}`)
  }

  if (!farm) return null
  if (loading) return <div className="page"><div className="container"><Loading /></div></div>

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 20, maxWidth: 640 }}>
        <Link to={`/products/${id}`} className="back-link">← {product?.name}</Link>

        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>AI 상세페이지</h1>
          <p className="section-sub">
            농산물 정보를 AI가 판매용 상세페이지로 정리해요. 확인·수정 후 확정하면, 이 내용을 토대로
            숏폼 영상이 만들어집니다.
          </p>
        </div>

        {!dp ? (
          <div className="card card-pad center" style={{ padding: 36 }}>
            <div style={{ fontSize: 34 }}>{generating ? '⏳' : '📄'}</div>
            <p style={{ fontWeight: 700, marginTop: 8 }}>
              {generating ? 'AI가 상세페이지를 정리하고 있어요…' : '상세페이지를 아직 만들지 않았어요'}
            </p>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
              등록하신 품목·재배정보·농가 이야기를 바탕으로 생성합니다.
            </p>
            <Button size="lg" style={{ marginTop: 16 }} loading={generating} onClick={generate}>
              ✨ AI 상세페이지 생성
            </Button>
          </div>
        ) : editing && draft ? (
          <div className="card card-pad">
            <b style={{ fontSize: 15 }}>내용 수정</b>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 16px' }}>
              특징·상품정보·FAQ는 "다시 생성"으로 새로 만들 수 있어요.
            </p>
            {(
              [
                ['badge', '배지', 1],
                ['headline', '큰 제목', 2],
                ['subheadline', '보조 문구', 2],
                ['story', '농가 이야기', 5],
                ['howto', '보관·섭취 방법', 3],
                ['closing', '마무리 문구', 1],
              ] as [keyof Editable, string, number][]
            ).map(([k, label, rows]) => (
              <div className="dp-edit-field" key={k}>
                <label>{label}</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: rows > 1 ? rows * 24 + 20 : 46 }}
                  rows={rows}
                  value={draft[k]}
                  onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                />
              </div>
            ))}
            <div className="row" style={{ gap: 10, marginTop: 6 }}>
              <Button variant="ghost" block onClick={() => setEditing(false)}>취소</Button>
              <Button block loading={saving} onClick={save}>저장</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Button variant="outline" size="sm" onClick={startEdit}>✏️ 내용 수정</Button>
              <Button
                variant="outline"
                size="sm"
                loading={generating}
                onClick={() => {
                  if (confirm('AI로 처음부터 다시 생성할까요? 수정한 내용은 사라집니다.')) generate()
                }}
              >
                🔄 다시 생성
              </Button>
            </div>

            {dp.status === 'published' ? (
              <Notice tone="ok">
                확정된 상세페이지예요. 스토어 상품 상세와 영상 제작에 사용됩니다.
              </Notice>
            ) : (
              <Notice tone="info">아직 초안이에요. 확인 후 아래에서 확정해주세요.</Notice>
            )}

            <DetailPageView dp={dp} photo={product?.photos[0]} productName={product?.name} />

            {dp.status !== 'published' ? (
              <Button size="lg" block loading={saving} onClick={publish}>
                이 상세페이지로 확정하기
              </Button>
            ) : (
              <Button
                size="lg"
                block
                onClick={() => navigate('/content/request', { state: { productId: id } })}
              >
                이 상세페이지로 숏폼 영상 만들기 →
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
