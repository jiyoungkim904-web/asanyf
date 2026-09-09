import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicLayout } from '../components/Layout'
import { Button, Notice } from '../components/ui'
import { PayModal } from '../components/PayModal'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import {
  COIN_PACKS,
  COMMERCE_FEE_RATE,
  CONTENT_COIN_COST,
  ORDER_COIN_PRICE,
  SOURCING_FEE_RATE,
  SUBSCRIPTION_FEE_RATE,
  coins,
  won,
} from '../lib/billing'
import type { CoinPack } from '../lib/types'
import { ORDER_LABEL } from '../lib/types'

export default function Pricing() {
  const navigate = useNavigate()
  const { farm } = useAuth()
  const [balance, setBalance] = useState<number | null>(null)
  const [pick, setPick] = useState<CoinPack | null>(null)

  useEffect(() => {
    if (farm) api.getWallet(farm.id).then((w) => setBalance(w.balance))
  }, [farm])

  function choose(pack: CoinPack) {
    if (!farm) {
      navigate('/signup')
      return
    }
    setPick(pack)
  }

  return (
    <PublicLayout>
      <div className="page">
        <div className="container" style={{ maxWidth: 1000 }}>
          <div className="lp-head" style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 30 }}>요금 안내</h2>
            <p>영팜마켓은 콘텐츠 제작과 판매를 함께 지원합니다. 필요한 것만 골라 쓰세요.</p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Notice tone="warn">
              아래 금액·코인·수수료는 <b>아직 확정되지 않은 예시(임시) 값</b>입니다. 운영 정책이 정해지면
              바뀔 수 있어요.
            </Notice>
          </div>

          {/* 유통 소싱 */}
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>① 유통 소싱 수수료</h3>
          <div className="card card-pad" style={{ marginBottom: 32 }}>
            <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 30 }}>🌱</span>
              <div>
                <b style={{ fontSize: 16 }}>산지 ↔ 온라인 셀러 도매 중개</b>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  셀러가 <b>소싱</b> 탭에서 산지 농산물을 도매로 가져올 때, 거래액의{' '}
                  <b>{Math.round(SOURCING_FEE_RATE * 100)}% (3~7%)</b>를 플랫폼 수수료로 받습니다.
                </p>
              </div>
            </div>
          </div>

          {/* ② AI 콘텐츠 예치금(코인) */}
          <h3 style={{ fontSize: 20, marginBottom: 6 }}>② AI 콘텐츠 예치금(코인)</h3>
          <p className="muted" style={{ marginBottom: 16, fontSize: 14 }}>
            월 구독료·약정 없이, <b>코인을 미리 충전</b>해 두고 콘텐츠를 만들 때마다 차감합니다. 큰 금액을
            충전하면 보너스 코인을 더 드려요. 남은 코인은 사라지지 않습니다.
          </p>

          <div className="plan-grid">
            {COIN_PACKS.map((p) => (
              <div className={`plan ${p.recommended ? 'on' : ''}`} key={p.id}>
                {p.recommended && <span className="plan-badge">추천</span>}
                <div className="plan-name">{won(p.won)} 충전</div>
                <div className="plan-price">
                  {coins(p.coins + p.bonus)}
                </div>
                <ul className="plan-feats">
                  <li>기본 {coins(p.coins)}</li>
                  <li>{p.bonus > 0 ? `보너스 +${coins(p.bonus)}` : '보너스 없음'}</li>
                  <li>숏폼 영상 약 {Math.floor((p.coins + p.bonus) / CONTENT_COIN_COST)}건 분량</li>
                </ul>
                <div style={{ marginTop: 'auto' }}>
                  <Button block variant={p.recommended ? 'primary' : 'outline'} onClick={() => choose(p)}>
                    {farm ? '충전하기' : '회원가입하고 충전'}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrap" style={{ marginTop: 20 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>항목</th>
                  <th>차감 코인(예시)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI 숏폼 영상 1건</td>
                  <td>{coins(CONTENT_COIN_COST)}</td>
                </tr>
                <tr>
                  <td>{ORDER_LABEL.extra_content}</td>
                  <td>{coins(ORDER_COIN_PRICE.extra_content)}</td>
                </tr>
                <tr>
                  <td>{ORDER_LABEL.shooting}</td>
                  <td>{coins(ORDER_COIN_PRICE.shooting)}</td>
                </tr>
                <tr>
                  <td>{ORDER_LABEL.premium_edit}</td>
                  <td>{coins(ORDER_COIN_PRICE.premium_edit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {balance !== null && (
            <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
              현재 내 잔액: <b>{coins(balance)}</b>
            </p>
          )}

          {/* ③ 공동구매·라이브커머스 · 자체 판매 */}
          <h3 style={{ fontSize: 20, margin: '36px 0 14px' }}>③ 공동구매·라이브커머스 · 자체 판매</h3>
          <div className="card card-pad">
            <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 30 }}>🤝</span>
              <div>
                <b style={{ fontSize: 16 }}>콘텐츠에서 바로 공동구매·판매로</b>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  영팜마켓 스토어 직접 판매, 목표 수량 공동구매, 라이브커머스 판매액의{' '}
                  <b>{Math.round(COMMERCE_FEE_RATE * 100)}% (5~15%)</b>를 수수료로 받습니다. 가입비·월
                  고정비 없이 팔린 만큼만.
                </p>
              </div>
            </div>
          </div>

          {/* ④ PB·브랜드 상품 / 정기구독 */}
          <h3 style={{ fontSize: 20, margin: '36px 0 14px' }}>④ PB·브랜드 상품 · 농산물 정기구독</h3>
          <div className="card card-pad">
            <div className="row" style={{ gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 30 }}>📦</span>
              <div>
                <b style={{ fontSize: 16 }}>자체 브랜드로 마진, 정기구독으로 반복 매출</b>
                <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>
                  아산 로컬푸드 PB·브랜드 상품 자체 마진 <b>15~35%</b>. 소비자가 농가 제철 박스를 정기
                  구독하면 수수료 <b>{Math.round(SUBSCRIPTION_FEE_RATE * 100)}%</b>. (소비자용 농산물 정기구독은
                  ②의 콘텐츠 예치금과 별개예요)
                </p>
              </div>
            </div>
          </div>

          <div className="center" style={{ marginTop: 40 }}>
            {farm ? (
              <Button size="lg" onClick={() => navigate('/billing')}>
                내 예치금 관리로 이동
              </Button>
            ) : (
              <Button size="lg" onClick={() => navigate('/signup')}>
                농가 회원가입
              </Button>
            )}
          </div>
        </div>
      </div>

      {pick && farm && (
        <PayModal
          title={`${won(pick.won)} 충전`}
          amount={pick.won}
          note={`${coins(pick.coins)}${pick.bonus > 0 ? ` + 보너스 ${coins(pick.bonus)}` : ''} 적립됩니다.`}
          confirmLabel="충전하기"
          onConfirm={async () => {
            await api.topUpWallet(farm.id, pick.id)
            setPick(null)
            navigate('/billing')
          }}
          onClose={() => setPick(null)}
        />
      )}
    </PublicLayout>
  )
}
