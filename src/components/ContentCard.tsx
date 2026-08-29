import { Link } from 'react-router-dom'
import type { Content, FarmProduct } from '../lib/types'
import { LENGTH_LABEL } from '../lib/types'
import { formatDate } from '../lib/format'
import { StatusBadge, VideoThumb } from './ui'

export function ContentCard({
  content,
  product,
}: {
  content: Content
  product?: FarmProduct
}) {
  const done = content.status === 'published'
  return (
    <div className="card card-hover content-card">
      <div className="thumb-wrap">
        <VideoThumb
          productName={product?.name ?? '농산물'}
          caption={content.title}
          length={LENGTH_LABEL[content.length]}
          photo={content.posterPhoto ?? product?.photos[0]}
          showPlay={done}
        />
      </div>
      <div className="body">
        <span className="c-product">{product?.name ?? '농산물'}</span>
        <span className="c-title">{content.title}</span>
        <span className="c-meta">
          제작일 {formatDate(content.createdAt)}
        </span>
        <div style={{ marginTop: 8 }}>
          <StatusBadge status={content.status} />
        </div>
      </div>
      <div className="actions">
        <Link to={`/contents/${content.id}`} className="btn btn-outline btn-sm" style={{ flex: 1 }}>
          보기
        </Link>
        {done && (
          <Link
            to={`/contents/${content.id}?download=1`}
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
          >
            다운로드
          </Link>
        )}
      </div>
    </div>
  )
}
