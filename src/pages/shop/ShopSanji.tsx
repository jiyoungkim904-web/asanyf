import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { formatDate } from '../../lib/format'
import { Loading } from '../../components/ui'
import type { Farm, FarmProduct, Listing, SanjiEpisode } from '../../lib/types'

interface Row {
  ep: SanjiEpisode
  farm: Farm
  product?: FarmProduct
  listing?: Listing
}

export default function ShopSanji() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.buyer.sanji().then((r) => {
      setRows(r as Row[])
      setLoading(false)
    })
  }, [])

  return (
    <div className="page">
      <div className="container">
        <div
          className="card card-pad"
          style={{ background: 'linear-gradient(150deg,#12291a,#234a2d)', color: '#fff', border: 'none', marginTop: 12 }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--amber-500)' }}>
            영팜마켓 오리지널
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, marginTop: 6 }}>📍 산지왔서영</h1>
          <p style={{ fontSize: 13.5, opacity: 0.85, marginTop: 4 }}>
            서영이 전국 농가를 직접 찾아가 함께 수확하고, 진짜 이야기를 담는 산지 방문 시리즈.
          </p>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div style={{ marginTop: 18 }}>
            {rows.map(({ ep, farm, listing }) => (
              <div key={ep.id}>
                <Link to={listing ? `/shop/product/${listing.id}` : '/shop'} className="ep-card">
                  <div className="ep-thumb">
                    <span className="ep-badge">EP.{ep.epNo}</span>
                    <span className="ep-play" />
                    <span className="ep-cap">{ep.title}</span>
                  </div>
                  <div className="ep-body">
                    <div className="ep-meta">
                      {farm.farmName} · {ep.host} · 조회 {(ep.views / 10000).toFixed(1)}만 · {formatDate(ep.publishedAt)}
                    </div>
                    <div className="ep-sum">{ep.summary}</div>
                    {listing && (
                      <div
                        className="p-buy"
                        style={{ marginTop: 12 }}
                      >
                        <span className="pb-t">이 편에 나온 {listing.title}</span>
                        <span className="pb-p">{won(listing.price)} →</span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
