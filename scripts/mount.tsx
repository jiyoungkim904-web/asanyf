/* 클라이언트 마운트 테스트 — 모든 라우트를 useEffect/데이터로딩까지 실제 실행하고 에러 수집 */
import { JSDOM } from 'jsdom'
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
})
const g = globalThis as any
g.window = dom.window
g.document = dom.window.document
g.localStorage = dom.window.localStorage
g.HTMLElement = dom.window.HTMLElement
// 실제 브라우저(Edge 등)에서 window.scrollTo 가 값을 반환하는 경우 재현 —
// concise-body useEffect 회귀를 잡기 위함
dom.window.scrollTo = (() => 0) as any
g.IS_REACT_ACT_ENVIRONMENT = true

const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const { MemoryRouter } = await import('react-router-dom')
const { AuthProvider } = await import('../src/lib/auth')
const { seedIfEmpty, read } = await import('../src/lib/db')
const App = (await import('../src/App')).default

seedIfEmpty()
const db = read()
localStorage.setItem('youngfarm.session', JSON.stringify({
  farm: db.farms[0],
  admin: { email: 'admin@youngfarm.ai', name: '운영자' },
  buyer: db.buyers[0],
}))
const publishedContent = db.contents.find((c) => c.status === 'published' && c.farmId === db.farms[0].id)!
const reviewContent = db.contents.find((c) => c.status !== 'published') ?? db.contents[0]
const listing = db.listings[0]
const groupBuy = db.groupBuys[0]
const demoProductId = db.products.find((p) => p.farmId === db.farms[0].id)!.id

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const errors: string[] = []
const origErr = console.error
console.error = (...a: any[]) => {
  const s = a.join(' ')
  if (s.includes('useLayoutEffect')) return
  if (s.includes('not wrapped in act')) return
  errors.push(s.slice(0, 400))
}

async function checkRoute(path: string, expect: string) {
  const el = dom.window.document.createElement('div')
  const root = createRoot(el)
  try {
    root.render(
      React.createElement(MemoryRouter, { initialEntries: [path] },
        React.createElement(AuthProvider, null, React.createElement(App))),
    )
  } catch (e) {
    console.log(`✗ ${path}  렌더 예외: ${(e as Error).message}`)
    return false
  }
  await sleep(700)
  const txt = (el.textContent || '').replace(/\s+/g, ' ')
  const ok = txt.includes(expect)
  console.log(`${ok ? '✓' : '✗'} ${path.padEnd(28)} "${expect}"${ok ? '' : `  ← GOT: ${txt.slice(0, 160)}`}`)
  root.unmount()
  return ok
}

const routes: [string, string][] = [
  ['/', '생성형 AI 커머스 플랫폼'],
  ['/login', '로그인'],
  ['/signup', '농가 회원가입'],
  ['/pricing', '요금 안내'],
  ['/studio/video', 'AI 영상 생성 스튜디오'],
  ['/dashboard', '사장님'],
  ['/products/new', 'STEP 1'],
  [`/products/${demoProductId}`, 'AI 상세페이지'],
  [`/products/${demoProductId}/detail`, 'AI 상세페이지'],
  ['/content/request', 'AI 콘텐츠 제작 요청'],
  ['/contents', '콘텐츠'],
  [`/contents/${publishedContent.id}`, publishedContent.title],
  [`/contents/${reviewContent.id}`, reviewContent.title],
  ['/contents/없는아이디', '찾을 수 없'],
  ['/billing', '결제·구독 관리'],
  ['/store', '판매 관리'],
  ['/shop', '추천 농산물'],
  ['/shop/search', '샤인머스캣'],
  ['/shop/sourcing', '농장별 소싱'],
  ['/shop/studio', 'AI 콘텐츠 스튜디오'],
  ['/shop/reels', '농가 숏폼'],
  ['/shop/sanji', '서영왔서영'],
  [`/shop/product/${listing.id}`, listing.title],
  ['/shop/groupbuy', '공동구매'],
  [`/shop/groupbuy/${groupBuy.id}`, groupBuy.title],
  ['/shop/subscribe', '농산물 정기구독'],
  ['/cart', '장바구니'],
  ['/shop/login', '구매자 로그인'],
  ['/shop/signup', '구매자 회원가입'],
  ['/shop/mypage', '주문·구독'],
  ['/admin/login', '운영자 로그인'],
  ['/admin', '운영자 대시보드'],
  [`/admin/farms/${db.farms[0].id}`, db.farms[0].farmName],
  ['/admin/contents', '콘텐츠 제작 요청'],
  [`/admin/contents/${reviewContent.id}`, '콘텐츠 검수'],
  ['/admin/revenue', '매출 현황'],
  ['/admin/commerce', '커머스 현황'],
  ['/admin/account', '내 계정'],
  ['/admin/studio', 'AI 영상 생성 스튜디오'],
  ['/아무거나없는경로', '생성형 AI 커머스 플랫폼'], // → '/' 리다이렉트
]

let pass = 0
let fail = 0
for (const [p, t] of routes) {
  ;(await checkRoute(p, t)) ? pass++ : fail++
}

console.log(`\n${pass}/${routes.length} 라우트 통과`)
console.log(`콘솔 에러: ${errors.length}건`)
errors.slice(0, 12).forEach((e) => console.log('  · ' + e))
process.exit(fail || errors.length ? 1 : 0)
