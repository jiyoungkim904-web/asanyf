// ─────────────────────────────────────────────────────────────
// 데이터 모델 (PRD ⑧ 기준)
//   farms            농가 정보
//   farm_products    농산물 데이터
//   content_requests 콘텐츠 생성 요청
//   contents         생성된 영상 콘텐츠와 처리 상태
// ─────────────────────────────────────────────────────────────

export interface Farm {
  id: string
  farmName: string       // 농가명
  ownerName: string      // 대표자명
  phone: string          // 연락처
  email: string
  password: string       // 프로토타입 전용 (실서비스에서는 서버 해시)
  region: string         // 농가 지역
  createdAt: string
}

export type CultivationMethod = 'organic' | 'eco' | 'conventional' | 'etc'

export const CULTIVATION_LABEL: Record<CultivationMethod, string> = {
  organic: '유기농',
  eco: '친환경',
  conventional: '관행',
  etc: '기타',
}

export const CERT_OPTIONS = [
  '무농약',
  '유기농 인증',
  'GAP(우수관리인증)',
  '저탄소 인증',
  '지리적표시(PGI)',
  'HACCP',
] as const

export interface FarmProduct {
  id: string
  farmId: string
  name: string                 // 농산물명
  variety: string              // 품종
  region: string               // 생산 지역
  method: CultivationMethod    // 재배방식
  harvestSeason: string        // 수확시기 (계절)
  story: string                // 농가 이야기
  photos: string[]             // data URL (최대 10장)
  createdAt: string

  // ── 상세 입력 (선택) — AI 상세페이지·영상의 재료 ──
  grade?: string               // 등급·규격  예: 특·상 / 대과
  packUnit?: string            // 판매 포장 단위  예: 5kg 박스 (9~11과)
  farmingYears?: number        // 재배 경력(년)
  certifications?: string[]    // 인증
  sweetness?: string           // 당도·산도 등 수치  예: 당도 12~14 브릭스
  harvestPeriod?: string       // 구체적 수확 시기  예: 9월 중순 ~ 10월 초
  sellingPoint?: string        // 우리만의 강점 한 줄
  care?: string                // 재배할 때 특별히 신경 쓰는 점
  priceRange?: string          // 판매 가격대  예: 5kg 45,000원대
  shipMethod?: string          // 배송 방법  예: 주문 후 1~2일 내 산지 직송
  storageTip?: string          // 농가 추천 보관법
  giftWrap?: boolean           // 선물 포장 가능

  /** 소싱(B2B) 정보 — 온라인 판매자가 산지에서 도매로 가져올 때 */
  wholesale?: {
    unitLabel: string          // 예: 5kg
    price: number              // 단위당 도매가
    minOrderKg: number         // 최소 주문 (kg)
    stockKg: number            // 재고 (kg)
    harvestDate: string        // 수확일 (ISO)
  }
}

// ── 소싱(B2B) 신청 ─────────────────────────────────────────

export type SourcingStatus = 'inquiry' | 'requested' | 'confirmed' | 'shipped' | 'canceled'

export const SOURCING_STATUS_LABEL: Record<SourcingStatus, string> = {
  inquiry: '문의',
  requested: '소싱 신청',
  confirmed: '거래 확정',
  shipped: '출고',
  canceled: '취소',
}

export interface SourcingRequest {
  id: string
  sellerId: string             // 온라인 판매자(구매자 계정) id
  farmId: string
  productId: string
  qtyKg: number
  amount: number               // 예상 거래액
  fee: number                  // 플랫폼 소싱 수수료 (3~7%)
  status: SourcingStatus
  memo?: string
  createdAt: string
}

// 콘텐츠 진행 상태 — 하나의 파이프라인
//   requested  제작 요청 접수
//   analyzing  AI가 농산물 데이터 분석 중
//   scripting  스크립트 생성 중
//   producing  영상 제작 중
//   review     운영자 검수 대기
//   published  발행 완료 (농가 다운로드 가능)
//   rejected   반려 (운영자가 재작업 요청)
export type ContentStatus =
  | 'requested'
  | 'analyzing'
  | 'scripting'
  | 'producing'
  | 'review'
  | 'published'
  | 'rejected'

export const STATUS_LABEL: Record<ContentStatus, string> = {
  requested: '제작 요청',
  analyzing: '제작 중',
  scripting: '제작 중',
  producing: '제작 중',
  review: '검수 중',
  published: '발행 완료',
  rejected: '반려',
}

// 임시 옵션 (PRD ⑩ 열린 질문 — 확정 아님)
export type ContentType = 'shortform'
export type ContentLength = '15s' | '30s'

export const LENGTH_LABEL: Record<ContentLength, string> = {
  '15s': '15초',
  '30s': '30초',
}

export interface ContentRequest {
  id: string
  farmId: string
  productId: string
  type: ContentType
  length: ContentLength
  status: ContentStatus
  createdAt: string
}

export interface ScriptScene {
  time: string
  visual: string
  narration: string
  caption?: string      // 화면에 얹히는 자막(오토 캡션) — 나레이션을 축약한 짧은 문구
  photoIndex?: number    // 이 장면에 쓸 농가 원본 사진 — product.photos의 인덱스
}

/** 영상 제작 방식 — v1은 항상 template(농가 실제 소재 조립). generative는 추후 프리미엄 로드맵. */
export type AssemblyMode = 'template' | 'generative'

export interface NarrationVoice {
  id: string
  name: string     // 예: 잔잔한 여성 내레이션
  style: string     // 예: 따뜻하고 차분한 톤
}

export interface Content {
  id: string
  requestId: string
  farmId: string
  productId: string
  title: string
  status: ContentStatus
  createdAt: string
  publishedAt?: string
  length: ContentLength
  script: {
    hook: string
    scenes: ScriptScene[]
    caption: string
    hashtags: string[]
    voice?: NarrationVoice   // TTS 내레이션 음성
  }
  assemblyMode?: AssemblyMode  // 조립 방식 (v1: 'template' 고정)
  reviewNote?: string      // 운영자 수정 메모
  posterPhoto?: string     // 썸네일로 쓸 농산물 사진
  auto?: boolean           // 자동 진행 파이프라인 대상 여부 (프로토타입 연출)
  coinCost?: number        // 이 콘텐츠 제작에 차감된 코인
  detailPageId?: string    // 이 영상이 어떤 상세페이지를 토대로 만들어졌는지
}

export interface AdminUser {
  email: string
  name: string
  role?: string        // 예: 콘텐츠 운영 / 총괄 운영자
  loginAt?: string     // 이번 세션 로그인 시각
}

// ─────────────────────────────────────────────────────────────
// AI 상세페이지 — 농산물 데이터를 다듬은 '정리된' 콘텐츠 자산.
// 이 페이지를 확정한 뒤, 이를 토대로 숏폼 영상 스크립트를 만든다.
// ─────────────────────────────────────────────────────────────

export type DetailPageStatus = 'draft' | 'published'

/** 상세페이지에 첨부된 AI 생성 영상 (실제 파일은 videoStore(IndexedDB)에 `assetId` 로 보관) */
export interface DetailVideo {
  assetId: string
  label: string
  model: string
  createdAt: string
}

export interface DetailPage {
  id: string
  farmId: string
  productId: string
  status: DetailPageStatus
  badge: string                        // 예: 9월 제철 · 친환경
  headline: string                     // 큰 제목
  subheadline: string                  // 보조 문구
  highlights: { icon: string; title: string; desc: string }[]  // 셀링포인트 3~4
  story: string                        // 다듬어진 농가 이야기
  specs: { k: string; v: string }[]    // 품종·재배방식·수확시기·중량 등
  howto: string                        // 보관법·먹는법
  faq: { q: string; a: string }[]
  closing: string                      // 마무리 한 줄
  videos?: DetailVideo[]               // 첨부된 AI 생성 영상
  createdAt: string
  updatedAt: string
}

// ─────────────────────────────────────────────────────────────
// BM(수익모델) — 5가지
//   ① AI 콘텐츠 제작 (메인)  예치금(코인) 선충전 → 제작 시 차감   coinWallets / coinTxns
//   ② 사이트 내 자체 판매    listings + shopOrders (플랫폼 수수료)
//   ③ 공동구매              groupBuys
//   ④ 농산물 정기구독(B2C)   produceSubs  ← 소비자가 농가 박스를 정기 수령
//   ⑤ 건별 부가서비스        orders (촬영·편집) — 코인 차감
//
// 페르소나: 농가 / 운영자 / 구매자(소비자)
//
// ⚠️ 금액·횟수·수수료율은 아직 미확정 → billing.ts 한 곳에서 관리, 화면엔 '예시'.
// ─────────────────────────────────────────────────────────────

// ── ① AI 콘텐츠 제작 — 예치금(코인) (농가) ────────────────
// 구독제 폐지 → 코인 선충전 방식. 농가가 코인을 미리 충전해 콘텐츠 제작·부가서비스에 사용.

/** 농가별 코인 잔액 */
export interface CoinWallet {
  farmId: string
  balance: number
  updatedAt: string
}

export type CoinTxnType = 'topup' | 'bonus' | 'spend' | 'refund'

export const COIN_TXN_LABEL: Record<CoinTxnType, string> = {
  topup: '충전',
  bonus: '보너스',
  spend: '사용',
  refund: '환불',
}

/** 코인 입출금 내역 (양수: 충전·보너스·환불 / 음수: 사용) */
export interface CoinTxn {
  id: string
  farmId: string
  type: CoinTxnType
  amount: number
  balanceAfter: number
  memo: string
  refId?: string        // 관련 content/order id
  wonPaid?: number       // 충전 시 실제 결제 원화
  createdAt: string
}

/** 충전 팩 */
export interface CoinPack {
  id: string
  won: number
  coins: number
  bonus: number
  recommended?: boolean
}

// ── ⑤ 건별 부가서비스 (농가) ───────────────────────────────

export type OrderType = 'extra_content' | 'shooting' | 'premium_edit'

export const ORDER_LABEL: Record<OrderType, string> = {
  extra_content: '추가 콘텐츠 1건',
  shooting: '현장 촬영 대행',
  premium_edit: '프리미엄 편집',
}

export type OrderStatus = 'paid' | 'in_progress' | 'done' | 'canceled'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  paid: '결제 완료',
  in_progress: '진행 중',
  done: '완료',
  canceled: '취소',
}

export interface Order {
  id: string
  farmId: string
  type: OrderType
  amount: number
  status: OrderStatus
  memo?: string
  relatedProductId?: string
  createdAt: string
}

// ── 구매자(소비자) ─────────────────────────────────────────

export interface Buyer {
  id: string
  name: string
  email: string
  password: string
  phone: string
  address: string
  createdAt: string
}

// ── ② 사이트 내 자체 판매 ──────────────────────────────────

export type ListingStatus = 'live' | 'paused' | 'soldout'

export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  live: '판매 중',
  paused: '판매 중지',
  soldout: '품절',
}

/** 농가가 영팜마켓에서 직접 파는 상품 */
export interface Listing {
  id: string
  farmId: string
  productId: string
  title: string              // 예: 아산 배 신고 5kg 선물세트
  unitLabel: string          // 예: 5kg / 1박스
  price: number              // 판매가
  stock: number
  description: string
  status: ListingStatus
  createdAt: string
}

export interface ShopOrderItem {
  listingId: string
  farmId: string
  title: string
  qty: number
  unitPrice: number
}

export type ShopOrderStatus = 'paid' | 'preparing' | 'shipped' | 'done' | 'canceled'

export const SHOP_ORDER_STATUS_LABEL: Record<ShopOrderStatus, string> = {
  paid: '결제 완료',
  preparing: '상품 준비 중',
  shipped: '배송 중',
  done: '배송 완료',
  canceled: '취소',
}

export interface ShopOrder {
  id: string
  buyerId: string
  items: ShopOrderItem[]
  goods: number              // 상품 합계
  shipping: number           // 배송비
  total: number
  platformFee: number        // 플랫폼이 가져가는 수수료(농가 부담)
  kind: 'single' | 'groupbuy' | 'subscription'
  status: ShopOrderStatus
  createdAt: string
}

// ── ③ 공동구매 ─────────────────────────────────────────────

export type GroupBuyStatus = 'open' | 'reached' | 'closed'

export const GROUPBUY_STATUS_LABEL: Record<GroupBuyStatus, string> = {
  open: '모집 중',
  reached: '목표 달성',
  closed: '마감',
}

export interface GroupBuy {
  id: string
  farmId: string
  productId: string
  title: string
  normalPrice: number        // 정상가
  groupPrice: number         // 공동구매가
  unitLabel: string
  kgPerUnit?: number         // 1구좌 = ? kg (목표를 kg으로 표기용)
  targetQty: number
  currentQty: number
  deadline: string
  status: GroupBuyStatus
  participants: { buyerId: string; qty: number; joinedAt: string }[]
  createdAt: string
}

// ── ④ 농산물 정기구독 (B2C) ────────────────────────────────

export type ProducePlan = 'monthly' | 'biweekly'

export const PRODUCE_PLAN_LABEL: Record<ProducePlan, string> = {
  monthly: '월 1회',
  biweekly: '2주 1회',
}

export type ProduceSubStatus = 'active' | 'paused' | 'canceled'

export const PRODUCE_SUB_STATUS_LABEL: Record<ProduceSubStatus, string> = {
  active: '구독 중',
  paused: '일시 정지',
  canceled: '해지',
}

/** 소비자가 특정 농가의 제철 농산물 박스를 정기 수령 */
export interface ProduceSub {
  id: string
  buyerId: string
  farmId: string
  boxName: string            // 예: 아산 햇살농원 제철 과일 박스
  plan: ProducePlan
  boxPrice: number
  status: ProduceSubStatus
  nextDelivery: string
  startedAt: string
}

// ── 앱 콘텐츠: 농장별 소식 / 서영왔서영 시리즈 ──────────────

/** 소식 탭 — 농가가 올리는 짧은 글/사진 소식 */
export interface FarmPost {
  id: string
  farmId: string
  body: string
  productId?: string
  createdAt: string
  likes: number
}

/** 산지 탭 — '서영왔서영' 오리지널 산지 방문 콘텐츠 시리즈 */
export interface SanjiEpisode {
  id: string
  epNo: number
  title: string              // 예: 본격적으로 아산 배 따는 서영
  host: string               // 예: 서영
  farmId: string
  productId: string
  summary: string
  views: number
  publishedAt: string
}
