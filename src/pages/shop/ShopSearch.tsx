import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { Art, Loading } from '../../components/ui'
import type { Farm, FarmProduct, Listing } from '../../lib/types'

interface Row {
  listing: Listing
  farm: Farm
  product?: FarmProduct
}

export default function ShopSearch() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  useEffect(() => {
    api.buyer.browse().then((r) => {
      setRows(r as Row[])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const t = q.trim()
    if (!t) return rows
    return rows.filter(
      (r) =>
        r.listing.title.includes(t) ||
        r.farm.farmName.includes(t) ||
        r.farm.region.includes(t) ||
        (r.product?.name ?? '').includes(t),
    )
  }, [q, rows])

  return (
    <div className="page">
      <div className="container">
        <input
          className="input"
          autoFocus
          placeholder="농산물, 농장, 지역 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginTop: 8 }}
        />
        {!q && (
          <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {['배', '샤인머스캣', '고구마', '아산', '나주'].map((k) => (
              <button key={k} className="choice" onClick={() => setQ(k)} style={{ fontSize: 13, padding: '6px 12px' }}>
                {k}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <Loading />
        ) : (
          <div className="stack" style={{ gap: 10, marginTop: 16 }}>
            {filtered.map(({ listing, farm, product }) => (
              <Link
                key={listing.id}
                to={`/shop/product/${listing.id}`}
                className="card"
                style={{ display: 'flex', gap: 12, padding: 10, textDecoration: 'none', alignItems: 'center' }}
              >
                <div
                  style={{
                    width: 60, height: 60, borderRadius: 12, flexShrink: 0,
                    position: 'relative', overflow: 'hidden', background: 'var(--green-50)',
                  }}
                >
                  <Art name={product?.name ?? listing.title} photos={product?.photos} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="rc-farm">{farm.farmName}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{listing.title}</div>
                  <div style={{ fontWeight: 800 }}>{won(listing.price)}</div>
                </div>
              </Link>
            ))}
            {filtered.length === 0 && (
              <p className="muted center" style={{ padding: 30 }}>
                검색 결과가 없어요.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
