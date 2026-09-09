// ─────────────────────────────────────────────────────────────
// 목(mock) 데이터 저장소 — localStorage 기반
// 실제 백엔드가 붙으면 api.ts 안의 함수 구현만 fetch 호출로 바꾸면 된다.
// ─────────────────────────────────────────────────────────────

import type {
  Buyer,
  Content,
  ContentRequest,
  DetailPage,
  Farm,
  FarmPost,
  FarmProduct,
  GroupBuy,
  Listing,
  Order,
  ProduceSub,
  SanjiEpisode,
  ShopOrder,
  SourcingRequest,
  Subscription,
} from './types'
import { COMMERCE_FEE_RATE, SHIPPING_FEE, SOURCING_FEE_RATE } from './billing'

const NS = 'youngfarm.v8'

interface DB {
  farms: Farm[]
  products: FarmProduct[]
  detailPages: DetailPage[]
  requests: ContentRequest[]
  contents: Content[]
  subscriptions: Subscription[]
  orders: Order[]
  buyers: Buyer[]
  listings: Listing[]
  shopOrders: ShopOrder[]
  groupBuys: GroupBuy[]
  produceSubs: ProduceSub[]
  farmPosts: FarmPost[]
  sanjiEpisodes: SanjiEpisode[]
  sourcingRequests: SourcingRequest[]
}

function empty(): DB {
  return {
    farms: [], products: [], detailPages: [], requests: [], contents: [], subscriptions: [],
    orders: [], buyers: [], listings: [], shopOrders: [], groupBuys: [], produceSubs: [],
    farmPosts: [], sanjiEpisodes: [], sourcingRequests: [],
  }
}

export function read(): DB {
  try {
    const raw = localStorage.getItem(NS)
    if (!raw) return empty()
    return { ...empty(), ...JSON.parse(raw) }
  } catch {
    return empty()
  }
}

export function write(db: DB) {
  localStorage.setItem(NS, JSON.stringify(db))
}

export function update(fn: (db: DB) => void): DB {
  const db = read()
  fn(db)
  write(db)
  return db
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`
}

export function resetAll() {
  localStorage.removeItem(NS)
  for (const v of ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7']) localStorage.removeItem(`youngfarm.${v}`)
  localStorage.removeItem('youngfarm.session')
  localStorage.removeItem('youngfarm.cart')
  seedIfEmpty()
}

// ── 데모 계정 ───────────────────────────────────────────────

const F_ASAN = 'farm_demo_sunfarm'
const F_NAJU = 'farm_naju'
const F_YC = 'farm_yeongcheon'
const F_HAENAM = 'farm_haenam'

const P_PEAR = 'prod_demo_pear'
const P_RICE = 'prod_demo_rice'
const P_NAJU_PEAR = 'prod_naju_pear'
const P_GRAPE = 'prod_yc_grape'
const P_SWEET = 'prod_haenam_sweet'
const F_DUNPO = 'farm_dunpo'
const F_ASANOI = 'farm_asanoi'
const P_TOMATO = 'prod_dunpo_tomato'
const P_CUKE = 'prod_asan_cuke'

export const DEMO_ACCOUNT = { email: 'sunfarm@example.com', password: 'test1234' }
export const DEMO_BUYER_ACCOUNT = { email: 'buyer@example.com', password: 'test1234' }

const iso = (s: string) => new Date(s).toISOString()

export function seedIfEmpty() {
  if (read().farms.length > 0) return

  const t0 = iso('2026-07-15T09:00:00')

  // ── 농가 ──────────────────────────────────────────────────
  const farms: Farm[] = [
    { id: F_ASAN, farmName: '아산 햇살농원', ownerName: '김영수', phone: '010-2345-6789',
      email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password, region: '충청남도 아산시', createdAt: iso('2026-06-10T09:00:00') },
    { id: F_NAJU, farmName: '나주 예향농원', ownerName: '박정순', phone: '010-3456-1122',
      email: 'naju@example.com', password: 'test1234', region: '전라남도 나주시', createdAt: t0 },
    { id: F_YC, farmName: '영천 볕드는과수원', ownerName: '이경도', phone: '010-7788-2211',
      email: 'yc@example.com', password: 'test1234', region: '경상북도 영천시', createdAt: t0 },
    { id: F_HAENAM, farmName: '해남 남녘밭', ownerName: '정미영', phone: '010-2211-9090',
      email: 'haenam@example.com', password: 'test1234', region: '전라남도 해남군', createdAt: t0 },
    { id: F_DUNPO, farmName: '둔포 토마토 농장', ownerName: '한상철', phone: '010-8811-3300',
      email: 'dunpo@example.com', password: 'test1234', region: '충청남도 아산시 둔포면', createdAt: t0 },
    { id: F_ASANOI, farmName: '아산 오이 농장', ownerName: '조은비', phone: '010-9922-4455',
      email: 'asanoi@example.com', password: 'test1234', region: '충청남도 아산시', createdAt: t0 },
  ]

  // ── 농산물 ────────────────────────────────────────────────
  const products: FarmProduct[] = [
    { id: P_PEAR, farmId: F_ASAN, name: '아산 배', variety: '신고', region: '충청남도 아산시', method: 'eco',
      harvestSeason: '가을 (9~11월)', photos: [], createdAt: t0,
      story: '아산에서 20년째 배 농사를 짓고 있습니다. 아버지가 일구신 밭을 물려받아 지금까지 이어오고 있어요. 농약을 최소화한 친환경 방식으로 재배하고, 한 알 한 알 봉지를 씌워 정성껏 키웁니다.',
      grade: '특·상 (대과)', packUnit: '5kg 박스 (9~11과)', farmingYears: 20,
      certifications: ['무농약', 'GAP(우수관리인증)'], sweetness: '당도 12~14 브릭스',
      harvestPeriod: '9월 중순 ~ 10월 초',
      sellingPoint: '일교차 큰 아산 땅에서 봉지 씌워 키운 단단한 신고배',
      care: '한 알 한 알 봉지 씌우기와 물 관리',
      priceRange: '5kg 45,000원대', shipMethod: '주문 후 1~2일 내 산지 직송',
      storageTip: '냉장 보관, 신문지에 싸서 넣으면 3주까지', giftWrap: true,
      wholesale: { unitLabel: '5kg', price: 18000, minOrderKg: 10, stockKg: 350, harvestDate: iso('2026-09-18') } },
    { id: P_RICE, farmId: F_ASAN, name: '아산 햅쌀', variety: '삼광', region: '충청남도 아산시', method: 'conventional',
      harvestSeason: '가을 (9~11월)', photos: [], createdAt: t0,
      story: '삽교천 물로 지은 아산 햅쌀입니다. 수확 즉시 저온저장하고 주문받는 날 도정해 보내드립니다.',
      packUnit: '10kg', farmingYears: 15, harvestPeriod: '10월 중순',
      sellingPoint: '주문받는 날 도정해 보내는 갓 도정 햅쌀',
      priceRange: '10kg 42,000원', shipMethod: '도정 당일 발송',
      storageTip: '밀폐용기에 담아 서늘한 곳',
      wholesale: { unitLabel: '10kg', price: 34000, minOrderKg: 20, stockKg: 800, harvestDate: iso('2026-10-15') } },
    { id: P_NAJU_PEAR, farmId: F_NAJU, name: '나주 배', variety: '신고', region: '전라남도 나주시', method: 'organic',
      harvestSeason: '가을 (9~11월)', photos: [], createdAt: t0,
      story: '3대째 나주평야에서 배를 키웁니다. 할아버지 때부터 이어온 밭이에요.',
      grade: '유기농 특', packUnit: '5kg', farmingYears: 15,
      certifications: ['유기농 인증'], sweetness: '당도 13 브릭스',
      harvestPeriod: '9월 중순', sellingPoint: '무농약 15년, 유기농 인증 나주 배',
      priceRange: '5kg 48,000원', shipMethod: '산지 직송', giftWrap: true,
      wholesale: { unitLabel: '5kg', price: 21000, minOrderKg: 10, stockKg: 220, harvestDate: iso('2026-09-15') } },
    { id: P_GRAPE, farmId: F_YC, name: '샤인머스캣', variety: '샤인머스캣', region: '경상북도 영천시', method: 'eco',
      harvestSeason: '가을 (9~11월)', photos: [], createdAt: t0,
      story: '일교차 큰 영천에서 샤인머스캣을 키웁니다. 당도계로 재서 기준을 넘는 송이만 출하해요.',
      grade: '2~3송이 2kg', packUnit: '2kg (2~3송이)', farmingYears: 8,
      certifications: ['GAP(우수관리인증)'], sweetness: '당도 18 브릭스 이상',
      harvestPeriod: '9월', sellingPoint: '당도 18브릭스 이상만 선별한 껍질째 먹는 포도',
      priceRange: '2kg 32,000원', shipMethod: '아이스팩 동봉 산지 직송',
      storageTip: '씻지 말고 냉장, 먹기 직전 세척',
      wholesale: { unitLabel: '2kg', price: 16000, minOrderKg: 6, stockKg: 140, harvestDate: iso('2026-09-10') } },
    { id: P_SWEET, farmId: F_HAENAM, name: '해남 꿀고구마', variety: '베니하루카', region: '전라남도 해남군', method: 'conventional',
      harvestSeason: '가을 (9~11월)', photos: [], createdAt: t0,
      story: '해풍 맞고 자란 해남 꿀고구마. 캔 뒤 40일 큐어링을 거쳐야 단맛이 확 올라옵니다.',
      packUnit: '3kg', farmingYears: 12, harvestPeriod: '10월',
      sellingPoint: '40일 큐어링으로 꿀처럼 단 베니하루카',
      care: '수확 후 40일 큐어링', priceRange: '3kg 21,000원', shipMethod: '큐어링 완료분만 발송',
      wholesale: { unitLabel: '10kg', price: 24000, minOrderKg: 20, stockKg: 500, harvestDate: iso('2026-10-20') } },
    { id: P_TOMATO, farmId: F_DUNPO, name: '아산 토마토', variety: '완숙토마토', region: '충청남도 아산시 둔포면', method: 'eco',
      harvestSeason: '연중', photos: [], createdAt: t0,
      story: '둔포에서 스마트팜으로 완숙토마토를 키웁니다. 아침에 딴 것만 그날 출고해요.',
      packUnit: '2kg', harvestPeriod: '연중 (스마트팜)',
      sellingPoint: '아침에 따서 그날 출고하는 완숙토마토',
      priceRange: '2kg 12,000원', shipMethod: '당일 수확·당일 출고',
      wholesale: { unitLabel: '5kg', price: 12500, minOrderKg: 5, stockKg: 280, harvestDate: iso('2026-08-28') } },
    { id: P_CUKE, farmId: F_ASANOI, name: '아산 오이', variety: '백오이', region: '충청남도 아산시', method: 'conventional',
      harvestSeason: '연중', photos: [], createdAt: t0,
      story: '아삭한 백오이를 매일 수확합니다. 식감이 좋아 반찬·피클용으로 인기예요.',
      packUnit: '10개입', harvestPeriod: '연중', sellingPoint: '매일 수확하는 아삭한 백오이',
      priceRange: '10개 8,500원', shipMethod: '수확 당일 발송',
      wholesale: { unitLabel: '10개입', price: 8500, minOrderKg: 20, stockKg: 420, harvestDate: iso('2026-08-29') } },
  ]

  // ── AI 콘텐츠 (아산 햇살농원 중심) ────────────────────────
  const requests: ContentRequest[] = []
  const contents: Content[] = []
  const addContent = (
    farmId: string, productId: string, title: string, status: Content['status'],
    length: Content['length'], date: string, coveredBy: Content['coveredBy'],
    script: Content['script'], auto = false,
  ) => {
    const rid = uid('req')
    requests.push({ id: rid, farmId, productId, type: 'shortform', length, status, createdAt: iso(date) })
    contents.push({
      id: uid('cnt'), requestId: rid, farmId, productId, title, status, length,
      createdAt: iso(date), publishedAt: status === 'published' ? iso(date) : undefined,
      coveredBy, script, auto,
    })
  }
  const script = (product: string, region: string, hook: string): Content['script'] => ({
    hook,
    scenes: [
      { time: '0–3초', visual: `${product} 클로즈업, 자연광`, narration: `${region}에서 키운 ${product}입니다.` },
      { time: '3–9초', visual: '수확·선별 작업 장면', narration: '정성껏 키우고 골라 담았습니다.' },
      { time: '9–15초', visual: '포장 박스 + 주문 안내 자막', narration: '농가에서 바로 보내드립니다.' },
    ],
    caption: `${region} ${product}. 농가 직송.\n주문 문의는 프로필 링크로 📩`,
    hashtags: ['#영팜마켓', `#${region.replace(/\s/g, '')}${product}`, '#농가직송', '#제철농산물'],
  })

  addContent(F_ASAN, P_PEAR, '아산에서 자란 달콤한 배', 'published', '15s', '2026-08-22T10:20:00', 'subscription',
    script('배', '충남 아산', '충남 아산 배, 딱 지금이 제철입니다 🍽️'))
  addContent(F_ASAN, P_PEAR, '아산 배밭의 하루', 'published', '30s', '2026-08-25T14:25:00', 'subscription',
    script('배', '충남 아산', '20초만 투자하세요 — 아산 배 이야기'))
  addContent(F_ASAN, P_RICE, '주문받고 도정하는 아산 햅쌀', 'published', '15s', '2026-08-26T11:20:00', 'payg',
    script('햅쌀', '충남 아산', '갓 도정한 밥맛, 아산 햅쌀 🍚'))
  addContent(F_ASAN, P_PEAR, '아산 배 당도 자랑', 'producing', '15s', '2026-08-28T09:35:00', 'subscription',
    script('배', '충남 아산', '충남 아산 배, 딱 지금이 제철입니다 🍽️'))
  addContent(F_ASAN, P_RICE, '아산 햅쌀 예약 안내', 'requested', '15s', '2026-08-29T08:10:00', 'subscription',
    script('햅쌀', '충남 아산', '갓 도정한 밥맛, 아산 햅쌀 🍚'))
  addContent(F_NAJU, P_NAJU_PEAR, '3대째 이어온 나주 배', 'published', '15s', '2026-08-21T10:00:00', 'subscription',
    script('배', '전남 나주', '3대째 이어온 나주 배 🍐'))
  addContent(F_YC, P_GRAPE, '껍질째 먹는 영천 샤인머스캣', 'published', '15s', '2026-08-23T11:00:00', 'subscription',
    script('샤인머스캣', '경북 영천', '껍질째 먹는 영천 샤인머스캣 🍇'))
  addContent(F_HAENAM, P_SWEET, '해남 꿀고구마 굽는 영상', 'review', '15s', '2026-08-29T07:30:00', 'payg',
    script('꿀고구마', '전남 해남', '해남 꿀고구마, 오븐에 구우면 꿀이 주르륵 🍠'))

  // ── ① AI 콘텐츠 구독 ─────────────────────────────────────
  const subscriptions: Subscription[] = [
    sub('sub_asan', F_ASAN, 'basic', 1, '2026-06-15', '2026-09-15'),
    sub('sub_naju', F_NAJU, 'basic', 1, '2026-07-20', '2026-09-20'),
    sub('sub_yc', F_YC, 'premium', 1, '2026-07-20', '2026-09-20'),
  ]

  // ── ⑤ 건별 부가서비스 ───────────────────────────────────
  const orders: Order[] = [
    { id: 'ord_1', farmId: F_ASAN, type: 'shooting', amount: 150000, status: 'done',
      memo: '배밭 드론 촬영', relatedProductId: P_PEAR, createdAt: iso('2026-08-18T13:00:00') },
    { id: 'ord_2', farmId: F_YC, type: 'premium_edit', amount: 50000, status: 'done',
      memo: '추석 프로모션용 편집본', createdAt: iso('2026-08-22T14:00:00') },
    { id: 'ord_3', farmId: F_ASAN, type: 'extra_content', amount: 19000, status: 'paid',
      memo: '콘텐츠 제작 (아산 햅쌀)', relatedProductId: P_RICE, createdAt: iso('2026-08-26T11:15:00') },
    { id: 'ord_4', farmId: F_HAENAM, type: 'extra_content', amount: 19000, status: 'paid',
      memo: '콘텐츠 제작 (해남 꿀고구마)', relatedProductId: P_SWEET, createdAt: iso('2026-08-29T07:30:00') },
  ]

  // ── 구매자(소비자) ──────────────────────────────────────
  const buyers: Buyer[] = [
    { id: 'buyer_1', name: '김소비', email: DEMO_BUYER_ACCOUNT.email, password: DEMO_BUYER_ACCOUNT.password,
      phone: '010-5555-1234', address: '서울특별시 마포구 월드컵로 12, 302호', createdAt: iso('2026-08-01T09:00:00') },
    { id: 'buyer_2', name: '이단골', email: 'regular@example.com', password: 'test1234',
      phone: '010-6666-2345', address: '경기도 성남시 분당구 판교로 200', createdAt: iso('2026-08-05T09:00:00') },
  ]

  // ── ② 사이트 내 자체 판매 ───────────────────────────────
  const listings: Listing[] = [
    listing('lst_pear_gift', F_ASAN, P_PEAR, '아산 친환경 신고배 5kg 선물세트', '5kg (9~11과)', 45000, 40,
      '일교차 큰 아산에서 봉지 씌워 키운 친환경 신고배. 명절 선물용 고급 박스 포장.'),
    listing('lst_pear_home', F_ASAN, P_PEAR, '아산 배 가정용 7.5kg', '7.5kg (약간의 흠집)', 39000, 60,
      '맛은 그대로, 겉모양만 조금 아쉬운 가정용. 주스·잼에도 좋아요.'),
    listing('lst_rice', F_ASAN, P_RICE, '아산 햅쌀 삼광 10kg (주문 즉시 도정)', '10kg', 42000, 30,
      '주문받는 날 도정해 보내는 삽교천 햅쌀.'),
    listing('lst_naju_pear', F_NAJU, P_NAJU_PEAR, '유기농 나주 배 5kg', '5kg', 48000, 25,
      '3대째 유기농 인증 나주 배. 무농약 15년.'),
    listing('lst_grape', F_YC, P_GRAPE, '영천 샤인머스캣 2kg (2~3송이)', '2kg', 32000, 50,
      '당도 18브릭스 이상만 선별. 껍질째 드세요.'),
    listing('lst_sweet', F_HAENAM, P_SWEET, '해남 꿀고구마 베니하루카 3kg', '3kg', 21000, 80,
      '40일 큐어링한 해남 꿀고구마. 구우면 꿀처럼 달아요.'),
    listing('lst_tomato', F_DUNPO, P_TOMATO, '아산 완숙토마토 2kg', '2kg', 12000, 120,
      '둔포 스마트팜에서 아침에 딴 완숙토마토. 그날 출고.'),
    listing('lst_cuke', F_ASANOI, P_CUKE, '아산 백오이 10개입', '10개', 8500, 150,
      '매일 수확하는 아삭한 백오이. 반찬·피클용으로 좋아요.'),
  ]

  // ── ③ 공동구매 ──────────────────────────────────────────
  const gbDeadline = new Date(Date.now() + 2 * 86400000 + 14 * 3600000 + 32 * 60000).toISOString()
  const gbParticipants = Array.from({ length: 42 }, (_, i) => ({
    buyerId: i % 2 ? 'buyer_1' : 'buyer_2',
    qty: (i % 4) + 1,
    joinedAt: iso('2026-08-27T10:00:00'),
  }))
  const groupBuys: GroupBuy[] = [
    { id: 'gb_pear', farmId: F_ASAN, productId: P_PEAR, title: '아산 신고배 공동구매',
      normalPrice: 45000, groupPrice: 36000, unitLabel: '5kg', kgPerUnit: 5, targetQty: 100, currentQty: 68,
      deadline: gbDeadline, status: 'open',
      participants: gbParticipants,
      createdAt: iso('2026-08-24T09:00:00') },
    { id: 'gb_naju', farmId: F_NAJU, productId: P_NAJU_PEAR, title: '유기농 나주 배 공동구매',
      normalPrice: 48000, groupPrice: 39000, unitLabel: '5kg', kgPerUnit: 5, targetQty: 40, currentQty: 44,
      deadline: iso('2026-08-30T23:59:00'), status: 'reached',
      participants: [
        { buyerId: 'buyer_1', qty: 1, joinedAt: iso('2026-08-25T14:00:00') },
        { buyerId: 'buyer_2', qty: 1, joinedAt: iso('2026-08-26T09:00:00') },
      ],
      createdAt: iso('2026-08-20T09:00:00') },
    { id: 'gb_tomato', farmId: F_DUNPO, productId: P_TOMATO, title: '둔포 완숙토마토 공동구매',
      normalPrice: 15000, groupPrice: 11000, unitLabel: '3kg', kgPerUnit: 3, targetQty: 60, currentQty: 21,
      deadline: new Date(Date.now() + 4 * 86400000).toISOString(), status: 'open',
      participants: gbParticipants.slice(0, 12),
      createdAt: iso('2026-08-26T09:00:00') },
  ]

  // ── ④ 농산물 정기구독 (B2C) ─────────────────────────────
  const produceSubs: ProduceSub[] = [
    { id: 'psub_1', buyerId: 'buyer_1', farmId: F_ASAN, boxName: '아산 햇살농원 제철 과일 박스',
      plan: 'monthly', boxPrice: 35000, status: 'active',
      nextDelivery: iso('2026-09-10T00:00:00'), startedAt: iso('2026-07-10T09:00:00') },
  ]

  // ── 자체 판매 데모 주문 (정산 내역이 비어보이지 않도록) ──
  const shopOrders: ShopOrder[] = [
    shopOrder('so_1', 'buyer_1', [item(listings[0], 1)], 'single', 'done', '2026-08-24T10:00:00'),
    shopOrder('so_2', 'buyer_2', [item(listings[4], 2)], 'single', 'shipped', '2026-08-27T18:00:00'),
    shopOrder('so_3', 'buyer_1', [item(listings[5], 1), item(listings[2], 1)], 'single', 'preparing', '2026-08-29T09:10:00'),
  ]

  // ── 소식 (농장별 소식 피드) ────────────────────────────
  const farmPosts: FarmPost[] = [
    { id: 'post_1', farmId: F_ASAN, body: '오늘 아침 배밭입니다. 이번 주말부터 신고배 수확 시작해요! 봉지 벗기니 노랗게 잘 익었네요 🍐', productId: P_PEAR, createdAt: iso('2026-08-28T07:20:00'), likes: 34 },
    { id: 'post_2', farmId: F_YC, body: '샤인머스캣 당도 재봤더니 19.2브릭스 나왔습니다. 올해 정말 잘 됐어요.', productId: P_GRAPE, createdAt: iso('2026-08-27T15:10:00'), likes: 51 },
    { id: 'post_3', farmId: F_NAJU, body: '나주 배 공동구매 목표 수량 채웠습니다! 참여해주신 분들 감사해요. 신선하게 포장해서 보내드릴게요.', productId: P_NAJU_PEAR, createdAt: iso('2026-08-29T09:00:00'), likes: 22 },
    { id: 'post_4', farmId: F_HAENAM, body: '고구마 큐어링 40일차. 이제 단맛이 확 올라옵니다. 다음 주 출하 예정이에요.', productId: P_SWEET, createdAt: iso('2026-08-26T11:00:00'), likes: 18 },
    { id: 'post_5', farmId: F_ASAN, body: '햅쌀은 10월 수확이라 지금은 예약만 받고 있어요. 작년에 놓치신 분들 이번엔 미리 알려드릴게요!', productId: P_RICE, createdAt: iso('2026-08-25T18:30:00'), likes: 12 },
  ]

  // ── 서영왔서영 (오리지널 산지 방문 시리즈) ──────────────
  const sanjiEpisodes: SanjiEpisode[] = [
    { id: 'ep_1', epNo: 12, title: '본격적으로 아산 배 따는 서영', host: '서영', farmId: F_ASAN, productId: P_PEAR,
      summary: '20년 배 농사 김영수 사장님과 함께 신고배를 직접 수확해봤습니다. 봉지 씌우는 이유, 당도의 비밀까지.',
      views: 48200, publishedAt: iso('2026-08-24T10:00:00') },
    { id: 'ep_2', epNo: 11, title: '영천 샤인머스캣 밭에서 껍질째 먹방', host: '서영', farmId: F_YC, productId: P_GRAPE,
      summary: '당도 18브릭스 이상만 출하한다는 이경도 사장님. 밭에서 바로 따서 먹어봤어요.',
      views: 61500, publishedAt: iso('2026-08-17T10:00:00') },
    { id: 'ep_3', epNo: 10, title: '3대째 유기농 나주 배, 뭐가 다를까', host: '서영', farmId: F_NAJU, productId: P_NAJU_PEAR,
      summary: '무농약 15년. 박정순 사장님의 나주평야 배밭을 다녀왔습니다.',
      views: 33800, publishedAt: iso('2026-08-10T10:00:00') },
    { id: 'ep_4', epNo: 9, title: '해남 꿀고구마 캐서 바로 구워먹기', host: '서영', farmId: F_HAENAM, productId: P_SWEET,
      summary: '해풍 맞고 자란 베니하루카. 큐어링이 뭔지 정미영 사장님께 배웠어요.',
      views: 40100, publishedAt: iso('2026-08-03T10:00:00') },
  ]

  // ── 소싱(B2B) 신청 데모 ────────────────────────────────
  const srcReq = (id: string, sellerId: string, productId: string, qtyKg: number, status: SourcingRequest['status'], date: string): SourcingRequest => {
    const p = products.find((x) => x.id === productId)!.wholesale!
    const amount = Math.round((qtyKg / parseFloat(p.unitLabel)) * p.price) || qtyKg * 2000
    return { id, sellerId, farmId: products.find((x) => x.id === productId)!.farmId, productId, qtyKg, amount, fee: Math.round(amount * SOURCING_FEE_RATE), status, createdAt: iso(date) }
  }
  const sourcingRequests: SourcingRequest[] = [
    srcReq('src_1', 'buyer_2', P_TOMATO, 50, 'confirmed', '2026-08-25T10:00:00'),
    srcReq('src_2', 'buyer_1', P_PEAR, 30, 'requested', '2026-08-28T14:00:00'),
    srcReq('src_3', 'buyer_2', P_CUKE, 40, 'shipped', '2026-08-22T09:00:00'),
  ]

  // ── AI 상세페이지 (아산 배는 확정된 상세페이지 보유) ────
  const detailPages: DetailPage[] = [
    {
      id: 'dp_pear', farmId: F_ASAN, productId: P_PEAR, status: 'published',
      badge: '9월 제철 · 친환경',
      headline: '충청남도 아산에서 친환경으로 키운 신고배',
      subheadline: '아산에서 20년째 배 농사를 짓고 있습니다.',
      highlights: [
        { icon: '🌱', title: '친환경 재배', desc: '농약을 최소화하고 한 알 한 알 봉지를 씌워 정성껏 키웁니다.' },
        { icon: '📍', title: '아산 산지', desc: '일교차가 큰 아산 땅에서 20년 경력 농가가 직접 재배합니다.' },
        { icon: '🚚', title: '농가 직송', desc: '주문 후 산지에서 바로 포장해 신선하게 보내드립니다.' },
        { icon: '📅', title: '9월 수확', desc: '당도가 가장 오른 시기에 수확해 출하합니다.' },
      ],
      story: '아산에서 20년째 배 농사를 짓고 있습니다. 농약을 최소화한 친환경 방식으로 재배하고, 한 알 한 알 봉지를 씌워 정성껏 키웁니다. 아침 저녁 일교차가 큰 아산 땅에서 자란 신고배는 과육이 단단하고 당도가 높아 한 번 드셔본 분들이 매년 다시 찾아주십니다.',
      specs: [
        { k: '품목', v: '아산 배' },
        { k: '품종', v: '신고' },
        { k: '등급·규격', v: '특·상 (대과)' },
        { k: '산지', v: '충청남도 아산시' },
        { k: '재배방식', v: '친환경' },
        { k: '인증', v: '무농약, GAP(우수관리인증)' },
        { k: '재배 경력', v: '20년' },
        { k: '당도·특징', v: '당도 12~14 브릭스' },
        { k: '수확시기', v: '9월 중순 ~ 10월 초' },
        { k: '포장 단위', v: '5kg 박스 (9~11과)' },
        { k: '판매가', v: '5kg 45,000원대' },
      ],
      howto: '냉장 보관, 신문지에 싸서 넣으면 3주까지. 드시기 30분 전 실온에 두면 향이 살아납니다.',
      faq: [
        { q: '언제 발송되나요?', a: '결제 확인 후 1~2일 내 산지에서 바로 포장해 발송합니다. (주말·공휴일 제외)' },
        { q: '선물용 포장이 가능한가요?', a: '가능합니다. 주문 시 요청사항에 남겨주세요.' },
        { q: '교환·환불은 어떻게 하나요?', a: '신선식품 특성상 단순 변심 교환은 어렵고, 상품 하자 시 사진과 함께 연락 주시면 재발송해 드립니다.' },
      ],
      closing: '아산 신고배, 지금 가장 맛있을 때 보내드립니다.',
      createdAt: iso('2026-08-21T09:00:00'),
      updatedAt: iso('2026-08-21T09:20:00'),
    },
  ]

  update((d) => {
    d.farms.push(...farms)
    d.products.push(...products)
    d.detailPages.push(...detailPages)
    d.requests.push(...requests)
    d.contents.push(...contents)
    d.subscriptions.push(...subscriptions)
    d.orders.push(...orders)
    d.buyers.push(...buyers)
    d.listings.push(...listings)
    d.shopOrders.push(...shopOrders)
    d.groupBuys.push(...groupBuys)
    d.produceSubs.push(...produceSubs)
    d.farmPosts.push(...farmPosts)
    d.sanjiEpisodes.push(...sanjiEpisodes)
    d.sourcingRequests.push(...sourcingRequests)
  })
}

// ── 빌더 ────────────────────────────────────────────────────

function sub(id: string, farmId: string, planId: Subscription['planId'], used: number, start: string, renew: string): Subscription {
  return { id, farmId, planId, status: 'active', startedAt: iso(`${start}T09:00:00`), renewsAt: iso(`${renew}T09:00:00`), usedThisCycle: used }
}

function listing(id: string, farmId: string, productId: string, title: string, unitLabel: string, price: number, stock: number, description: string): Listing {
  return { id, farmId, productId, title, unitLabel, price, stock, description, status: 'live', createdAt: iso('2026-07-25T09:00:00') }
}

function item(l: Listing, qty: number) {
  return { listingId: l.id, farmId: l.farmId, title: l.title, qty, unitPrice: l.price }
}

function shopOrder(
  id: string, buyerId: string, items: ShopOrder['items'], kind: ShopOrder['kind'], status: ShopOrder['status'], date: string,
): ShopOrder {
  const goods = items.reduce((s, x) => s + x.qty * x.unitPrice, 0)
  const shipping = SHIPPING_FEE
  return {
    id, buyerId, items, kind, status,
    goods, shipping, total: goods + shipping,
    platformFee: Math.round(goods * COMMERCE_FEE_RATE),
    createdAt: iso(date),
  }
}
