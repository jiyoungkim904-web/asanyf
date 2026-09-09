import type { Content, FarmProduct } from '../lib/types'
import { produceImage } from './ui'

/**
 * AI가 만든 스크립트를 "실제 조립 방식"으로 보여준다:
 * 각 장면에 농가가 올린 실제 사진을 매칭하고, 화면 자막(오토 캡션)·TTS 내레이션 음성을 함께 표시한다.
 * v1은 완전 생성형 영상이 아니라 이 스크립트+사진을 템플릿으로 조립하는 방식.
 */
export function ScriptScenes({ script, product }: { script: Content['script']; product?: FarmProduct }) {
  return (
    <div className="script-box">
      <div className="assembly-bar">
        <span className="assembly-chip">🧩 농가 실제 사진 템플릿 조립</span>
        {script.voice && <span className="assembly-chip">🔊 TTS: {script.voice.name}</span>}
        <span className="assembly-chip">💬 자동 자막</span>
      </div>
      <p style={{ fontWeight: 700, color: 'var(--brand-800)' }}>“{script.hook}”</p>
      <div style={{ marginTop: 8 }}>
        {script.scenes.map((s, i) => {
          const photo =
            product && s.photoIndex !== undefined ? product.photos[s.photoIndex] : undefined
          return (
            <div className="script-scene" key={i}>
              <div>
                <span className="st">{s.time}</span>
                <div className="scene-thumb">
                  <img src={produceImage(product?.name ?? '농산물', photo ? [photo] : undefined)} alt="" />
                </div>
              </div>
              <div>
                <div className="sv">{s.visual}</div>
                <div className="sn">“{s.narration}”</div>
                {s.caption && <span className="cap-chip">자막 “{s.caption}”</span>}
              </div>
            </div>
          )
        })}
      </div>
      <div className="divider" style={{ margin: '14px 0' }} />
      <b style={{ fontSize: 14 }}>SNS 게시글 문구</b>
      <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, marginTop: 4 }}>{script.caption}</p>
      <div style={{ marginTop: 10 }}>
        {script.hashtags.map((h) => (
          <span className="hashtag" key={h}>
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}
