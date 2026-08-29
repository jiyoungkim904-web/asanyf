import type { DetailPage } from '../lib/types'
import { Art } from './ui'

/** 확정된 AI 상세페이지를 실제 상품 상세처럼 렌더 (편집기 미리보기 · 스토어 공용) */
export function DetailPageView({ dp, photo, productName }: { dp: DetailPage; photo?: string; productName?: string }) {
  return (
    <div className="dp">
      <div className="dp-hero">
        <span className="dp-badge">{dp.badge}</span>
        <h2>{dp.headline}</h2>
        <p>{dp.subheadline}</p>
      </div>

      <div style={{ aspectRatio: '16 / 10', position: 'relative', overflow: 'hidden', background: 'var(--green-50)' }}>
        <Art name={productName ?? dp.headline} photos={photo ? [photo] : undefined} />
      </div>

      {dp.highlights.length > 0 && (
        <div className="dp-section">
          <h3>이 상품의 특징</h3>
          <div className="dp-highlights">
            {dp.highlights.map((h, i) => (
              <div className="dp-highlight" key={i}>
                <span className="h-ico">{h.icon}</span>
                <b>{h.title}</b>
                <span>{h.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {dp.story && (
        <div className="dp-section">
          <h3>농가 이야기</h3>
          <p className="dp-story">{dp.story}</p>
        </div>
      )}

      {dp.specs.length > 0 && (
        <div className="dp-section">
          <h3>상품 정보</h3>
          <table className="dp-specs">
            <tbody>
              {dp.specs.map((s, i) => (
                <tr key={i}>
                  <td>{s.k}</td>
                  <td>{s.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dp.howto && (
        <div className="dp-section">
          <h3>보관·섭취 방법</h3>
          <p className="dp-story">{dp.howto}</p>
        </div>
      )}

      {dp.faq.length > 0 && (
        <div className="dp-section">
          <h3>자주 묻는 질문</h3>
          {dp.faq.map((f, i) => (
            <div className="dp-faq-item" key={i}>
              <div className="q">Q. {f.q}</div>
              <div className="a">{f.a}</div>
            </div>
          ))}
        </div>
      )}

      {dp.closing && <div className="dp-closing">{dp.closing}</div>}
    </div>
  )
}
