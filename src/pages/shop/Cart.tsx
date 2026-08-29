import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { won, SHIPPING_FEE } from '../../lib/billing'
import { useAuth } from '../../lib/auth'
import { clearCart, getCart, removeFromCart, setQty } from '../../lib/cart'
import type { Farm, FarmProduct, Listing } from '../../lib/types'
import { Art, Button, Empty, Loading, Notice } from '../../components/ui'
import { PayModal } from '../../components/PayModal'

interface Row {
  listing: Listing
  farm: Farm
  product?: FarmProduct
}

export default function Cart() {
  const navigate = useNavigate()
  const { buyer } = useAuth()
  const [catalog, setCatalog] = useState<Row[]>([])
  const [cart, setCart] = useState<Record<string, number>>(getCart())
  const [loading, setLoading] = useState(true)
  const [pay, setPay] = useState(false)
  const [ordered, setOrdered] = useState(false)

  const refresh = useCallback(() => setCart(getCart()), [])

  useEffect(() => {
    api.buyer.browse().then((r) => {
      setCatalog(r as Row[])
      setLoading(false)
    })
    window.addEventListener('cart-change', refresh)
    return () => window.removeEventListener('cart-change', refresh)
  }, [refresh])

  if (loading) return <div className="page"><div className="container"><Loading /></div></div>

  const lines = Object.entries(cart)
    .map(([lid, qty]) => {
      const row = catalog.find((c) => c.listing.id === lid)
      return row ? { ...row, qty } : null
    })
    .filter(Boolean) as (Row & { qty: number })[]

  const goods = lines.reduce((s, l) => s + l.qty * l.listing.price, 0)
  const shipping = lines.length ? SHIPPING_FEE : 0
  const total = goods + shipping

  async function checkout() {
    if (!buyer) {
      navigate('/shop/login', { state: { from: '/cart' } })
      return
    }
    await api.buyer.checkout(
      buyer.id,
      lines.map((l) => ({ listingId: l.listing.id, qty: l.qty })),
    )
    clearCart()
    setPay(false)
    setOrdered(true)
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <h1 className="section-title" style={{ fontSize: 22 }}>
          장바구니
        </h1>

        {ordered ? (
          <Notice tone="ok">
            주문이 완료되었어요! 농가가 상품을 준비합니다.{' '}
            <Link to="/shop/mypage">주문 내역 보기 →</Link>
          </Notice>
        ) : lines.length === 0 ? (
          <Empty
            emoji="🛒"
            title="장바구니가 비어 있어요"
            desc="전국 농가의 제철 농산물을 담아보세요."
            action={
              <Link to="/shop" className="btn btn-primary">
                스토어 둘러보기
              </Link>
            }
          />
        ) : (
          <>
            <div className="card card-pad" style={{ marginBottom: 20 }}>
              {lines.map((l) => (
                <div className="cart-row" key={l.listing.id}>
                  <div className="row" style={{ gap: 12 }}>
                    <span style={{ width: 46, height: 46, borderRadius: 10, position: 'relative', overflow: 'hidden', flexShrink: 0, display: 'block' }}>
                      <Art name={l.product?.name ?? l.listing.title} photos={l.product?.photos} />
                    </span>
                    <div>
                      <Link to={`/shop/product/${l.listing.id}`} style={{ fontWeight: 700, color: 'var(--ink)' }}>
                        {l.listing.title}
                      </Link>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {l.farm.farmName} · {won(l.listing.price)}
                      </div>
                    </div>
                  </div>
                  <div className="qty">
                    <button onClick={() => setQty(l.listing.id, l.qty - 1)}>−</button>
                    <span>{l.qty}</span>
                    <button onClick={() => setQty(l.listing.id, l.qty + 1)}>+</button>
                  </div>
                  <b>{won(l.qty * l.listing.price)}</b>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFromCart(l.listing.id)}>
                    삭제
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="line">
                <span>상품 합계</span>
                <span>{won(goods)}</span>
              </div>
              <div className="line">
                <span>배송비</span>
                <span>{won(shipping)}</span>
              </div>
              <div className="line total">
                <span>결제 예정 금액</span>
                <span>{won(total)}</span>
              </div>
              <Button size="lg" block style={{ marginTop: 14 }} onClick={() => (buyer ? setPay(true) : checkout())}>
                {buyer ? '결제하기' : '로그인하고 결제'}
              </Button>
              {!buyer && (
                <p className="muted center" style={{ fontSize: 13, marginTop: 8 }}>
                  구매자 회원만 결제할 수 있어요. <Link to="/shop/signup">회원가입</Link>
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {pay && (
        <PayModal
          title="주문 결제"
          amount={total}
          note={`${lines.length}개 상품 + 배송비`}
          onConfirm={checkout}
          onClose={() => setPay(false)}
        />
      )}
    </div>
  )
}
