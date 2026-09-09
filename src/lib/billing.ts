// ─────────────────────────────────────────────────────────────
// BM 정책 값 — ⚠️ 전부 '예시'. 확정되면 이 파일만 수정.
// ─────────────────────────────────────────────────────────────

import type { CoinPack, Order, OrderType, ProducePlan } from './types'

// ── ① AI 콘텐츠 제작 — 예치금(코인) ────────────────────────
// 구독제 폐지. 농가가 코인을 선충전해 두고 콘텐츠 제작·부가서비스에 사용한다.

/** 코인 1개의 원화 가치 (예시) */
export const WON_PER_COIN = 100

/** 숏폼 영상 1건 제작 비용 (코인) */
export const CONTENT_COIN_COST = 290

/** 건별 부가서비스 비용 (코인) */
export const ORDER_COIN_PRICE: Record<OrderType, number> = {
  extra_content: 190,
  shooting: 1500,
  premium_edit: 500,
}

/** 가입 시 지급하는 체험 코인 (예시) */
export const WELCOME_COINS = 100

/** 충전 팩 — 큰 금액일수록 보너스 코인 (예시) */
export const COIN_PACKS: CoinPack[] = [
  { id: 'pack_s', won: 30000, coins: 300, bonus: 0 },
  { id: 'pack_m', won: 100000, coins: 1000, bonus: 120, recommended: true },
  { id: 'pack_l', won: 300000, coins: 3000, bonus: 500 },
]

export function coinPackById(id: string): CoinPack | undefined {
  return COIN_PACKS.find((p) => p.id === id)
}

export function coins(n: number): string {
  return `${n.toLocaleString('ko-KR')}코인`
}

// ── ⑤ 건별 부가서비스 매출 참고 ────────────────────────────

export function orderCoinSpend(orders: Order[]): number {
  return orders.filter((o) => o.status !== 'canceled').reduce((s, o) => s + o.amount, 0)
}

// ── ②③④ 커머스 ────────────────────────────────────────────

/** 유통 소싱(B2B) 수수료율 — 거래액의 3~7% (예시 5%) */
export const SOURCING_FEE_RATE = 0.05

/** 자체 판매·공동구매·라이브커머스 수수료율 — 판매액의 5~15% (예시 8%) */
export const COMMERCE_FEE_RATE = 0.08

/** 정기구독 수수료율 (예시) */
export const SUBSCRIPTION_FEE_RATE = 0.1

/** PB·브랜드 상품 자체 마진 15~35% (예시) — 매출 계산 참고용 */
export const PB_MARGIN_RATE = 0.25

/** 기본 배송비 (예시) */
export const SHIPPING_FEE = 3500

/** 공동구매 기본 목표 수량·기간 (예시) */
export const GROUPBUY_DEFAULT_TARGET = 30
export const GROUPBUY_DEFAULT_DAYS = 7

/** ④ 농산물 정기구독 박스 가격 (예시) */
export const PRODUCE_BOX_PRICE: Record<ProducePlan, number> = {
  monthly: 35000,
  biweekly: 22000,
}

export function won(n: number): string {
  return n === 0 ? '무료' : `${n.toLocaleString('ko-KR')}원`
}
