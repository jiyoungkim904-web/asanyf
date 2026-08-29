// 장바구니 — localStorage (프로토타입: 브라우저 1개 기준)
const KEY = 'youngfarm.cart'

export type Cart = Record<string, number> // listingId -> qty

export function getCart(): Cart {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function save(c: Cart) {
  localStorage.setItem(KEY, JSON.stringify(c))
  window.dispatchEvent(new Event('cart-change'))
}

export function addToCart(listingId: string, qty = 1) {
  const c = getCart()
  c[listingId] = (c[listingId] || 0) + qty
  save(c)
}

export function setQty(listingId: string, qty: number) {
  const c = getCart()
  if (qty <= 0) delete c[listingId]
  else c[listingId] = qty
  save(c)
}

export function removeFromCart(listingId: string) {
  const c = getCart()
  delete c[listingId]
  save(c)
}

export function clearCart() {
  save({})
}

export function cartCount(): number {
  return Object.values(getCart()).reduce((a, b) => a + b, 0)
}
