import { useEffect, useState } from 'react'
import { videoObjectUrl } from '../lib/videoStore'

/** IndexedDB(videoStore)에 보관된 영상을 assetId 로 불러와 재생·다운로드. */
export function DetailVideoPlayer({
  assetId,
  label,
  onRemove,
}: {
  assetId: string
  label?: string
  onRemove?: () => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    let active = true
    let made: string | null = null
    videoObjectUrl(assetId)
      .then((u) => {
        if (!active) {
          if (u) URL.revokeObjectURL(u)
          return
        }
        if (u) {
          made = u
          setUrl(u)
        } else {
          setMissing(true)
        }
      })
      .catch(() => active && setMissing(true))
    return () => {
      active = false
      if (made) URL.revokeObjectURL(made)
    }
  }, [assetId])

  if (missing)
    return (
      <div className="notice notice-warn" style={{ fontSize: 13 }}>
        <span className="ico">⚠️</span>
        <div>
          이 영상 파일은 이 브라우저에 없습니다(다른 기기에서 첨부했거나 저장소가 비워짐).
          {onRemove && (
            <>
              {' '}
              <button className="linklike" onClick={onRemove}>
                첨부 제거
              </button>
            </>
          )}
        </div>
      </div>
    )

  if (!url) return <div className="muted" style={{ fontSize: 13 }}>영상 불러오는 중…</div>

  return (
    <div className="stack" style={{ gap: 8 }}>
      <video
        src={url}
        controls
        playsInline
        style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 460 }}
      />
      <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
        <a className="btn btn-outline btn-sm" href={url} download={`${(label || 'youngfarm-video').replace(/\s+/g, '_')}.mp4`}>
          ⬇ 다운로드
        </a>
        {onRemove && (
          <button className="btn btn-ghost btn-sm" onClick={onRemove}>
            첨부 제거
          </button>
        )}
      </div>
    </div>
  )
}
