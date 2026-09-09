# CLAUDE.md — 영팜마켓AI

이 파일은 이 저장소에서 작업하는 Claude(및 사람)를 위한 안내서입니다. **모든 문서는 한국어 기준**으로 작성합니다.

## 프로젝트 개요

전국 농가가 농산물 데이터를 입력하면 AI가 상세페이지·SNS 숏폼 콘텐츠를 만들고, 운영자 검수를 거쳐
농가가 완성본을 받아 온라인 판매·공동구매까지 연결하는 **농업 특화 생성형 AI 커머스 플랫폼** 프로토타입.
피치/데모용으로, 실제 서버 없이 브라우저에서 동작합니다.

- 채널명은 항상 **"서영왔서영"** (오타 아님 — "산지왔서영" 등으로 절대 바꾸지 말 것).
- 색상은 **가을 톤(주황·흰색·브라운)**. 강조 문구 "농업 특화 생성형 AI 커머스 플랫폼"은 주황색.

## 기술 스택

- Vite 5 + React 18 + TypeScript(strict) + react-router-dom 6. CSS 프레임워크 없음.
- 디자인 시스템은 `src/index.css` 한 파일 + CSS 커스텀 프로퍼티(`:root` 토큰, `--brand-*` / `--amber-*`).
- 상태 저장은 `localStorage` 목(mock) DB (`src/lib/db.ts`, 네임스페이스 `youngfarm.vN`).
- UI는 `src/lib/api.ts`(목 API)만 호출 — 실제 서버 연결 시 이 모듈 내부만 교체.

## 실행 / 검증

```bash
npm install
npm run dev        # http://localhost:3047  (vite.config.ts: strictPort)
npm run build      # tsc --noEmit + vite build

npx tsx scripts/smoke.tsx   # 전 페이지 SSR 렌더
npx tsx scripts/mount.tsx   # 실제 클라이언트 마운트 + 콘솔 에러 0 확인 (라우트별)
npx tsx scripts/flow.tsx    # api.ts 레벨 시나리오(권한 분리 + BM 5종)
```

**코드/스키마/라우트/문구를 바꾸면 위 3개 스크립트를 반드시 같이 업데이트하고 통과시킬 것.**

## 페르소나 · 주요 라우트

- **농가**: `/dashboard` `/products/*` `/content/request` `/contents/*` `/billing` `/store`
- **구매자(앱)**: `/shop` 이하 — `AppLayout`(모바일/데스크톱 자동 전환, 880px)
- **운영자**: `/admin/*` — 로그인, 대시보드, 콘텐츠 검수, 커머스/매출, `/admin/account`(내 계정), `/admin/studio`(AI 영상 생성)
- **AI 영상 생성 스튜디오**: `/admin/studio` (운영자 헤더 "영상 생성") = `/studio/video` (공개) — 같은 화면, 아래 참고

## 수익모델(BM) — 5가지

`src/lib/billing.ts` 한 곳에서 요율·단가 관리, 화면엔 "예시" 표기.
① AI 콘텐츠 SaaS 구독 · ② 자체 판매 수수료 · ③ 공동구매 수수료 · ④ 농산물 정기구독(B2C) · ⑤ 건별 부가서비스.
(지자체/B2G 사업 아님 — 관련 코드/문구 넣지 말 것.)

## AI 영상 파이프라인

### 데모용 (기본) — 템플릿 조립
`src/lib/ai.ts`의 `MockAIProvider`. 상세페이지·농산물 데이터 → 스크립트(씬) 생성 → 각 씬에 농가 실제
사진 배정 + 자동 자막 + TTS 보이스 선택 → 템플릿 조립(`Content.assemblyMode: 'template'`).
`components/ScriptScenes.tsx`가 씬별 사진·자막·보이스를 보여줌. 완전 생성형 영상은 "프리미엄, 준비 중".

### 실제 생성 — OpenRouter 비디오 API (`/studio/video`)
- `src/lib/openrouter.ts` — `POST /api/v1/videos`(제출) → `GET /api/v1/videos/{id}`(폴링) →
  `GET .../content?index=0`(mp4 다운로드, Authorization 필요) / `GET /api/v1/videos/models`(모델+가격).
- 텍스트 프롬프트 + 이미지(시작/끝 프레임, `frame_images[]`에 `data:image/...;base64` 로 전달).
- 모델은 `/videos/models` 응답에서 목록·가격(`pricing_skus`)을 받아 선택. 예상 비용 표시.
- 결과는 Blob → `<video>` 재생 + `<a download>` 다운로드.
- **영구 보관**: 생성 즉시 `src/lib/videoStore.ts`(IndexedDB `youngfarm-videos`)에 저장 → 새로고침해도
  "내가 만든 영상" 목록에 남음. (브라우저 로컬 저장, 기기 간 공유 안 됨 — 프로토타입 한정)
- **상세페이지 첨부**: `DetailPage.videos: DetailVideo[]`(`assetId` = videoStore id).
  `api.attachDetailVideo(productId, video)` / `detachDetailVideo` / `listDetailPages`.
  `components/DetailPageView.tsx`가 "영상으로 보기" 섹션으로 렌더(편집기·스토어 공용),
  `components/DetailVideoPlayer.tsx`가 IndexedDB에서 blob 로드. 편집기에서만 "첨부 제거" 노출.

**API 키 보안 (`src/lib/secureKey.ts`)**
- 사용자가 브라우저에서 직접 입력. 서버로 보내지 않음.
- 저장(at-rest): 패스프레이즈 → PBKDF2(SHA-256, 210k) → AES-GCM 256으로 암호화해 localStorage.
  평문 키는 디스크에 저장하지 않음. 새로고침하면 패스프레이즈로 잠금 해제.
- 전송(in-transit): 평문 키는 오직 `https://openrouter.ai`로만, HTTPS(TLS) 위에서 전송.
- 잠금 해제된 키는 React state(메모리)에만 존재. "키 잠그기 / 키 삭제" 제공.
- 브라우저 직접 호출이므로 CORS/네트워크 차단 시 안내 메시지 노출(`corsHint`). 배포 시 얇은 프록시가
  필요할 수 있음 — 그 경우에도 키 취급 원칙(암호화 저장, OpenRouter로만 전송)은 유지.

## 코딩 규칙

- 주석은 "왜"가 비자명할 때만. 무엇을 하는지는 이름으로.
- PRD 미확정 값(영상 길이, 구독료 등)을 정책으로 확정하지 말 것 — "예시/임시" 표기.
- 새 파일보다 기존 파일 수정 우선. 불필요한 추상화·미래 대비 코드 금지.

## 커밋

- 커밋 메시지 끝에: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- PR 설명 끝에: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- 사용자가 명시적으로 요청할 때만 커밋.
