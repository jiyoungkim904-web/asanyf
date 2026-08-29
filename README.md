# 영팜마켓AI — 웹서비스 프로토타입 (v1)

> 전국 농가가 농산물 정보를 입력하면 AI가 SNS·판매 페이지용 영상 콘텐츠 초안을 만들고,
> 운영자 검수를 거쳐 농가가 완성 콘텐츠를 다운로드·판매 연결하는 콘텐츠 제작·유통 플랫폼.


**핵심 흐름:** 농가 데이터 입력 → AI 콘텐츠 제작 → 운영자 검수 → 농가 다운로드

## 실행 방법

```bash
npm install
npm run dev      # http://localhost:5173
```

빌드: `npm run build` / 미리보기: `npm run preview`

## 데모 계정

| 구분 | 아이디 | 비밀번호 |
| --- | --- | --- |
| 농가 | `sunfarm@example.com` | `test1234` |
| 운영자 | `admin@youngfarm.ai` | `admin1234` |

로그인 화면의 **자동 입력** 버튼으로도 채울 수 있습니다.
상단 배너의 **데모 데이터 초기화**로 언제든 처음 상태로 되돌립니다.

## 테스트 시나리오

### 농가
랜딩(`/`) → 회원가입(`/signup`) → 농산물 등록(6단계: 기본정보·재배정보·농가이야기·판매배송·사진·확인 — 등급·인증·재배경력·당도·가격대·배송·보관법 등 구조화 입력)
→ **AI 상세페이지 생성·확인·확정**(`/products/:id/detail`) — 원본 데이터를 판매용 페이지로 정리
→ 상세페이지를 토대로 AI 숏폼 영상 요청(`/content/request`, 약 18초 자동 진행)
→ 검수 대기 → (운영자 승인 후) 콘텐츠 상세(`/contents/:id`) → 영상 다운로드
※ 확정된 상세페이지는 스토어 상품 상세(`/shop/product/:id`)에도 그대로 노출됨

### 운영자
운영자 로그인(`/admin/login`) → 대시보드(`/admin`) → 농가 목록 → 농가 상세(`/admin/farms/:id`)
→ 콘텐츠 요청(`/admin/contents`) → AI 생성 결과 검수(`/admin/contents/:id`) → 승인/반려

검증 스크립트:

```bash
npx tsx scripts/smoke.tsx   # 전체 페이지 렌더 확인
npx tsx scripts/flow.tsx    # 데이터 흐름·권한 분리 시나리오
```

## 페르소나 — 3가지

- **농가**: 로그인 `/dashboard`. AI 콘텐츠 제작 + 판매 관리(`/store`). (데스크톱 웹 UI)
- **구매자(소비자)**: `/shop` — **모바일 앱 형태**의 셸(`AppLayout`). 하단 탭바 `홈 / 소식 / 콘텐츠 / 공구 / 산지`. 로그인 `/shop/login`.
- **운영자**: 로그인 `/admin/login`. 콘텐츠 검수 + 커머스·매출 모니터링.

### 메인 앱 (`/shop`, AppLayout) — 발표자료 slide 9 기준

폰 프레임 셸(상태바 · FARM MARKET AI 헤더 · 검색 · 하단 탭바).

| 탭 | 경로 | 내용 |
|---|---|---|
| 홈 | `/shop` | 히어로 캐러셀(오늘의 산지) · 퀵메뉴(농장별 소싱/AI 숏폼 제작/공동구매/산지왔서영) · 추천 농산물·공구·숏폼 레일 |
| 소싱 | `/shop/sourcing` | **B2B 산지 도매 카탈로그** — 지역·품목·가격·수확시기 필터, 가격/수확일/최소주문/재고, [문의][소싱] (수수료 3~7%) |
| 콘텐츠 | `/shop/studio` | **AI 콘텐츠 스튜디오** — 이미지/영상/숏츠/릴 · 미리보기 · 구독 플랜(기본형 99,000 / 고급형 199,000) · [콘텐츠 생성하기] |
| 공구 | `/shop/groupbuy` | 공동구매 목록 → 상세(참여 인원·실시간 카운트다운·목표 kg·%·참여) + 산지왔서영 + 인사이트(시세분석·성과·업로드 일정·정산) |
| 마이 | `/shop/mypage` | 소싱 내역 · 정기구독 · 주문 내역 |
| — | `/shop/search` `/shop/product/:id` `/cart` `/shop/subscribe` `/shop/sanji` `/shop/reels` | 검색·상품상세·장바구니·정기구독·산지왔서영·숏폼 |

## 수익모델 (발표자료 slide 10)

| 라인 | 요율 (예시) | 정책값 |
|---|---|---|
| 유통 소싱 수수료 | 거래액 3~7% | `SOURCING_FEE_RATE` |
| AI 콘텐츠 SaaS 구독 | 기본형 99,000 / 고급형 199,000 | `PLANS` |
| 공동구매·라이브커머스 수수료 | 판매액 5~15% | `COMMERCE_FEE_RATE` |
| PB·브랜드 / 정기구독 | 마진 15~35% / 수수료 10% | `PB_MARGIN_RATE`, `SUBSCRIPTION_FEE_RATE` |
| 건별 부가서비스 | 촬영·편집 건별 | `ORDER_PRICE` |

## 수익모델(BM) — 5가지

**① AI 콘텐츠 제작이 메인.** 콘텐츠 요청 시 이용권 자동 판정: **콘텐츠 구독 잔여 → 없으면 건별 결제**.

| BM | 농가 화면 | 구매자 화면 | 관리자 화면 | 정책값 (`src/lib/billing.ts`) |
|---|---|---|---|---|
| ① AI 콘텐츠 제작 구독 | `/pricing` `/billing` | — | `/admin/revenue` | `PLANS`, `PAYG_CONTENT_PRICE` |
| ② 사이트 내 자체 판매 | `/store` 상품 등록 | `/shop` → `/cart` → 결제 | `/admin/commerce` | `COMMERCE_FEE_RATE`, `SHIPPING_FEE` |
| ③ 공동구매 | `/store` 공구 열기 | `/shop/groupbuy` 참여 | `/admin/commerce` | `GROUPBUY_DEFAULT_*` |
| ④ 농산물 정기구독(B2C) | `/store` 구독자 관리 | `/shop/subscribe` 신청 | `/admin/commerce` | `PRODUCE_BOX_PRICE`, `SUBSCRIPTION_FEE_RATE` |
| ⑤ 건별 부가서비스 | `/billing` 주문 | — | `/admin/revenue` | `ORDER_PRICE` |

> **"AI 콘텐츠 제작 구독"(농가)** 과 **"농산물 정기구독"(소비자)** 은 완전히 별개입니다.

모든 금액·수수료율은 미확정이라 화면에 **"예시"**로 표기하며 `src/lib/billing.ts` 한 곳에서 바꿉니다. 결제는 전부 mock(`PayModal`). 데모 구매자 계정: `buyer@example.com` / `test1234`.

## 구조

```
src/
  lib/
    types.ts     데이터 모델 (farms / farm_products / content_requests / contents)
    db.ts        localStorage 저장소 + 데모 데이터 시드
    api.ts       Mock API — 화면은 이 모듈만 호출. 실제 서버 연결 시 내부만 교체
    ai.ts        AIProvider 인터페이스 + Mock 구현 (★ 실제 영상 생성 API 교체 지점)
    billing.ts   ★ BM 정책값 한 곳 (요금제/수수료율/건별 단가) — 전부 '예시/임시'
    auth.tsx     농가/운영자 세션
  components/     디자인 시스템 (Button/Card/Badge/Field/Steps/StatusBadge/VideoThumb ...)
  pages/         화면별 컴포넌트 (agile 라우팅은 App.tsx)
```

### AI 연동 교체 지점

`src/lib/ai.ts` 의 `AIProvider` 인터페이스만 동일하게 구현해 `aiProvider` 를 교체하면
나머지 코드 수정 없이 실제 영상 생성 API로 전환됩니다.

```ts
export const aiProvider: AIProvider = new RealVideoApiProvider(import.meta.env.VITE_XXX)
```

## PRD 미확정 항목 처리 (임의 확정하지 않음)

| 항목 | 프로토타입 처리 |
| --- | --- |
| 영상 길이(15/30초) | `content/request`에서 **"임시 옵션"** 배지 + 안내문구. `types.ts`의 `ContentLength`만 바꾸면 반영 |
| 구독료 / 생성 횟수 제한 | 미구현 (화면·문구에 등장시키지 않음) |
| 저작권·2차 사용 범위 | 가입 약관 문구로만 안내 |
| 입력 필드 구성 | 필수 최소 세트(품목·품종·지역·재배방식·수확시기·이야기·사진)만 |
| 검수 소요시간 | 시간 표기 없이 상태(검수 중/완료)로만 표현 |
```
