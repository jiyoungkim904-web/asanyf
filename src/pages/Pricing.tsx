import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PublicLayout } from '../components/Layout'
import { Button, Notice } from '../components/ui'
import { PayModal } from '../components/PayModal'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { COMMERCE_FEE_RATE, ORDER_PRICE, SOURCING_FEE_RATE, SUBSCRIPTION_FEE_RATE, won } from '../lib/billing'
import type { Plan, PlanId } from '../lib/types'
import { ORDER_LABEL } from '../lib/types'

export default function Pricing() {
  const navigate = useNavigate()
  const { farm } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null)
  const [pick, setPick] = useState<Plan | null>(null)

  useEffect(() => {
    api.getPlans().then(setPlans)
    if (farm) api.getBilling(farm.id).then((b) => setCurrentPlan(b.subscription?.planId ?? null))
  }, [farm])

  function choose(plan: Plan) {
    if (!farm) {
      navigate('/signup')
      return
    }
    if (plan.priceMonthly === 0) {
      api.subscribe(farm.id, plan.id).then(() => navigate('/billing'))
      return
    }
    setPick(plan)
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
              아래 금액·횟수·수수료는 <b>아직 확정되지 않은 예시(임시) 값</b>입니다. 운영 정책이 정해지면
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

          {/* ② AI 콘텐츠 SaaS 구독 */}
          <h3 style={{ fontSize: 20, marginBottom: 14 }}>② AI 콘텐츠 제작 SaaS 구독</h3>
          <p className="muted" style={{ marginTop: -6, marginBottom: 14, fontSize: 14 }}>
            셀러·농가가 매월 정해진 수만큼 AI 숏폼·상세페이지·광고카피를 만드는 구독이에요.
          </p>
          <div className="plan-grid">
            {plans.map((p) => (
              <div className={`plan ${p.recommended ? 'on' : ''}`} key={p.id}>
                {p.recommended && <span className="plan-badge">추천</span>}
                <div className="plan-name">{p.name}</div>
                <div className="plan-price">
                  {won(p.priceMonthly)}
                  {p.priceMonthly > 0 && <small> / 월</small>}
                </div>
                <ul className="plan-feats">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 'auto' }}>
                  {currentPlan === p.id ? (
                    <div className="current-tag">현재 이용 중</div>
                  ) : (
                    <Button
                      block
                      variant={p.recommended ? 'primary' : 'outline'}
                      onClick={() => choose(p)}
                    >
                      {farm ? (currentPlan ? '이 플랜으로 변경' : '이 플랜 시작') : '회원가입하고 시작'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

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
                  ②의 콘텐츠 SaaS 구독과 별개예요)
                </p>
              </div>
            </div>
          </div>

          {/* ⑤ 건별 결제 */}
          <h3 style={{ fontSize: 20, margin: '36px 0 14px' }}>⑤ 필요할 때만, 건별 결제</h3>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>부가 서비스</th>
                  <th>설명</th>
                  <th>금액(예시)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{ORDER_LABEL.extra_content}</td>
                  <td>구독 한도를 초과했을 때 콘텐츠 1건 추가 제작</td>
                  <td>{won(ORDER_PRICE.extra_content)}</td>
                </tr>
                <tr>
                  <td>{ORDER_LABEL.shooting}</td>
                  <td>촬영 전문가가 농가에 방문해 원본 영상·사진 촬영</td>
                  <td>{won(ORDER_PRICE.shooting)}</td>
                </tr>
                <tr>
                  <td>{ORDER_LABEL.premium_edit}</td>
                  <td>자막·음악·색보정을 더한 프리미엄 편집본</td>
                  <td>{won(ORDER_PRICE.premium_edit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
            건별 결제는 로그인 후 <b>결제·구독</b>, 자체 판매·공동구매 등록은 <b>판매 관리</b> 화면에서 할 수 있어요.
          </p>

          <div className="center" style={{ marginTop: 40 }}>
            {farm ? (
              <Button size="lg" onClick={() => navigate('/billing')}>
                내 결제·구독 관리로 이동
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
          title={`${pick.name} 구독 시작`}
          amount={pick.priceMonthly}
          cycle="월"
          note={`매월 콘텐츠 ${pick.monthlyQuota}건까지 제작할 수 있어요.`}
          confirmLabel="구독 시작하기"
          onConfirm={async () => {
            await api.subscribe(farm.id, pick.id)
            setPick(null)
            navigate('/billing')
          }}
          onClose={() => setPick(null)}
        />
      )}
    </PublicLayout>
  )
}
