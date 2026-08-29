// ─────────────────────────────────────────────────────────────
// BM 정책 값 — ⚠️ 전부 '예시'. 확정되면 이 파일만 수정.
// ─────────────────────────────────────────────────────────────

import type { Order, OrderType, Plan, PlanId, ProducePlan } from './types'

// ── ① AI 콘텐츠 제작 구독 (농가) ────────────────────────────

export const PLANS: Plan[] = [
  {
    id: 'trial',
    name: '무료 체험',
    priceMonthly: 0,
    monthlyQuota: 2,
    features: ['숏폼 영상 제작 월 2건', '자동 자막', '운영자 검수', '워터마크 포함'],
  },
  {
    id: 'basic',
    name: '기본형',
    priceMonthly: 99000,
    monthlyQuota: 10,
    features: ['숏폼 영상 제작 월 10건', '자동 자막', '업로드 대행 SNS 2채널', '콘텐츠 보관 30일'],
    recommended: true,
  },
  {
    id: 'premium',
    name: '고급형',
    priceMonthly: 199000,
    monthlyQuota: 30,
    features: ['숏폼 영상 제작 월 30건', '자동 자막', '업로드 대행 SNS 5채널', '성과 리포트 제공', '콘텐츠 보관 90일'],
  },
]

export function planById(id: PlanId): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0]
}

/** 구독이 없을 때 콘텐츠 1건 건별 결제가 */
export const PAYG_CONTENT_PRICE = 29000

// ── ⑤ 건별 부가서비스 ──────────────────────────────────────

export const ORDER_PRICE: Record<OrderType, number> = {
  extra_content: 19000,
  shooting: 150000,
  premium_edit: 50000,
}

export function orderRevenue(orders: Order[]): number {
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
