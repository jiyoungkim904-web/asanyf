import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { addToCart } from '../../lib/cart'
import type { Content, DetailPage, Farm, FarmProduct, Listing } from '../../lib/types'
import { CULTIVATION_LABEL, LENGTH_LABEL } from '../../lib/types'
import { Art, Button, Loading, Notice, VideoThumb } from '../../components/ui'
import { DetailPageView } from '../../components/DetailPageView'

interface Data {
  listing: Listing
  farm: Farm
  product?: FarmProduct
  content?: Content
  detail?: DetailPage | null
  otherFromFarm: Listing[]
}

export default function ShopProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    api.buyer
      .getListing(id)
      .then((d) => setData(d as Data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page"><div className="container"><Loading /></div></div>
  if (!data)
    return (
      <div className="page">
        <div className="container">
          <Notice tone="danger">
            상품을 찾을 수 없어요. <Link to="/shop">스토어로</Link>
          </Notice>
        </div>
      </div>
    )

  const { listing, farm, product, content, otherFromFarm } = data
  const soldout = listing.status !== 'live' || listing.stock <= 0

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 960 }}>
        <Link to="/shop" className="back-link">
          ← 스토어
        </Link>

        <div className="detail-grid">
          {/* 왼쪽: 이미지 / AI 영상 */}
          <div className="stack" style={{ gap: 16 }}>
            <div className="card" style={{ aspectRatio: '4/3', position: 'relative', overflow: 'hidden' }}>
              <Art name={product?.name ?? listing.title} photos={product?.photos} />
            </div>
            {content && (
              <div className="card card-pad">
                <b style={{ fontSize: 14 }}>이 농가의 AI 소개 영상</b>
                <div style={{ maxWidth: 170, margin: '10px auto 0' }}>
                  <VideoThumb
                    productName={product?.name ?? ''}
                    caption={content.title}
                    length={LENGTH_LABEL[content.length]}
                    showPlay
                  />
                </div>
                <p style={{ fontSize: 13, marginTop: 10, color: 'var(--green-800)' }}>“{content.script.hook}”</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 구매 */}
          <div className="stack" style={{ gap: 16 }}>
            <div>
              <span className="sc-farm">{farm.farmName} · {farm.region}</span>
              <h1 style={{ fontSize: 22, marginTop: 6 }}>{listing.title}</h1>
              <div style={{ fontSize: 26, fontWeight: 800, marginTop: 8 }}>{won(listing.price)}</div>
              <p className="muted" style={{ fontSize: 14 }}>
                {listing.unitLabel}
                {product && ` · ${CULTIVATION_LABEL[product.method]} · ${product.harvestSeason} 수확`}
              </p>
            </div>

            <p style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>{listing.description}</p>

            {!data.detail && product?.story && (
              <div className="card card-pad" style={{ background: 'var(--bg-soft)' }}>
                <b style={{ fontSize: 14 }}>농가 이야기</b>
                <p style={{ fontSize: 14, marginTop: 6, whiteSpace: 'pre-wrap' }}>{product.story}</p>
              </div>
            )}

            {soldout ? (
              <Notice tone="warn">품절되었습니다. 다음 수확을 기다려주세요.</Notice>
            ) : (
              <>
                <div className="row" style={{ gap: 12 }}>
                  <div className="qty">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <span>{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(listing.stock, q + 1))}>+</button>
                  </div>
                  <span className="muted" style={{ fontSize: 13 }}>재고 {listing.stock}</span>
                </div>
                <div className="row" style={{ gap: 10 }}>
                  <Button
                    variant="outline"
                    block
                    onClick={() => {
                      addToCart(listing.id, qty)
                      setAdded(true)
                    }}
                  >
                    장바구니 담기
                  </Button>
                  <Button
                    block
                    onClick={() => {
                      addToCart(listing.id, qty)
                      navigate('/cart')
                    }}
                  >
                    바로 구매
                  </Button>
                </div>
                {added && (
                  <Notice tone="ok">
                    장바구니에 담았어요. <Link to="/cart">장바구니 보기 →</Link>
                  </Notice>
                )}
              </>
            )}

            <div className="card card-pad">
              <b style={{ fontSize: 14 }}>📦 이 농가 정기구독</b>
              <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {farm.farmName}의 제철 농산물을 정기적으로 받아보세요.
              </p>
              <Link to="/shop/subscribe" className="btn btn-outline btn-sm" style={{ marginTop: 8 }}>
                정기구독 알아보기
              </Link>
            </div>
          </div>
        </div>

        {data.detail && (
          <div style={{ marginTop: 32 }}>
            <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>상품 상세</h2>
            <DetailPageView dp={data.detail} photo={product?.photos[0]} productName={product?.name} />
          </div>
        )}

        {otherFromFarm.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
              {farm.farmName}의 다른 상품
            </h2>
            <div className="shop-grid">
              {otherFromFarm.map((l) => (
                <Link key={l.id} to={`/shop/product/${l.id}`} className="shop-card">
                  <div className="sc-thumb"><Art name={l.title} /></div>
                  <div className="sc-body">
                    <span className="sc-title">{l.title}</span>
                    <span className="sc-price">{won(l.price)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
