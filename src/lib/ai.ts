// ─────────────────────────────────────────────────────────────
// AI 콘텐츠 생성 레이어
//
// 현재는 목(mock) 구현이지만, 실제 AI API가 준비되면
// 아래 AIProvider 인터페이스만 동일하게 구현해 교체하면 된다.
//   예)  export const aiProvider: AIProvider = new RealApiProvider(apiKey)
//
// 흐름:  농산물 데이터 → generateDetailPage(상세페이지 초안)
//        → 농가 확인·수정 → generateScript(상세페이지 기반 숏폼 스크립트)
// ─────────────────────────────────────────────────────────────

import type { Content, ContentLength, DetailPage, FarmProduct, NarrationVoice } from './types'
import { CULTIVATION_LABEL } from './types'

// 실제 영상 조립에 쓸 TTS 내레이션 보이스 (mock 목록 — 실 연동 시 TTS 벤더 보이스 id로 교체)
const VOICES: NarrationVoice[] = [
  { id: 'v_warm_f', name: '따뜻한 여성 내레이션', style: '차분하고 다정한 톤' },
  { id: 'v_bright_f', name: '밝은 여성 내레이션', style: '경쾌하고 또렷한 톤' },
  { id: 'v_calm_m', name: '차분한 남성 내레이션', style: '신뢰감 있는 저음 톤' },
]
function pickVoice(seed: string): NarrationVoice {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return VOICES[h % VOICES.length]
}
// 나레이션 문장을 화면 자막용으로 축약 (오토 캡션)
function toCaption(text: string, max = 16) {
  const t = text.replace(/["“”.]/g, '').trim()
  return t.length <= max ? t : t.slice(0, max) + '…'
}

export type GeneratedScript = Content['script']
export type GeneratedDetail = Omit<
  DetailPage,
  'id' | 'farmId' | 'productId' | 'status' | 'createdAt' | 'updatedAt'
>

export interface GenerateScriptInput {
  product: FarmProduct
  length: ContentLength
  detail?: DetailPage       // 있으면 상세페이지를 토대로 스크립트 작성
}

export interface AIProvider {
  /** 농산물 데이터로부터 판매 상세페이지 초안을 생성한다. */
  generateDetailPage(input: { product: FarmProduct }): Promise<GeneratedDetail>
  /** (상세페이지가 있으면 그것을) 토대로 숏폼 영상 스크립트 초안을 생성한다. */
  generateScript(input: GenerateScriptInput): Promise<{ title: string; script: GeneratedScript }>
  /** 스크립트로부터 영상 파일(URL)을 렌더링한다. 목 구현은 플레이스홀더를 반환. */
  renderVideo(input: { script: GeneratedScript; product: FarmProduct }): Promise<{ videoUrl: string | null }>
}

// ── 목 구현 ───────────────────────────────────────────────────

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const firstSentence = (text: string, fallback: string) =>
  text.split(/[.\n]/).map((s) => s.trim()).filter(Boolean)[0] || fallback

class MockAIProvider implements AIProvider {
  async generateDetailPage({ product: p }: { product: FarmProduct }): Promise<GeneratedDetail> {
    await delay(900)
    const method = CULTIVATION_LABEL[p.method]
    const place = p.region || '우리 지역'
    const story1 = firstSentence(p.story, `${place}에서 정성껏 농사짓고 있습니다`)
    const years = p.farmingYears || Number((p.story.match(/(\d+)\s*년/) || [])[1]) || 0
    const certs = p.certifications ?? []
    const when = p.harvestPeriod || p.harvestSeason

    // 입력값 기반으로 셀링포인트(highlights) 구성 — 채워진 것 위주로 최대 4개
    const hi: GeneratedDetail['highlights'] = []
    if (p.sellingPoint) hi.push({ icon: '⭐', title: '우리만의 강점', desc: `${p.sellingPoint}.` })
    if (certs.length) hi.push({ icon: '✅', title: certs.join(' · '), desc: `공인 인증을 받아 재배·관리합니다.` })
    if (p.care) hi.push({ icon: '🤲', title: '이렇게 정성 들입니다', desc: `${p.care}.` })
    if (p.sweetness) hi.push({ icon: '🍯', title: p.sweetness, desc: `측정 기준을 넘는 것만 선별해 출하합니다.` })
    hi.push({
      icon: '📍',
      title: `${place} 산지 직송`,
      desc: years
        ? `${years}년 경력 농가가 직접 재배해 ${p.shipMethod || '주문 후 산지에서 바로 포장해'} 보내드립니다.`
        : `${p.shipMethod || '주문 후 산지에서 바로 포장해'} 신선하게 보내드립니다.`,
    })
    if (hi.length < 4) hi.push({ icon: '🌱', title: `${method} 재배`, desc: `농약을 최소화한 ${method} 방식으로 키웠습니다.` })
    if (hi.length < 4) hi.push({ icon: '📅', title: `${when} 수확`, desc: `가장 맛이 오른 시기에 수확해 출하합니다.` })

    const specs = [
      { k: '품목', v: p.name },
      { k: '품종', v: p.variety || '-' },
      p.grade ? { k: '등급·규격', v: p.grade } : null,
      { k: '산지', v: place },
      { k: '재배방식', v: method },
      certs.length ? { k: '인증', v: certs.join(', ') } : null,
      years ? { k: '재배 경력', v: `${years}년` } : null,
      p.sweetness ? { k: '당도·특징', v: p.sweetness } : null,
      { k: '수확시기', v: when },
      p.packUnit ? { k: '포장 단위', v: p.packUnit } : null,
      p.priceRange ? { k: '판매가', v: p.priceRange } : null,
    ].filter(Boolean) as { k: string; v: string }[]

    const faq: GeneratedDetail['faq'] = [
      {
        q: '언제 발송되나요?',
        a: p.shipMethod
          ? `${p.shipMethod} 방식으로 보내드립니다. (주말·공휴일 제외)`
          : '결제 확인 후 1~2일 내 산지에서 바로 포장해 발송합니다.',
      },
    ]
    if (p.priceRange) faq.push({ q: '가격이 어떻게 되나요?', a: `${p.priceRange}입니다. (물량·시세에 따라 변동될 수 있어요)` })
    faq.push({
      q: '선물용 포장이 가능한가요?',
      a: p.giftWrap ? '가능합니다. 주문 시 요청사항에 남겨주세요.' : '현재는 기본 포장으로만 발송됩니다.',
    })
    faq.push({
      q: '교환·환불은 어떻게 하나요?',
      a: '신선식품 특성상 단순 변심 교환은 어렵고, 상품 하자 시 사진과 함께 연락 주시면 재발송해 드립니다.',
    })

    return {
      badge: [when + ' 제철', method, certs[0]].filter(Boolean).join(' · '),
      headline: p.sellingPoint
        ? p.sellingPoint.length <= 28
          ? p.sellingPoint
          : `${place}에서 ${method}으로 키운 ${p.name}`
        : `${place}에서 ${method}으로 키운 ${p.name}`,
      subheadline: [story1 + '.', p.grade ? `${p.grade} 등급으로 선별했습니다.` : '']
        .filter(Boolean)
        .join(' '),
      highlights: hi.slice(0, 4),
      story: [p.story.trim(), p.care && !p.story.includes(p.care) ? `재배할 때는 ${p.care}에 특히 신경 씁니다.` : '']
        .filter(Boolean)
        .join('\n') || `${place}에서 ${p.name} 농사를 짓고 있습니다.`,
      specs,
      howto:
        (p.storageTip ? `${p.storageTip}. ` : '직사광선을 피해 서늘한 곳에 보관하세요. ') +
        '드시기 30분 전 실온에 두면 향이 살아납니다.',
      faq,
      closing: `${place} ${p.name}, 지금 가장 맛있을 때 보내드립니다.`,
    }
  }

  async generateScript({ product, length, detail }: GenerateScriptInput) {
    await delay(600)
    const method = CULTIVATION_LABEL[product.method]
    const place = product.region || '우리 지역'
    const is15 = length === '15s'

    // 상세페이지가 있으면 그 문구를 재료로 사용
    const headline = detail?.headline || product.sellingPoint || `${place}에서 자란 ${product.name}`
    const hookLine =
      detail?.subheadline ||
      product.sellingPoint ||
      firstSentence(product.story, `${place}에서 정성껏 농사짓고 있습니다`) + '.'
    const h = detail?.highlights ?? []
    const storyLine = firstSentence(
      detail?.story ?? product.care ?? product.story,
      `${place}에서 정성껏 농사짓고 있습니다`,
    )
    const proof =
      product.sweetness ||
      (product.farmingYears ? `${product.farmingYears}년째 이 농사만 지어왔습니다` : '') ||
      (product.certifications?.length ? `${product.certifications[0]}을 받았습니다` : '') ||
      `${product.harvestSeason}에 가장 맛이 오릅니다`
    const closing = detail?.closing || `${product.name}, 지금 우리 농가에서 만나보세요.`

    const title = detail
      ? detail.headline.length > 22
        ? `${place} ${product.name} 이야기`
        : detail.headline
      : headline

    const scenes = is15
      ? [
          {
            time: '0–3초',
            visual: `${product.name} 클로즈업 — 이슬 맺힌 표면, 자연광`,
            narration: `${place} ${product.name}, 지금 가장 맛있을 때예요.`,
          },
          {
            time: '3–9초',
            visual: h[0] ? `${h[0].title} 를 보여주는 장면 — 밭·수확 컷` : `사장님이 밭에서 ${product.name}을 수확하는 모습`,
            narration: `${h[0]?.desc ? firstSentence(h[0].desc, storyLine) + '.' : storyLine + '.'}`,
          },
          {
            time: '9–15초',
            visual: `포장된 ${product.name} ${product.packUnit || '박스'} + 구매 안내 자막`,
            narration: `${proof}. ${closing}`,
          },
        ]
      : [
          {
            time: '0–4초',
            visual: `해 뜨는 ${place} 밭 전경에서 ${product.name}으로 줌인`,
            narration: `${place}의 아침, ${product.name} 밭입니다.`,
          },
          {
            time: '4–12초',
            visual: h[0] ? `${h[0].title} — 재배 과정 컷` : `사장님 인터뷰 + 재배 과정`,
            narration: `${hookLine} ${product.variety || product.name} 품종을 ${method} 방식으로 키웁니다.`,
          },
          {
            time: '12–22초',
            visual: h[1] ? `${h[1].title} 장면` : `${product.name} 단면 — 과즙·속살 클로즈업`,
            narration: `${h[1]?.desc ? firstSentence(h[1].desc, storyLine) + '.' : `${product.harvestSeason}에 수확해 가장 좋은 상태로 보내드려요.`}`,
          },
          {
            time: '22–30초',
            visual: `포장·발송 장면 + 농가명/주문 방법 자막`,
            narration: `${closing}`,
          },
        ]

    const caption =
      (detail
        ? `${detail.headline}\n${detail.subheadline}\n`
        : `${place}에서 ${method}으로 키운 ${product.name}입니다.\n${storyLine}.\n`) +
      [
        product.certifications?.[0],
        proof,
        `${product.harvestPeriod || product.harvestSeason} 수확`,
        product.packUnit,
        product.priceRange,
        '농가 직송',
      ]
        .filter(Boolean)
        .join(' / ') +
      `\n주문은 프로필 링크로 📩`

    // 각 장면에 농가가 올린 실제 사진을 순서대로 배정하고, 나레이션을 축약해 화면 자막(오토 캡션)으로 얹는다.
    const photoCount = product.photos.length
    const scenesWithAssets = scenes.map((s, i) => ({
      ...s,
      caption: toCaption(s.narration),
      photoIndex: photoCount ? i % photoCount : undefined,
    }))

    const script: GeneratedScript = {
      hook: is15
        ? `${place} ${product.name}, 딱 지금이 제철입니다 🍽️`
        : `20초만 투자하세요 — ${place} ${product.name} 이야기`,
      scenes: scenesWithAssets,
      caption,
      hashtags: [
        '#영팜마켓',
        `#${place.replace(/\s/g, '')}${product.name.replace(/\s/g, '')}`,
        `#${method}`,
        '#농가직송',
        '#제철농산물',
        '#로컬푸드',
      ],
      voice: pickVoice(product.id),
    }
    return { title, script }
  }

  async renderVideo() {
    await delay(400)
    return { videoUrl: null }
  }
}

export const aiProvider: AIProvider = new MockAIProvider()
