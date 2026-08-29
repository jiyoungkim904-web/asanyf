/* SSR 스모크 테스트 — 각 페이지가 렌더 단계에서 터지지 않는지 확인 */
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
})
const g = globalThis as any
g.window = dom.window
g.document = dom.window.document
g.localStorage = dom.window.localStorage
g.HTMLElement = dom.window.HTMLElement

const React = (await import('react')).default
const { renderToString } = await import('react-dom/server')
const { MemoryRouter } = await import('react-router-dom')
const { AuthProvider } = await import('../src/lib/auth')
const { seedIfEmpty, read, DEMO_ACCOUNT } = await import('../src/lib/db')

seedIfEmpty()
const db = read()
console.log('seed:', {
  farms: db.farms.length,
  products: db.products.length,
  requests: db.requests.length,
  contents: db.contents.length,
})

// 데모 세션 주입 (농가·운영자·구매자)
localStorage.setItem('youngfarm.session', JSON.stringify({
  farm: db.farms[0],
  admin: { email: 'admin@youngfarm.ai', name: '운영자' },
  buyer: db.buyers[0],
}))

const pages: [string, string][] = [
  ['Landing', '../src/pages/Landing'],
  ['Signup', '../src/pages/Signup'],
  ['Login', '../src/pages/Login'],
  ['Pricing', '../src/pages/Pricing'],
  ['Dashboard', '../src/pages/Dashboard'],
  ['ProductNew', '../src/pages/ProductNew'],
  ['ProductHub', '../src/pages/ProductHub'],
  ['DetailPageEditor', '../src/pages/DetailPageEditor'],
  ['ContentRequest', '../src/pages/ContentRequest'],
  ['Contents', '../src/pages/Contents'],
  ['ContentDetail', '../src/pages/ContentDetail'],
  ['Billing', '../src/pages/Billing'],
  ['Store', '../src/pages/Store'],
  ['Shop', '../src/pages/shop/Shop'],
  ['ShopSearch', '../src/pages/shop/ShopSearch'],
  ['ShopSourcing', '../src/pages/shop/ShopSourcing'],
  ['ShopStudio', '../src/pages/shop/ShopStudio'],
  ['ShopReels', '../src/pages/shop/ShopReels'],
  ['ShopSanji', '../src/pages/shop/ShopSanji'],
  ['ShopProduct', '../src/pages/shop/ShopProduct'],
  ['ShopGroupBuyList', '../src/pages/shop/ShopGroupBuyList'],
  ['ShopGroupBuy', '../src/pages/shop/ShopGroupBuy'],
  ['ShopSubscribe', '../src/pages/shop/ShopSubscribe'],
  ['Cart', '../src/pages/shop/Cart'],
  ['ShopLogin', '../src/pages/shop/ShopLogin'],
  ['ShopSignup', '../src/pages/shop/ShopSignup'],
  ['ShopMyPage', '../src/pages/shop/ShopMyPage'],
  ['AdminLogin', '../src/pages/admin/AdminLogin'],
  ['AdminDashboard', '../src/pages/admin/AdminDashboard'],
  ['AdminFarmDetail', '../src/pages/admin/AdminFarmDetail'],
  ['AdminContents', '../src/pages/admin/AdminContents'],
  ['AdminContentReview', '../src/pages/admin/AdminContentReview'],
  ['AdminRevenue', '../src/pages/admin/AdminRevenue'],
  ['AdminCommerce', '../src/pages/admin/AdminCommerce'],
]

let ok = 0
let fail = 0
for (const [name, path] of pages) {
  try {
    const mod = await import(path)
    const Page = mod.default
    const html = renderToString(
      React.createElement(MemoryRouter, { initialEntries: ['/'] },
        React.createElement(AuthProvider, null,
          React.createElement(Page))),
    )
    if (html.length < 20) throw new Error('빈 출력')
    console.log(`✓ ${name} (${html.length} bytes)`)
    ok++
  } catch (e) {
    console.log(`✗ ${name}: ${(e as Error).message}`)
    fail++
  }
}
console.log(`\n${ok} passed, ${fail} failed`)
console.log('demo account:', DEMO_ACCOUNT)
process.exit(fail ? 1 : 0)
