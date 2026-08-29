// ─────────────────────────────────────────────────────────────
// 목(mock) API — 화면은 오직 이 모듈만 호출한다.
// 실제 서버가 붙으면 각 함수 내부를 fetch(...) 로 교체하면 된다.
//
// 권한 분리: 농가/구매자용 조회 함수는 모두 소유자 id 를 받아
// 본인 데이터만 반환한다.
// ─────────────────────────────────────────────────────────────

import { aiProvider } from './ai'
import { read, uid, update } from './db'
import {
  COMMERCE_FEE_RATE,
  ORDER_PRICE,
  PAYG_CONTENT_PRICE,
  PLANS,
  PRODUCE_BOX_PRICE,
  SHIPPING_FEE,
  SOURCING_FEE_RATE,
  SUBSCRIPTION_FEE_RATE,
  GROUPBUY_DEFAULT_DAYS,
  GROUPBUY_DEFAULT_TARGET,
  orderRevenue,
  planById,
} from './billing'
import type {
  Buyer,
  Content,
  ContentLength,
  ContentRequest,
  ContentStatus,
  DetailPage,
  Entitlement,
  Farm,
  FarmProduct,
  GroupBuy,
  Listing,
  Order,
  OrderType,
  PlanId,
  ProducePlan,
  ProduceSub,
  ShopOrder,
  SourcingRequest,
} from './types'

const IN_PROGRESS: ContentStatus[] = ['requested', 'analyzing', 'scripting', 'producing']

const TIMELINE: { at: number; status: ContentStatus }[] = [
  { at: 0, status: 'analyzing' },
  { at: 5000, status: 'scripting' },
  { at: 11000, status: 'producing' },
  { at: 18000, status: 'review' },
]

function net<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function tick() {
  const now = Date.now()
  update((db) => {
    for (const c of db.contents) {
      if (!c.auto || !IN_PROGRESS.includes(c.status)) continue
      const elapsed = now - new Date(c.createdAt).getTime()
      let nextS = c.status
      for (const step of TIMELINE) if (elapsed >= step.at) nextS = step.status
      if (nextS !== c.status) {
        c.status = nextS
        const req = db.requests.find((r) => r.id === c.requestId)
        if (req) req.status = nextS
      }
    }
  })
}

/** 콘텐츠 1건을 무엇으로 만들 수 있는지: 구독 잔여 → 없으면 건별 결제 */
function resolveEntitlement(db: ReturnType<typeof read>, farmId: string): Entitlement {
  const sub = db.subscriptions.find((s) => s.farmId === farmId && s.status === 'active')
  if (sub) {
    const plan = planById(sub.planId)
    const remaining = plan.monthlyQuota - sub.usedThisCycle
    if (remaining > 0) return { kind: 'subscription', plan, remaining }
  }
  return { kind: 'payg', price: PAYG_CONTENT_PRICE }
}

const commerceFee = (goods: number) => Math.round(goods * COMMERCE_FEE_RATE)

// ═══════════════════════════════════════════════════════════════

export const api = {
  // ── 농가 계정 ────────────────────────────────────────────

  async signup(input: Omit<Farm, 'id' | 'createdAt'>): Promise<Farm> {
    const db = read()
    if (db.farms.some((f) => f.email.toLowerCase() === input.email.toLowerCase()))
      throw new Error('이미 가입된 이메일입니다. 로그인해 주세요.')
    const farm: Farm = { ...input, id: uid('farm'), createdAt: new Date().toISOString() }
    update((d) => d.farms.push(farm))
    return net(farm)
  },

  async login(email: string, password: string): Promise<Farm> {
    const farm = read().farms.find((f) => f.email.toLowerCase() === email.toLowerCase())
    if (!farm || farm.password !== password)
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
    return net(farm)
  },

  async getFarm(farmId: string) {
    return net(read().farms.find((f) => f.id === farmId))
  },

  // ── 농산물 ───────────────────────────────────────────────

  async listProducts(farmId: string) {
    return net(
      read().products.filter((p) => p.farmId === farmId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    )
  },
  async getProduct(farmId: string, productId: string) {
    return net(read().products.find((p) => p.id === productId && p.farmId === farmId))
  },
  async createProduct(input: Omit<FarmProduct, 'id' | 'createdAt'>) {
    const product: FarmProduct = { ...input, id: uid('prod'), createdAt: new Date().toISOString() }
    update((d) => d.products.push(product))
    return net(product)
  },

  // ── AI 상세페이지 ────────────────────────────────────────

  async getDetailPage(farmId: string, productId: string) {
    return net(
      read().detailPages.find((p) => p.productId === productId && p.farmId === farmId) ?? null,
    )
  },

  /** 농산물 데이터로부터 상세페이지 초안을 생성(또는 재생성)한다. */
  async generateDetailPage(farmId: string, productId: string) {
    const db = read()
    const product = db.products.find((p) => p.id === productId && p.farmId === farmId)
    if (!product) throw new Error('농산물을 찾을 수 없습니다.')
    const gen = await aiProvider.generateDetailPage({ product })
    const now = new Date().toISOString()
    let result: DetailPage
    update((d) => {
      const existing = d.detailPages.find((p) => p.productId === productId && p.farmId === farmId)
      if (existing) {
        Object.assign(existing, gen, { status: 'draft', updatedAt: now })
        result = existing
      } else {
        result = { id: uid('dp'), farmId, productId, status: 'draft', ...gen, createdAt: now, updatedAt: now }
        d.detailPages.push(result)
      }
    })
    return net(result!)
  },

  async updateDetailPage(farmId: string, dpId: string, patch: Partial<DetailPage>) {
    update((d) => {
      const dp = d.detailPages.find((p) => p.id === dpId && p.farmId === farmId)
      if (dp) Object.assign(dp, patch, { updatedAt: new Date().toISOString() })
    })
    return net(true)
  },

  async publishDetailPage(farmId: string, dpId: string) {
    update((d) => {
      const dp = d.detailPages.find((p) => p.id === dpId && p.farmId === farmId)
      if (dp) {
        dp.status = 'published'
        dp.updatedAt = new Date().toISOString()
      }
    })
    return net(true)
  },

  // ── AI 콘텐츠 ────────────────────────────────────────────

  async listRequests(farmId: string) {
    tick()
    return net(read().requests.filter((r) => r.farmId === farmId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },
  async listContents(farmId: string) {
    tick()
    return net(read().contents.filter((c) => c.farmId === farmId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
  },
  async getContent(farmId: string, contentId: string) {
    tick()
    return net(read().contents.find((c) => c.id === contentId && c.farmId === farmId))
  },
  async getEntitlement(farmId: string): Promise<Entitlement> {
    return net(resolveEntitlement(read(), farmId))
  },

  async requestContent(input: {
    farmId: string
    productId: string
    length: ContentLength
    payForThis?: boolean
  }): Promise<{ request: ContentRequest; content: Content }> {
    const db = read()
    const product = db.products.find((p) => p.id === input.productId && p.farmId === input.farmId)
    if (!product) throw new Error('농산물을 찾을 수 없습니다.')

    const ent = resolveEntitlement(db, input.farmId)
    if (ent.kind === 'payg' && !input.payForThis) {
      const e = new Error('PAYG_REQUIRED') as Error & { entitlement: Entitlement }
      e.entitlement = ent
      throw e
    }

    const detail = db.detailPages.find(
      (p) => p.productId === input.productId && p.farmId === input.farmId && p.status === 'published',
    )
    const { title, script } = await aiProvider.generateScript({ product, length: input.length, detail })
    const requestId = uid('req')
    const createdAt = new Date().toISOString()
    const request: ContentRequest = {
      id: requestId, farmId: input.farmId, productId: input.productId,
      type: 'shortform', length: input.length, status: 'analyzing', createdAt,
    }
    const content: Content = {
      id: uid('cnt'), requestId, farmId: input.farmId, productId: input.productId,
      title, status: 'analyzing', length: input.length, createdAt, script,
      posterPhoto: product.photos[0], auto: true, coveredBy: ent.kind,
      detailPageId: detail?.id,
    }
    update((d) => {
      d.requests.push(request)
      d.contents.push(content)
      if (ent.kind === 'subscription') {
        const s = d.subscriptions.find((x) => x.farmId === input.farmId && x.status === 'active')
        if (s) s.usedThisCycle += 1
      } else {
        d.orders.push({
          id: uid('ord'), farmId: input.farmId, type: 'extra_content', amount: PAYG_CONTENT_PRICE,
          status: 'paid', memo: `콘텐츠 제작 (${product.name})`, relatedProductId: product.id, createdAt,
        })
      }
    })
    return { request, content }
  },

  // ── ① AI 콘텐츠 구독 / ⑤ 건별 부가서비스 ─────────────────

  async getPlans() {
    return net(PLANS)
  },

  async getBilling(farmId: string) {
    tick()
    const db = read()
    const sub = db.subscriptions.find((s) => s.farmId === farmId && s.status === 'active')
    const plan = sub ? planById(sub.planId) : null
    return net({
      subscription: sub ?? null,
      plan,
      quotaRemaining: sub && plan ? Math.max(0, plan.monthlyQuota - sub.usedThisCycle) : 0,
      orders: db.orders.filter((o) => o.farmId === farmId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      entitlement: resolveEntitlement(db, farmId),
    })
  },

  async subscribe(farmId: string, planId: PlanId) {
    const now = new Date()
    const renews = new Date(now)
    renews.setMonth(renews.getMonth() + 1)
    update((d) => {
      const existing = d.subscriptions.find((s) => s.farmId === farmId)
      if (existing) {
        existing.planId = planId
        existing.status = 'active'
        existing.renewsAt = renews.toISOString()
      } else {
        d.subscriptions.push({
          id: uid('sub'), farmId, planId, status: 'active',
          startedAt: now.toISOString(), renewsAt: renews.toISOString(), usedThisCycle: 0,
        })
      }
    })
    return net(true)
  },

  async cancelSubscription(farmId: string) {
    update((d) => {
      const s = d.subscriptions.find((x) => x.farmId === farmId && x.status === 'active')
      if (s) s.status = 'canceled'
    })
    return net(true)
  },

  async createOrder(input: { farmId: string; type: OrderType; memo?: string; relatedProductId?: string }) {
    const order: Order = {
      id: uid('ord'), farmId: input.farmId, type: input.type, amount: ORDER_PRICE[input.type],
      status: 'paid', memo: input.memo, relatedProductId: input.relatedProductId,
      createdAt: new Date().toISOString(),
    }
    update((d) => d.orders.push(order))
    return net(order)
  },

  // ── 농가: ② 자체 판매 / ③ 공동구매 / ④ 정기구독 관리 ─────

  async myStore(farmId: string) {
    tick()
    const db = read()
    const listings = db.listings.filter((l) => l.farmId === farmId)
    const orders = db.shopOrders
      .filter((o) => o.items.some((it) => it.farmId === farmId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const groupBuys = db.groupBuys.filter((g) => g.farmId === farmId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const produceSubs = db.produceSubs.filter((s) => s.farmId === farmId)

    // 농가 몫 정산 계산 (해당 농가 아이템만)
    let gmv = 0
    let fee = 0
    for (const o of orders)
      for (const it of o.items.filter((x) => x.farmId === farmId)) {
        gmv += it.qty * it.unitPrice
        fee += Math.round(it.qty * it.unitPrice * COMMERCE_FEE_RATE)
      }
    const subGmv = produceSubs.filter((s) => s.status === 'active').reduce((n, s) => n + s.boxPrice, 0)

    return net({
      listings: listings.map((l) => ({
        listing: l,
        product: db.products.find((p) => p.id === l.productId),
        sold: orders.reduce(
          (n, o) => n + o.items.filter((it) => it.listingId === l.id).reduce((m, it) => m + it.qty, 0),
          0,
        ),
      })),
      orders,
      groupBuys,
      produceSubs: produceSubs.map((s) => ({ sub: s, buyer: db.buyers.find((b) => b.id === s.buyerId) })),
      products: db.products.filter((p) => p.farmId === farmId),
      summary: { gmv, fee, net: gmv - fee, subGmv, subCount: produceSubs.filter((s) => s.status === 'active').length },
    })
  },

  async createListing(input: {
    farmId: string
    productId: string
    title: string
    unitLabel: string
    price: number
    stock: number
    description: string
  }) {
    const listing: Listing = {
      id: uid('lst'), ...input, status: 'live', createdAt: new Date().toISOString(),
    }
    update((d) => d.listings.push(listing))
    return net(listing)
  },

  async setListingStatus(farmId: string, listingId: string, status: Listing['status']) {
    update((d) => {
      const l = d.listings.find((x) => x.id === listingId && x.farmId === farmId)
      if (l) l.status = status
    })
    return net(true)
  },

  async createGroupBuy(input: {
    farmId: string
    productId: string
    title: string
    normalPrice: number
    groupPrice: number
    unitLabel: string
    targetQty?: number
  }) {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + GROUPBUY_DEFAULT_DAYS)
    const gb: GroupBuy = {
      id: uid('gb'), farmId: input.farmId, productId: input.productId, title: input.title,
      normalPrice: input.normalPrice, groupPrice: input.groupPrice, unitLabel: input.unitLabel,
      targetQty: input.targetQty || GROUPBUY_DEFAULT_TARGET, currentQty: 0,
      deadline: deadline.toISOString(), status: 'open', participants: [],
      createdAt: new Date().toISOString(),
    }
    update((d) => d.groupBuys.push(gb))
    return net(gb)
  },

  // ── 구매자(소비자) ──────────────────────────────────────

  buyer: {
    async signup(input: Omit<Buyer, 'id' | 'createdAt'>): Promise<Buyer> {
      const db = read()
      if (db.buyers.some((b) => b.email.toLowerCase() === input.email.toLowerCase()))
        throw new Error('이미 가입된 이메일입니다.')
      const buyer: Buyer = { ...input, id: uid('buyer'), createdAt: new Date().toISOString() }
      update((d) => d.buyers.push(buyer))
      return net(buyer)
    },

    async login(email: string, password: string): Promise<Buyer> {
      const b = read().buyers.find((x) => x.email.toLowerCase() === email.toLowerCase())
      if (!b || b.password !== password) throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.')
      return net(b)
    },

    /** 앱 홈 화면 데이터 묶음 */
    async home() {
      const db = read()
      const listing = (l: Listing) => ({
        listing: l,
        farm: db.farms.find((f) => f.id === l.farmId)!,
        product: db.products.find((p) => p.id === l.productId),
      })
      return net({
        recommended: db.listings.filter((l) => l.status === 'live').slice(0, 8).map(listing),
        groupBuys: db.groupBuys
          .filter((g) => g.status !== 'closed')
          .slice(0, 4)
          .map((g) => ({ gb: g, farm: db.farms.find((f) => f.id === g.farmId)! })),
        latestEpisode: [...db.sanjiEpisodes].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0],
        latestPosts: [...db.farmPosts]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 3)
          .map((p) => ({ post: p, farm: db.farms.find((f) => f.id === p.farmId)! })),
        reels: db.contents
          .filter((c) => c.status === 'published')
          .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
          .slice(0, 6)
          .map((c) => ({
            content: c,
            farm: db.farms.find((f) => f.id === c.farmId)!,
            product: db.products.find((p) => p.id === c.productId),
          })),
      })
    },

    /** 소식 피드 */
    async news() {
      const db = read()
      return net(
        [...db.farmPosts]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((post) => ({
            post,
            farm: db.farms.find((f) => f.id === post.farmId)!,
            product: post.productId ? db.products.find((p) => p.id === post.productId) : undefined,
            listing: db.listings.find((l) => l.productId === post.productId && l.status === 'live'),
          })),
      )
    },

    async likePost(postId: string) {
      update((d) => {
        const p = d.farmPosts.find((x) => x.id === postId)
        if (p) p.likes += 1
      })
      return net(true)
    },

    /** 산지왔서영 시리즈 */
    async sanji() {
      const db = read()
      return net(
        [...db.sanjiEpisodes]
          .sort((a, b) => b.epNo - a.epNo)
          .map((ep) => ({
            ep,
            farm: db.farms.find((f) => f.id === ep.farmId)!,
            product: db.products.find((p) => p.id === ep.productId),
            listing: db.listings.find((l) => l.productId === ep.productId && l.status === 'live'),
          })),
      )
    },

    /** 콘텐츠(숏폼) 피드 — 전체 농가 발행 콘텐츠 */
    async reels() {
      const db = read()
      return net(
        db.contents
          .filter((c) => c.status === 'published')
          .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
          .map((content) => ({
            content,
            farm: db.farms.find((f) => f.id === content.farmId)!,
            product: db.products.find((p) => p.id === content.productId),
            listing: db.listings.find((l) => l.productId === content.productId && l.status === 'live'),
          })),
      )
    },

    /** 소싱(B2B) — 산지 도매 카탈로그 */
    async sourcing() {
      const db = read()
      return net(
        db.products
          .filter((p) => p.wholesale)
          .map((product) => ({
            product,
            farm: db.farms.find((f) => f.id === product.farmId)!,
          })),
      )
    },

    async mySourcing(sellerId: string) {
      const db = read()
      return net(
        db.sourcingRequests
          .filter((s) => s.sellerId === sellerId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((req) => ({
            req,
            farm: db.farms.find((f) => f.id === req.farmId)!,
            product: db.products.find((p) => p.id === req.productId)!,
          })),
      )
    },

    /** 소싱 신청 or 문의 (mock) */
    async applySourcing(input: {
      sellerId: string
      productId: string
      qtyKg: number
      inquiry?: boolean
      memo?: string
    }) {
      const db = read()
      const product = db.products.find((p) => p.id === input.productId)
      if (!product?.wholesale) throw new Error('소싱 정보를 찾을 수 없습니다.')
      const w = product.wholesale
      const unitKg = parseFloat(w.unitLabel) || 1
      const amount = Math.round((input.qtyKg / unitKg) * w.price)
      const request: SourcingRequest = {
        id: uid('src'),
        sellerId: input.sellerId,
        farmId: product.farmId,
        productId: input.productId,
        qtyKg: input.qtyKg,
        amount,
        fee: Math.round(amount * SOURCING_FEE_RATE),
        status: input.inquiry ? 'inquiry' : 'requested',
        memo: input.memo,
        createdAt: new Date().toISOString(),
      }
      update((d) => d.sourcingRequests.push(request))
      return net(request)
    },

    /** 스토어: 판매 상품 목록 (+ 농가/콘텐츠 정보) */
    async browse() {
      const db = read()
      const rows = db.listings
        .filter((l) => l.status !== 'paused')
        .map((l) => ({
          listing: l,
          farm: db.farms.find((f) => f.id === l.farmId)!,
          product: db.products.find((p) => p.id === l.productId),
          content: db.contents.find((c) => c.productId === l.productId && c.status === 'published'),
        }))
      return net(rows)
    },

    async getListing(listingId: string) {
      const db = read()
      const l = db.listings.find((x) => x.id === listingId)
      if (!l) throw new Error('상품을 찾을 수 없습니다.')
      return net({
        listing: l,
        farm: db.farms.find((f) => f.id === l.farmId)!,
        product: db.products.find((p) => p.id === l.productId),
        content: db.contents.find((c) => c.productId === l.productId && c.status === 'published'),
        detail: db.detailPages.find((p) => p.productId === l.productId && p.status === 'published') ?? null,
        otherFromFarm: db.listings.filter((x) => x.farmId === l.farmId && x.id !== l.id && x.status === 'live'),
      })
    },

    async groupBuys() {
      const db = read()
      return net(
        db.groupBuys
          .sort((a, b) => (a.status === 'open' ? -1 : 1))
          .map((g) => ({
            gb: g,
            farm: db.farms.find((f) => f.id === g.farmId)!,
            product: db.products.find((p) => p.id === g.productId),
          })),
      )
    },

    async getGroupBuy(gbId: string) {
      const db = read()
      const g = db.groupBuys.find((x) => x.id === gbId)
      if (!g) throw new Error('공동구매를 찾을 수 없습니다.')
      return net({
        gb: g,
        farm: db.farms.find((f) => f.id === g.farmId)!,
        product: db.products.find((p) => p.id === g.productId),
      })
    },

    async joinGroupBuy(buyerId: string, gbId: string, qty: number) {
      let order: ShopOrder | null = null
      update((d) => {
        const g = d.groupBuys.find((x) => x.id === gbId)
        if (!g || g.status === 'closed') throw new Error('마감된 공동구매입니다.')
        g.participants.push({ buyerId, qty, joinedAt: new Date().toISOString() })
        g.currentQty += qty
        if (g.currentQty >= g.targetQty) g.status = 'reached'
        const goods = qty * g.groupPrice
        order = {
          id: uid('so'), buyerId,
          items: [{ listingId: g.id, farmId: g.farmId, title: g.title, qty, unitPrice: g.groupPrice }],
          goods, shipping: SHIPPING_FEE, total: goods + SHIPPING_FEE,
          platformFee: commerceFee(goods), kind: 'groupbuy', status: 'paid',
          createdAt: new Date().toISOString(),
        }
        d.shopOrders.push(order)
      })
      return net(order!)
    },

    /** 장바구니 결제 (mock). items: [{listingId, qty}] */
    async checkout(buyerId: string, items: { listingId: string; qty: number }[]) {
      let order: ShopOrder | null = null
      update((d) => {
        const orderItems = items.map((it) => {
          const l = d.listings.find((x) => x.id === it.listingId)
          if (!l) throw new Error('상품을 찾을 수 없습니다.')
          if (l.stock < it.qty) throw new Error(`"${l.title}" 재고가 부족합니다.`)
          l.stock -= it.qty
          if (l.stock === 0) l.status = 'soldout'
          return { listingId: l.id, farmId: l.farmId, title: l.title, qty: it.qty, unitPrice: l.price }
        })
        const goods = orderItems.reduce((s, x) => s + x.qty * x.unitPrice, 0)
        order = {
          id: uid('so'), buyerId, items: orderItems, goods, shipping: SHIPPING_FEE,
          total: goods + SHIPPING_FEE, platformFee: commerceFee(goods), kind: 'single',
          status: 'paid', createdAt: new Date().toISOString(),
        }
        d.shopOrders.push(order)
      })
      return net(order!)
    },

    async myOrders(buyerId: string) {
      const db = read()
      return net(db.shopOrders.filter((o) => o.buyerId === buyerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
    },

    /** 농산물 정기구독 상품(농가별 박스) */
    async produceBoxes() {
      const db = read()
      const farmIds = [...new Set(db.listings.filter((l) => l.status === 'live').map((l) => l.farmId))]
      return net(
        farmIds.map((fid) => {
          const farm = db.farms.find((f) => f.id === fid)!
          const items = db.products.filter((p) => p.farmId === fid).map((p) => p.name)
          return {
            farm,
            boxName: `${farm.farmName} 제철 농산물 박스`,
            items,
            monthly: PRODUCE_BOX_PRICE.monthly,
            biweekly: PRODUCE_BOX_PRICE.biweekly,
          }
        }),
      )
    },

    async subscribeProduce(buyerId: string, farmId: string, plan: ProducePlan) {
      const db = read()
      const farm = db.farms.find((f) => f.id === farmId)!
      const next = new Date()
      next.setDate(next.getDate() + (plan === 'monthly' ? 30 : 14))
      const psub: ProduceSub = {
        id: uid('psub'), buyerId, farmId, boxName: `${farm.farmName} 제철 농산물 박스`,
        plan, boxPrice: PRODUCE_BOX_PRICE[plan], status: 'active',
        nextDelivery: next.toISOString(), startedAt: new Date().toISOString(),
      }
      update((d) => {
        d.produceSubs.push(psub)
        const goods = psub.boxPrice
        d.shopOrders.push({
          id: uid('so'), buyerId,
          items: [{ listingId: psub.id, farmId, title: psub.boxName, qty: 1, unitPrice: goods }],
          goods, shipping: 0, total: goods, platformFee: Math.round(goods * SUBSCRIPTION_FEE_RATE),
          kind: 'subscription', status: 'paid', createdAt: new Date().toISOString(),
        })
      })
      return net(psub)
    },

    async myProduceSubs(buyerId: string) {
      const db = read()
      return net(
        db.produceSubs
          .filter((s) => s.buyerId === buyerId)
          .map((s) => ({ sub: s, farm: db.farms.find((f) => f.id === s.farmId)! })),
      )
    },

    async setProduceSubStatus(buyerId: string, subId: string, status: ProduceSub['status']) {
      update((d) => {
        const s = d.produceSubs.find((x) => x.id === subId && x.buyerId === buyerId)
        if (s) s.status = status
      })
      return net(true)
    },
  },

  // ── 관리자 ───────────────────────────────────────────────

  admin: {
    async login(email: string, password: string) {
      if (email.toLowerCase() === 'admin@youngfarm.ai' && password === 'admin1234')
        return net({ email: 'admin@youngfarm.ai', name: '운영자' })
      throw new Error('관리자 계정 정보가 올바르지 않습니다.')
    },

    async overview() {
      tick()
      const db = read()
      const gmv =
        db.shopOrders.filter((o) => o.status !== 'canceled').reduce((n, o) => n + o.goods, 0)
      return net({
        totalFarms: db.farms.length,
        totalBuyers: db.buyers.length,
        requests: db.requests.length,
        reviewWaiting: db.contents.filter((c) => c.status === 'review').length,
        published: db.contents.filter((c) => c.status === 'published').length,
        openGroupBuys: db.groupBuys.filter((g) => g.status === 'open').length,
        produceSubs: db.produceSubs.filter((s) => s.status === 'active').length,
        gmv,
      })
    },

    async farms() {
      tick()
      const db = read()
      return net(
        db.farms.map((f) => {
          const products = db.products.filter((p) => p.farmId === f.id)
          const contents = db.contents.filter((c) => c.farmId === f.id)
          return {
            farm: f,
            productCount: products.length,
            productNames: products.map((p) => p.name),
            requestCount: db.requests.filter((r) => r.farmId === f.id).length,
            reviewWaiting: contents.filter((c) => c.status === 'review').length,
            published: contents.filter((c) => c.status === 'published').length,
            listings: db.listings.filter((l) => l.farmId === f.id).length,
          }
        }),
      )
    },

    async farmDetail(farmId: string) {
      tick()
      const db = read()
      const farm = db.farms.find((f) => f.id === farmId)
      if (!farm) throw new Error('농가를 찾을 수 없습니다.')
      return net({
        farm,
        products: db.products.filter((p) => p.farmId === farmId),
        detailPages: db.detailPages.filter((p) => p.farmId === farmId),
        requests: db.requests.filter((r) => r.farmId === farmId),
        contents: db.contents.filter((c) => c.farmId === farmId),
        listings: db.listings.filter((l) => l.farmId === farmId),
        groupBuys: db.groupBuys.filter((g) => g.farmId === farmId),
        produceSubs: db.produceSubs.filter((s) => s.farmId === farmId),
      })
    },

    async listAllContents() {
      tick()
      const db = read()
      return net(
        db.contents
          .map((c) => ({
            content: c,
            farm: db.farms.find((f) => f.id === c.farmId)!,
            product: db.products.find((p) => p.id === c.productId)!,
            request: db.requests.find((r) => r.id === c.requestId),
          }))
          .sort((a, b) => b.content.createdAt.localeCompare(a.content.createdAt)),
      )
    },

    async getContentForReview(contentId: string) {
      tick()
      const db = read()
      const content = db.contents.find((c) => c.id === contentId)
      if (!content) throw new Error('콘텐츠를 찾을 수 없습니다.')
      return net({
        content,
        farm: db.farms.find((f) => f.id === content.farmId)!,
        product: db.products.find((p) => p.id === content.productId)!,
      })
    },

    async runGeneration(requestId: string) {
      const db = read()
      const request = db.requests.find((r) => r.id === requestId)
      if (!request) throw new Error('요청을 찾을 수 없습니다.')
      const product = db.products.find((p) => p.id === request.productId)!
      const existing = db.contents.find((c) => c.requestId === requestId)
      const detail = db.detailPages.find(
        (p) => p.productId === request.productId && p.farmId === request.farmId && p.status === 'published',
      )
      const { title, script } = await aiProvider.generateScript({ product, length: request.length, detail })
      update((d) => {
        const req = d.requests.find((r) => r.id === requestId)!
        req.status = 'review'
        if (existing) {
          const c = d.contents.find((x) => x.id === existing.id)!
          Object.assign(c, { title, script, status: 'review', auto: false })
        } else {
          d.contents.push({
            id: uid('cnt'), requestId, farmId: request.farmId, productId: request.productId,
            title, script, length: request.length, status: 'review',
            createdAt: new Date().toISOString(), posterPhoto: product.photos[0],
          })
        }
      })
      return net(true)
    },

    async approve(contentId: string, reviewNote?: string) {
      update((d) => {
        const c = d.contents.find((x) => x.id === contentId)
        if (!c) return
        Object.assign(c, {
          status: 'published', publishedAt: new Date().toISOString(),
          reviewNote: reviewNote?.trim() || undefined, auto: false,
        })
        const req = d.requests.find((r) => r.id === c.requestId)
        if (req) req.status = 'published'
      })
      return net(true)
    },

    async reject(contentId: string, reviewNote: string) {
      update((d) => {
        const c = d.contents.find((x) => x.id === contentId)
        if (!c) return
        Object.assign(c, { status: 'rejected', reviewNote: reviewNote.trim(), auto: false })
        const req = d.requests.find((r) => r.id === c.requestId)
        if (req) req.status = 'rejected'
      })
      return net(true)
    },

    // ── 매출: 5개 BM 합산 ─────────────────────────────────

    async revenue() {
      tick()
      const db = read()
      const activeSubs = db.subscriptions.filter((s) => s.status === 'active')
      const contentMrr = activeSubs.reduce((n, s) => n + planById(s.planId).priceMonthly, 0)
      const orderRev = orderRevenue(db.orders)

      const valid = db.shopOrders.filter((o) => o.status !== 'canceled')
      const singleFee = valid.filter((o) => o.kind === 'single').reduce((n, o) => n + o.platformFee, 0)
      const groupFee = valid.filter((o) => o.kind === 'groupbuy').reduce((n, o) => n + o.platformFee, 0)
      const produceFee = valid.filter((o) => o.kind === 'subscription').reduce((n, o) => n + o.platformFee, 0)
      const gmv = valid.reduce((n, o) => n + o.goods, 0)
      const validSrc = db.sourcingRequests.filter((s) => s.status !== 'canceled' && s.status !== 'inquiry')
      const sourcingFee = validSrc.reduce((n, s) => n + s.fee, 0)
      const sourcingGmv = validSrc.reduce((n, s) => n + s.amount, 0)

      return net({
        contentMrr,
        orderRev,
        sourcingFee,
        sourcingGmv,
        selfSaleFee: singleFee,
        groupBuyFee: groupFee,
        produceSubFee: produceFee,
        commerceGmv: gmv,
        total: contentMrr + orderRev + sourcingFee + singleFee + groupFee + produceFee,
        subsByPlan: PLANS.map((pl) => ({ plan: pl, count: activeSubs.filter((s) => s.planId === pl.id).length })),
        subscribers: activeSubs.map((s) => ({
          farm: db.farms.find((f) => f.id === s.farmId)!,
          plan: planById(s.planId), used: s.usedThisCycle, renewsAt: s.renewsAt,
        })),
        contentOrders: db.orders
          .map((o) => ({ order: o, farm: db.farms.find((f) => f.id === o.farmId)! }))
          .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt)),
      })
    },

    // ── 커머스(자체판매·공동구매·정기구독) 현황 ───────────

    async commerce() {
      tick()
      const db = read()
      const valid = db.shopOrders.filter((o) => o.status !== 'canceled')
      return net({
        feeRate: COMMERCE_FEE_RATE,
        subFeeRate: SUBSCRIPTION_FEE_RATE,
        listings: db.listings.map((l) => {
          const sold = valid.reduce(
            (n, o) => n + o.items.filter((it) => it.listingId === l.id).reduce((m, it) => m + it.qty, 0),
            0,
          )
          const gross = valid.reduce(
            (n, o) => n + o.items.filter((it) => it.listingId === l.id).reduce((m, it) => m + it.qty * it.unitPrice, 0),
            0,
          )
          return {
            listing: l,
            farm: db.farms.find((f) => f.id === l.farmId)!,
            sold,
            gross,
            fee: Math.round(gross * COMMERCE_FEE_RATE),
          }
        }),
        orders: valid
          .map((o) => ({ order: o, buyer: db.buyers.find((b) => b.id === o.buyerId) }))
          .sort((a, b) => b.order.createdAt.localeCompare(a.order.createdAt)),
        groupBuys: db.groupBuys.map((g) => ({ gb: g, farm: db.farms.find((f) => f.id === g.farmId)! })),
        produceSubs: db.produceSubs.map((s) => ({
          sub: s,
          farm: db.farms.find((f) => f.id === s.farmId)!,
          buyer: db.buyers.find((b) => b.id === s.buyerId),
        })),
        sourcing: db.sourcingRequests
          .map((req) => ({
            req,
            farm: db.farms.find((f) => f.id === req.farmId)!,
            product: db.products.find((p) => p.id === req.productId)!,
            seller: db.buyers.find((b) => b.id === req.sellerId),
          }))
          .sort((a, b) => b.req.createdAt.localeCompare(a.req.createdAt)),
        totals: {
          gmv: valid.reduce((n, o) => n + o.goods, 0),
          fee: valid.reduce((n, o) => n + o.platformFee, 0),
          orders: valid.length,
        },
      })
    },
  },
}
