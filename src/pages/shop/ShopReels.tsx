import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { LENGTH_LABEL } from '../../lib/types'
import { Art, Loading } from '../../components/ui'
import type { Content, Farm, FarmProduct, Listing } from '../../lib/types'

interface Row {
  content: Content
  farm: Farm
  product?: FarmProduct
  listing?: Listing
}

export default function ShopReels() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.buyer.reels().then((r) => {
      setRows(r as Row[])
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="page"><div className="container"><Loading /></div></div>

  return (
    <div className="page">
      <div className="container">
        <h1 className="app-title">농가 숏폼</h1>
        <p className="app-sub">AI가 만든 농가 이야기 영상. 마음에 들면 바로 장보기</p>

        <div className="stack reels-feed" style={{ gap: 18 }}>
          {rows.map(({ content, farm, product, listing }) => (
            <div className="card" style={{ overflow: 'hidden', padding: 0 }} key={content.id}>
              <div
                style={{
                  aspectRatio: '9 / 13',
                  background: 'var(--green-50)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 16,
                  color: '#fff',
                }}
              >
                <Art name={product?.name ?? content.title} />
                <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.6) 100%)' }} />
                <span
                  style={{
                    position: 'absolute', inset: 0, margin: 'auto', width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.9)', display: 'grid', placeItems: 'center',
                  }}
                >
                  <span
                    style={{
                      borderStyle: 'solid', borderWidth: '11px 0 11px 18px',
                      borderColor: 'transparent transparent transparent var(--green-800)', marginLeft: 4,
                    }}
                  />
                </span>
                <span
                  style={{
                    position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.55)',
                    fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  }}
                >
                  {LENGTH_LABEL[content.length]}
                </span>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.9 }}>@{farm.farmName}</div>
                  <div style={{ fontWeight: 800, fontSize: 17, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {content.title}
                  </div>
                  <div style={{ fontSize: 12.5, marginTop: 4, opacity: 0.92 }}>“{content.script.hook}”</div>
                </div>
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                {listing ? (
                  <Link to={`/shop/product/${listing.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                    🛒 {listing.title} · {won(listing.price)}
                  </Link>
                ) : (
                  <span className="muted" style={{ fontSize: 13 }}>이 농가는 준비 중이에요</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
