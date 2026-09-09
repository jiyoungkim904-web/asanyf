// 농산물 플랫 일러스트 (SVG data URI) — 사진이 없을 때 표시.
// 외부 이미지 없이 오프라인에서 즉시 렌더된다.

const S = 'stroke="#3d473f" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"'

function svg(tint: string, body: string) {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${tint}"/>${body}</svg>`
  return `data:image/svg+xml,${encodeURIComponent(raw)}`
}

const leaf = (x: number, y: number, rot = -20) =>
  `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 C10 -10 24 -8 26 2 C16 12 2 10 0 0 Z" fill="#5aa079" ${S}/></g>`

const ART: Record<string, string> = {
  배: svg(
    '#f8f0e2',
    `${leaf(62, 30, 18)}<path d="M60 30 q1 -8 5 -12" fill="none" stroke="#7a5230" stroke-width="4.5" stroke-linecap="round"/>
     <path d="M60 32 C51 32 46 40 48 50 C41 58 39 74 47 88 C54 100 66 100 73 88 C81 74 79 58 72 50 C74 40 69 32 60 32 Z" fill="#cdd45f" ${S}/>
     <ellipse cx="52" cy="58" rx="4" ry="9" fill="#ffffff" opacity="0.4"/>`,
  ),
  사과: svg(
    '#faeee5',
    `${leaf(62, 26, 15)}<path d="M60 30 q0 -9 4 -13" fill="none" stroke="#7a5230" stroke-width="4.5" stroke-linecap="round"/>
     <path d="M60 34 C54 26 40 28 38 44 C36 60 44 92 60 92 C76 92 84 60 82 44 C80 28 66 26 60 34 Z" fill="#d94f4a" ${S}/>
     <ellipse cx="50" cy="50" rx="5" ry="11" fill="#ffffff" opacity="0.35"/>`,
  ),
  포도: svg(
    '#f8f0e2',
    `${leaf(58, 22, 8)}<path d="M60 24 v10" stroke="#7a5230" stroke-width="4" stroke-linecap="round"/>
     ${[
       [60, 40],
       [49, 48],
       [71, 48],
       [55, 60],
       [65, 60],
       [60, 74],
       [48, 66],
       [72, 66],
     ]
       .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#a8c05a" ${S}/>`)
       .join('')}`,
  ),
  샤인머스캣: null as unknown as string, // alias set below
  토마토: svg(
    '#faeee5',
    `<circle cx="60" cy="66" r="30" fill="#e5533b" ${S}/>
     <path d="M60 40 l6 -12 M60 40 l-6 -12 M60 40 l0 -14 M60 40 l13 -6 M60 40 l-13 -6" stroke="#4c9a5d" stroke-width="6" stroke-linecap="round"/>
     <circle cx="60" cy="40" r="5" fill="#4c9a5d"/>
     <ellipse cx="50" cy="58" rx="6" ry="12" fill="#ffffff" opacity="0.3"/>`,
  ),
  오이: svg(
    '#f8f0e2',
    `<g transform="rotate(-24 60 60)"><rect x="47" y="26" width="26" height="68" rx="13" fill="#4f9a4a" ${S}/>
     ${[36, 48, 60, 72, 84].map((y) => `<circle cx="${55 + (y % 24 === 0 ? 8 : -6)}" cy="${y}" r="1.8" fill="#2f6b3d"/>`).join('')}
     <rect x="47" y="26" width="26" height="10" rx="5" fill="#cfe0a8"/></g>`,
  ),
  고구마: svg(
    '#f6ece2',
    `<g transform="rotate(28 60 60)"><ellipse cx="60" cy="60" rx="17" ry="34" fill="#9a5f86" ${S}/>
     <path d="M60 26 q-3 -6 -8 -8 M60 94 q3 6 9 7" stroke="#7a4a68" stroke-width="3" fill="none" stroke-linecap="round"/>
     <ellipse cx="53" cy="52" rx="4" ry="12" fill="#ffffff" opacity="0.25"/></g>`,
  ),
  쌀: svg(
    '#f8f0e2',
    `<path d="M34 62 h52 a26 26 0 0 1 -52 0 Z" fill="#a5643a" ${S}/>
     <path d="M36 62 a24 12 0 0 1 48 0 Z" fill="#ffffff" ${S}/>
     ${[[48, 56], [60, 53], [72, 56], [54, 60], [66, 60]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="#f1e7d6"/>`).join('')}
     <path d="M52 44 q4 -12 0 -20 M60 42 q0 -14 0 -22 M68 44 q-4 -12 0 -20" stroke="#ddd0bb" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  ),
  햅쌀: null as unknown as string,
}
ART.샤인머스캣 = ART.포도
ART.햅쌀 = ART.쌀

const DEFAULT = svg(
  '#f8f0e2',
  `<path d="M60 96 V52" stroke="#5aa079" stroke-width="5" stroke-linecap="round"/>
   ${leaf(60, 52, -35)}${leaf(60, 62, 145)}${leaf(60, 40, -20)}`,
)

export function produceArt(name: string): string {
  for (const key of Object.keys(ART)) {
    if (ART[key] && name.includes(key)) return ART[key]
  }
  return DEFAULT
}

/** 사진이 있으면 사진, 없으면 일러스트 */
export function produceImage(name: string, photos?: string[]): string {
  return photos && photos[0] ? photos[0] : produceArt(name)
}
