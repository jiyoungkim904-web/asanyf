import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Content, FarmProduct } from '../lib/types'
import { LENGTH_LABEL, STATUS_LABEL } from '../lib/types'
import { formatDate } from '../lib/format'
import { Button, Loading, Notice, StatusBadge, VideoThumb } from '../components/ui'
import { ScriptScenes } from '../components/ScriptScenes'

function buildPackage(content: Content, product?: FarmProduct) {
  const s = content.script
  return [
    `[영팜마켓AI 콘텐츠 패키지]`,
    ``,
    `콘텐츠 제목: ${content.title}`,
    `농산물: ${product?.name ?? '-'}${product?.variety ? ` (${product.variety})` : ''}`,
    `영상 길이: ${LENGTH_LABEL[content.length]}`,
    `제작일: ${formatDate(content.createdAt)}`,
    `발행일: ${formatDate(content.publishedAt)}`,
    ``,
    `제작 방식: 농가 실제 사진 템플릿 조립 (완전 생성형 아님)`,
    `TTS 내레이션: ${s.voice ? `${s.voice.name} (${s.voice.style})` : '-'}`,
    ``,
    `── 영상 스크립트 ──`,
    `후킹 문구: ${s.hook}`,
    ``,
    ...s.scenes.map(
      (sc) =>
        `[${sc.time}] 화면: ${sc.visual}${
          sc.photoIndex !== undefined ? ` (농가 사진 #${sc.photoIndex + 1} 사용)` : ''
        }\n         나레이션: "${sc.narration}"${sc.caption ? `\n         화면 자막: "${sc.caption}"` : ''}`,
    ),
    ``,
    `── SNS 게시글 문구 ──`,
    s.caption,
    ``,
    s.hashtags.join(' '),
    ``,
    `※ 본 프로토타입에서는 영상 파일 대신 스크립트 패키지를 제공합니다.`,
    `   실제 서비스에서는 완성된 MP4 영상 파일이 제공됩니다.`,
  ].join('\n')
}

export default function ContentDetail() {
  const { id } = useParams()
  const { farm } = useAuth()
  const [params] = useSearchParams()
  const [content, setContent] = useState<Content | null>(null)
  const [product, setProduct] = useState<FarmProduct | undefined>()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const downloadedRef = useRef(false)

  useEffect(() => {
    if (!farm || !id) return
    let alive = true
    const load = async () => {
      const c = await api.getContent(farm.id, id)
      if (!alive) return
      if (!c) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setContent(c)
      const p = await api.getProduct(farm.id, c.productId)
      if (alive) {
        setProduct(p)
        setLoading(false)
      }
    }
    load()
    const t = setInterval(load, 3000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [farm, id])

  const download = useCallback(() => {
    if (!content) return
    const blob = new Blob([buildPackage(content, product)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${content.title.replace(/\s+/g, '_')}_영팜마켓AI.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [content, product])

  useEffect(() => {
    if (content?.status === 'published' && params.get('download') === '1' && !downloadedRef.current) {
      downloadedRef.current = true
      download()
    }
  }, [content, params, download])

  if (!farm) return null

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 980 }}>
        <Link to="/contents" className="back-link">
          ← 콘텐츠 목록
        </Link>

        {loading ? (
          <Loading />
        ) : notFound || !content ? (
          <Notice tone="danger">
            콘텐츠를 찾을 수 없어요. <Link to="/contents">목록으로 돌아가기</Link>
          </Notice>
        ) : (
          <div className="detail-grid">
            {/* 왼쪽: 영상 플레이어 영역 */}
            <div>
              <div className="card" style={{ padding: 18 }}>
                <div style={{ maxWidth: 320, margin: '0 auto' }}>
                  <VideoThumb
                    productName={product?.name ?? '농산물'}
                    caption={content.title}
                    length={LENGTH_LABEL[content.length]}
                    photo={content.posterPhoto ?? product?.photos[0]}
                    showPlay={content.status === 'published'}
                  />
                </div>
                <p className="center muted" style={{ fontSize: 13, marginTop: 12 }}>
                  {content.status === 'published'
                    ? '▶ 재생 (프로토타입에서는 미리보기 이미지로 표시됩니다)'
                    : '검수가 끝나면 완성된 영상을 여기서 볼 수 있어요.'}
                </p>
              </div>

              {content.status === 'published' && (
                <div style={{ marginTop: 16 }}>
                  <Button size="lg" block onClick={download}>
                    ⬇ 영상 다운로드
                  </Button>
                  <p className="muted center" style={{ fontSize: 13, marginTop: 8 }}>
                    다운로드한 콘텐츠는 SNS·판매 페이지에 자유롭게 올리실 수 있어요.
                  </p>
                </div>
              )}
            </div>

            {/* 오른쪽: 콘텐츠 정보 */}
            <div className="stack" style={{ gap: 18 }}>
              <div>
                <StatusBadge status={content.status} />
                <h1 style={{ fontSize: 24, marginTop: 10 }}>{content.title}</h1>
              </div>

              <div className="card review-card" style={{ padding: 18 }}>
                <dl>
                  <dt>농산물</dt>
                  <dd>
                    {product?.name ?? '-'}
                    {product?.variety ? ` · ${product.variety}` : ''}
                  </dd>
                  <dt>콘텐츠 제목</dt>
                  <dd>{content.title}</dd>
                  <dt>영상 길이</dt>
                  <dd>{LENGTH_LABEL[content.length]}</dd>
                  <dt>제작일</dt>
                  <dd>{formatDate(content.createdAt)}</dd>
                  <dt>상태</dt>
                  <dd>{content.status === 'published' ? '검수 완료 · 발행' : STATUS_LABEL[content.status]}</dd>
                </dl>
              </div>

              {content.status === 'rejected' && (
                <Notice tone="warn">
                  운영자가 콘텐츠를 보완 요청했어요.
                  {content.reviewNote && (
                    <>
                      <br />
                      <b>메모:</b> {content.reviewNote}
                    </>
                  )}
                </Notice>
              )}
              {content.status === 'published' && content.reviewNote && (
                <Notice tone="ok">
                  <b>운영자 메모:</b> {content.reviewNote}
                </Notice>
              )}
              {['analyzing', 'scripting', 'producing', 'requested'].includes(content.status) && (
                <Notice tone="info">AI가 콘텐츠를 제작하고 있어요. 잠시만 기다려주세요.</Notice>
              )}
              {content.status === 'review' && (
                <Notice tone="warn">운영자가 콘텐츠를 검수하고 있어요. 완료되면 알려드릴게요.</Notice>
              )}

              {/* AI 생성 스크립트 */}
              <div>
                <h3 style={{ fontSize: 17, marginBottom: 10 }}>AI가 생성한 영상 스크립트</h3>
                <ScriptScenes script={content.script} product={product} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
