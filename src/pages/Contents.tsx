import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { Content, ContentStatus, FarmProduct } from '../lib/types'
import { ContentCard } from '../components/ContentCard'
import { Empty, Loading } from '../components/ui'

const FILTERS: { key: 'all' | ContentStatus; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'requested', label: '제작 요청' },
  { key: 'producing', label: '제작 중' },
  { key: 'review', label: '검수 중' },
  { key: 'published', label: '발행 완료' },
]

const PRODUCING = ['analyzing', 'scripting', 'producing']

export default function Contents() {
  const { farm } = useAuth()
  const [contents, setContents] = useState<Content[]>([])
  const [products, setProducts] = useState<FarmProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | ContentStatus>('all')

  useEffect(() => {
    if (!farm) return
    let alive = true
    const load = async () => {
      const [c, p] = await Promise.all([api.listContents(farm.id), api.listProducts(farm.id)])
      if (!alive) return
      setContents(c)
      setProducts(p)
      setLoading(false)
    }
    load()
    const t = setInterval(load, 3000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [farm])

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const filtered = contents.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'producing') return PRODUCING.includes(c.status)
    return c.status === filter
  })

  if (!farm) return null

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 20 }}>
        <div className="spread">
          <div>
            <h1 className="section-title" style={{ fontSize: 22 }}>
              콘텐츠
            </h1>
            <p className="muted">지금까지 만들어진 우리 농가의 콘텐츠예요.</p>
          </div>
          <Link to="/content/request" className="btn btn-primary">
            + AI 콘텐츠 제작 요청
          </Link>
        </div>

        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              className={filter === f.key ? 'on' : ''}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <Empty
            emoji="🎬"
            title={filter === 'all' ? '아직 콘텐츠가 없어요' : '해당하는 콘텐츠가 없어요'}
            desc="농산물을 등록하고 AI 콘텐츠 제작을 요청해보세요."
            action={
              <Link to="/content/request" className="btn btn-primary">
                콘텐츠 제작 요청하기
              </Link>
            }
          />
        ) : (
          <div
            className="grid"
            style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}
          >
            {filtered.map((c) => (
              <ContentCard key={c.id} content={c} product={productMap.get(c.productId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
