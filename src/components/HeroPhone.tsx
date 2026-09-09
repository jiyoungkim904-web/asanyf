import { useState } from 'react'

/**
 * 랜딩 히어로의 "콘텐츠 미리보기" 핸드폰 목업.
 * 서영왔서영 산지 방문 컷(public/syoung.jpg)을 숏폼 미리보기로 보여주고,
 * 이미지 로드 실패 시 아래 OrchardScene 일러스트로 대체된다.
 */
function OrchardScene() {
  return (
    <svg viewBox="0 0 320 200" width="100%" height="100%" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe3c4" />
          <stop offset="100%" stopColor="#dd8a53" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8a5a3a" />
          <stop offset="100%" stopColor="#5f3c22" />
        </linearGradient>
      </defs>

      <rect width="320" height="200" fill="url(#sky)" />
      <path d="M0,158 Q160,138 320,160 L320,200 L0,200 Z" fill="url(#ground)" />

      {/* 나무 */}
      <rect x="234" y="86" width="14" height="82" rx="6" fill="#5c3a22" />
      <circle cx="252" cy="86" r="46" fill="#8a9a56" />
      <circle cx="212" cy="70" r="34" fill="#93a15c" />
      <circle cx="256" cy="52" r="30" fill="#7c8a4a" />
      <circle cx="228" cy="58" r="9" fill="#e8935c" />
      <circle cx="266" cy="78" r="8" fill="#c1592e" />
      <circle cx="244" cy="94" r="8" fill="#e8935c" />
      <circle cx="204" cy="86" r="7" fill="#c1592e" />

      {/* 사람 — 배를 따는 동작 */}
      <g>
        <ellipse cx="150" cy="176" rx="34" ry="7" fill="rgba(60,32,16,0.18)" />
        {/* 다리 */}
        <rect x="132" y="140" width="11" height="34" rx="5" fill="#4a2e1a" />
        <rect x="150" y="140" width="11" height="34" rx="5" fill="#3a2415" />
        {/* 치마/하의 */}
        <path d="M120,110 Q146,100 172,112 L168,144 Q146,152 124,144 Z" fill="#a8542e" />
        {/* 상의 */}
        <path d="M118,84 Q146,72 172,86 L170,116 Q146,128 120,116 Z" fill="#fbf1e2" />
        {/* 뻗은 팔 */}
        <path
          d="M160,90 Q182,72 202,60"
          stroke="#fbf1e2"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="204" cy="58" r="7" fill="#e7b78d" />
        {/* 반대쪽 팔 */}
        <path d="M126,92 Q112,104 110,118" stroke="#fbf1e2" strokeWidth="10" strokeLinecap="round" fill="none" />
        {/* 목 + 머리 */}
        <rect x="138" y="70" width="12" height="14" fill="#e7b78d" />
        <circle cx="144" cy="62" r="17" fill="#e7b78d" />
        <path
          d="M126,58 Q126,38 144,38 Q164,38 164,58 Q164,46 144,46 Q128,46 126,58 Z"
          fill="#2b2018"
        />
        <path d="M158,58 Q170,64 166,80 Q162,68 156,64 Z" fill="#2b2018" />
      </g>

      <text x="12" y="24" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.9)">
        산지 방문 촬영 장면 (예시)
      </text>
    </svg>
  )
}

export function HeroPhone() {
  const [imgOk, setImgOk] = useState(true)

  return (
    <div className="phone">
      <div className="phone-screen">
        <span className="phone-brand">📍 서영왔서영</span>
        <span className="phone-official">공식채널</span>

        <div className="phone-video">
          {imgOk ? (
            <img
              src="/syoung.jpg"
              alt="서영왔서영 — 아산 배 농가를 찾아간 서영"
              style={{ objectPosition: 'center 24%' }}
              onError={() => setImgOk(false)}
            />
          ) : (
            <OrchardScene />
          )}
          <span className="phone-play" aria-hidden />
          <span className="phone-dur">0:15</span>
        </div>

        <div className="phone-cap">
          <span className="phone-tag">AI 생성 · SNS 숏폼</span>
          <b>본격적으로 아산 배 따는 서영</b>
          <span className="phone-hash">#영팜마켓 #아산배 #친환경 #농가직송</span>
        </div>
      </div>
    </div>
  )
}
