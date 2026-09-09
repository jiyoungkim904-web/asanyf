import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { Content, Farm, FarmProduct } from '../../lib/types'
import { CULTIVATION_LABEL, LENGTH_LABEL, STATUS_LABEL } from '../../lib/types'
import { Button, Loading, Notice, StatusBadge, VideoThumb } from '../../components/ui'
import { ScriptScenes } from '../../components/ScriptScenes'

interface ReviewData {
  content: Content
  farm: Farm
  product: FarmProduct
}

export default function AdminContentReview() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null)
  const [done, setDone] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    if (!id) return
    api.admin
      .getContentForReview(id)
      .then((d) => {
        setData(d as ReviewData)
        setNote((d as ReviewData).content.reviewNote ?? '')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function approve() {
    if (!data) return
    setBusy('approve')
    await api.admin.approve(data.content.id, note)
    setBusy(null)
    setDone('approve')
    refresh()
  }
  async function reject() {
    if (!data) return
    if (!note.trim()) {
      alert('반려 사유(수정 메모)를 입력해주세요.')
      return
    }
    setBusy('reject')
    await api.admin.reject(data.content.id, note)
    setBusy(null)
    setDone('reject')
    refresh()
  }
  async function refresh() {
    if (!id) return
    const d = await api.admin.getContentForReview(id)
    setData(d as ReviewData)
  }

  if (loading) return <div className="page"><div className="container"><Loading /></div></div>
  if (!data)
    return (
      <div className="page">
        <div className="container">
          <Notice tone="danger">콘텐츠를 찾을 수 없습니다.</Notice>
        </div>
      </div>
    )

  const { content, farm, product } = data
  const editable = content.status === 'review'

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1000 }}>
        <Link to="/admin/contents" className="back-link">
          ← 콘텐츠 요청 목록
        </Link>

        <div className="spread" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24 }}>콘텐츠 검수</h1>
            <p className="muted">
              <Link to={`/admin/farms/${farm.id}`}>{farm.farmName}</Link> · {content.title}
            </p>
          </div>
          <StatusBadge status={content.status} />
        </div>

        {done === 'approve' && (
          <div style={{ marginBottom: 18 }}>
            <Notice tone="ok">
              승인 완료! 농가 대시보드에 <b>“콘텐츠가 완성되었습니다.”</b>로 표시되고, 농가가 영상을
              다운로드할 수 있습니다.
            </Notice>
          </div>
        )}
        {done === 'reject' && (
          <div style={{ marginBottom: 18 }}>
            <Notice tone="warn">반려 처리되었습니다. 농가에게 보완 요청 메모가 전달됩니다.</Notice>
          </div>
        )}

        <div className="detail-grid">
          {/* 왼쪽: 미리보기 + 스크립트 */}
          <div className="stack" style={{ gap: 18 }}>
            <div className="card" style={{ padding: 18 }}>
              <b style={{ fontSize: 14 }}>미리보기</b>
              <div style={{ maxWidth: 280, margin: '12px auto 0' }}>
                <VideoThumb
                  productName={product.name}
                  caption={content.title}
                  length={LENGTH_LABEL[content.length]}
                  photo={content.posterPhoto ?? product.photos[0]}
                  showPlay
                />
              </div>
              <p className="center muted" style={{ fontSize: 13, marginTop: 10 }}>
                프로토타입: 실제 서비스에서는 AI가 생성한 영상 파일이 재생됩니다.
              </p>
            </div>

            <div className="card card-pad">
              <b style={{ fontSize: 15 }}>스크립트 확인</b>
              <div style={{ marginTop: 8 }}>
                <ScriptScenes script={content.script} product={product} />
              </div>
            </div>
          </div>

          {/* 오른쪽: 농산물 정보 + 검수 액션 */}
          <div className="stack" style={{ gap: 18 }}>
            <div className="card card-pad">
              <b style={{ fontSize: 15 }}>농산물 정보 확인</b>
              <div className="review-card" style={{ marginTop: 10 }}>
                <dl>
                  <dt>농산물명</dt>
                  <dd>{product.name}</dd>
                  <dt>품종</dt>
                  <dd>{product.variety || '-'}</dd>
                  <dt>생산 지역</dt>
                  <dd>{product.region}</dd>
                  <dt>재배방식</dt>
                  <dd>{CULTIVATION_LABEL[product.method]}</dd>
                  <dt>수확시기</dt>
                  <dd>{product.harvestSeason}</dd>
                  <dt>제작일</dt>
                  <dd>{formatDate(content.createdAt)}</dd>
                </dl>
              </div>
              <div className="divider" />
              <b style={{ fontSize: 14 }}>농가 이야기</b>
              <p style={{ fontSize: 14, whiteSpace: 'pre-wrap', marginTop: 4 }}>{product.story}</p>
              {product.photos.length > 0 && (
                <div className="photo-grid" style={{ marginTop: 12 }}>
                  {product.photos.map((p, i) => (
                    <div className="ph" key={i}>
                      <img src={p} alt="" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card card-pad">
              <b style={{ fontSize: 15 }}>수정 메모</b>
              <p className="muted" style={{ fontSize: 13, margin: '4px 0 8px' }}>
                승인 시 농가에게 참고 메모로, 반려 시 보완 요청 사유로 전달됩니다.
              </p>
              <textarea
                className="textarea"
                placeholder="예: 2번 장면 나레이션을 더 짧게, 마지막에 주문 방법 자막 추가 요청"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!editable}
              />

              {editable ? (
                <div className="row" style={{ gap: 10, marginTop: 14 }}>
                  <Button
                    variant="primary"
                    block
                    loading={busy === 'approve'}
                    onClick={approve}
                  >
                    ✅ 승인 · 농가에 발행
                  </Button>
                  <Button
                    variant="outline"
                    block
                    loading={busy === 'reject'}
                    onClick={reject}
                  >
                    ↩ 반려
                  </Button>
                </div>
              ) : (
                <Notice tone={content.status === 'published' ? 'ok' : 'warn'}>
                  이미 <b>{STATUS_LABEL[content.status]}</b> 처리된 콘텐츠입니다.
                  {content.reviewNote && (
                    <>
                      <br />
                      메모: {content.reviewNote}
                    </>
                  )}
                </Notice>
              )}
              <button
                className="btn btn-ghost btn-sm"
                style={{ marginTop: 10 }}
                onClick={() => navigate('/admin/contents')}
              >
                목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
