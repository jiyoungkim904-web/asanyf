import { useState } from 'react'

/**
 * 랜딩 히어로의 "콘텐츠 미리보기" 핸드폰 목업.
 * public/hero-preview.jpg 가 있으면 그 이미지를 숏폼 미리보기로 보여주고,
 * 없으면 자연 배경 + 이모지 플레이스홀더로 대체된다.
 */
export function HeroPhone() {
  const [imgOk, setImgOk] = useState(true)

  return (
    <div className="phone">
      <div className="phone-screen">
        <span className="phone-brand">📍 산지왔서영</span>
        <span className="phone-official">공식채널</span>

        <div className="phone-video">
          {imgOk ? (
            <img
              src="/hero-preview.jpg"
              alt="AI가 만든 아산 배 농가 숏폼 영상 미리보기"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="phone-video-ph">🍐</div>
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
