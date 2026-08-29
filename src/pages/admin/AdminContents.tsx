import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import type { Content, ContentRequest, Farm, FarmProduct } from '../../lib/types'
import { LENGTH_LABEL } from '../../lib/types'
import { Button, Empty, Loading, StatusBadge } from '../../components/ui'

interface Row {
  content: Content
  farm: Farm
  product: FarmProduct
  request?: ContentRequest
}

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'requested', label: '요청' },
  { key: 'producing', label: '제작 중' },
  { key: 'review', label: '검수 대기' },
  { key: 'done', label: '완료' },
] as const

const PRODUCING = ['analyzing', 'scripting', 'producing']

export default function AdminContents() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')
  const [running, setRunning] = useState<string | null>(null)

  const load = async () => {
    const data = await api.admin.listAllContents()
    setRows(data as Row[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [])

  async function runGeneration(requestId: string) {
    setRunning(requestId)
    await api.admin.runGeneration(requestId)
    await load()
    setRunning(null)
  }

  const filtered = rows.filter((r) => {
    const s = r.content.status
    if (filter === 'all') return true
    if (filter === 'requested') return s === 'requested'
    if (filter === 'producing') return PRODUCING.includes(s)
    if (filter === 'review') return s === 'review'
    if (filter === 'done') return s === 'published' || s === 'rejected'
    return true
  })

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 20 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            콘텐츠 제작 요청
          </h1>
          <p className="muted">농가의 콘텐츠 요청을 확인하고 AI 생성 결과를 검수하세요.</p>
        </div>

        <div className="filter-bar">
          {FILTERS.map((f) => (
            <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <Empty emoji="📭" title="해당하는 요청이 없어요" />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>농가</th>
                  <th>농산물</th>
                  <th>콘텐츠 제목</th>
                  <th>길이</th>
                  <th>요청일시</th>
                  <th>상태</th>
                  <th>처리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ content, farm, product }) => (
                  <tr key={content.id}>
                    <td>
                      <Link to={`/admin/farms/${farm.id}`}>{farm.farmName}</Link>
                    </td>
                    <td>{product?.name ?? '-'}</td>
                    <td>{content.title}</td>
                    <td>{LENGTH_LABEL[content.length]}</td>
                    <td>{formatDateTime(content.createdAt)}</td>
                    <td>
                      <StatusBadge status={content.status} />
                    </td>
                    <td>
                      {content.status === 'requested' || PRODUCING.includes(content.status) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          loading={running === content.requestId}
                          onClick={() => runGeneration(content.requestId)}
                        >
                          AI 생성 실행
                        </Button>
                      ) : (
                        <Link to={`/admin/contents/${content.id}`} className="btn btn-primary btn-sm">
                          {content.status === 'review' ? '검수하기' : '결과 보기'}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
