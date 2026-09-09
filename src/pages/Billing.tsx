import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { COIN_PACKS, CONTENT_COIN_COST, ORDER_COIN_PRICE, coins, won } from '../lib/billing'
import type { CoinPack, CoinTxn, OrderType } from '../lib/types'
import { COIN_TXN_LABEL, ORDER_LABEL } from '../lib/types'
import { formatDateTime } from '../lib/format'
import { Button, Loading, Notice } from '../components/ui'
import { PayModal } from '../components/PayModal'

interface Wallet {
  balance: number
  txns: CoinTxn[]
}

const TXN_TONE: Record<CoinTxn['type'], string> = {
  topup: 'badge-ok',
  bonus: 'badge-info',
  spend: 'badge-neutral',
  refund: 'badge-warn',
}

export default function BillingPage() {
  const { farm } = useAuth()
  const [data, setData] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [pick, setPick] = useState<CoinPack | null>(null)
  const [orderType, setOrderType] = useState<OrderType | null>(null)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    if (!farm) return
    const w = await api.getWallet(farm.id)
    setData({ balance: w.balance, txns: w.txns })
    setLoading(false)
  }, [farm])

  useEffect(() => {
    load()
  }, [load])

  if (!farm) return null

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 24, maxWidth: 900 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            예치금(코인) 관리
          </h1>
          <p className="muted">코인을 충전해 두고 AI 콘텐츠 제작·부가서비스에 사용하세요.</p>
        </div>

        {loading || !data ? (
          <Loading />
        ) : (
          <>
            <Notice tone="info">
              여기는 <b>AI 콘텐츠 제작 예치금</b>이에요. 농산물을 파는{' '}
              <Link to="/store">판매 관리</Link>, 소비자 <b>농산물 정기구독</b>과는 별개입니다.
            </Notice>

            {err && <Notice tone="danger">{err}</Notice>}

            {/* 잔액 */}
            <div className="card card-pad">
              <div className="spread">
                <div>
                  <div className="muted" style={{ fontSize: 13 }}>현재 잔액</div>
                  <div style={{ fontSize: 34, fontWeight: 800 }}>{coins(data.balance)}</div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                    숏폼 영상 약 {Math.floor(data.balance / CONTENT_COIN_COST)}건 제작 가능 · 1건{' '}
                    {coins(CONTENT_COIN_COST)}
                  </div>
                </div>
              </div>
            </div>

            {/* 충전 팩 */}
            <div>
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                코인 충전
              </h2>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {COIN_PACKS.map((p) => (
                  <div className={`card card-pad ${p.recommended ? 'plan on' : ''}`} key={p.id}>
                    <b>{won(p.won)}</b>
                    <div style={{ fontSize: 20, fontWeight: 800, margin: '6px 0' }}>
                      {coins(p.coins + p.bonus)}
                    </div>
                    <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                      기본 {coins(p.coins)}
                      {p.bonus > 0 && ` + 보너스 ${coins(p.bonus)}`}
                    </p>
                    <Button size="sm" variant={p.recommended ? 'primary' : 'outline'} block onClick={() => setPick(p)}>
                      충전
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 건별 부가 서비스 */}
            <div>
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                부가 서비스 (코인 차감)
              </h2>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {(Object.keys(ORDER_LABEL) as OrderType[]).map((t) => (
                  <div className="card card-pad" key={t}>
                    <b>{ORDER_LABEL[t]}</b>
                    <div style={{ fontSize: 20, fontWeight: 800, margin: '6px 0' }}>
                      {coins(ORDER_COIN_PRICE[t])}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      block
                      disabled={data.balance < ORDER_COIN_PRICE[t]}
                      onClick={() => setOrderType(t)}
                    >
                      {data.balance < ORDER_COIN_PRICE[t] ? '코인 부족' : '신청하기'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* 내역 */}
            <div>
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>
                코인 내역
              </h2>
              {data.txns.length === 0 ? (
                <p className="muted">아직 내역이 없어요.</p>
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>일시</th>
                        <th>구분</th>
                        <th>내용</th>
                        <th>변동</th>
                        <th>잔액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.txns.map((t) => (
                        <tr key={t.id}>
                          <td>{formatDateTime(t.createdAt)}</td>
                          <td>
                            <span className={`badge ${TXN_TONE[t.type]}`}>{COIN_TXN_LABEL[t.type]}</span>
                          </td>
                          <td className="muted">
                            {t.memo}
                            {t.wonPaid ? ` (${won(t.wonPaid)} 결제)` : ''}
                          </td>
                          <td style={{ color: t.amount < 0 ? 'var(--danger)' : 'var(--ok)', fontWeight: 700 }}>
                            {t.amount > 0 ? '+' : ''}
                            {t.amount.toLocaleString('ko-KR')}
                          </td>
                          <td>{t.balanceAfter.toLocaleString('ko-KR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {pick && (
        <PayModal
          title={`${won(pick.won)} 충전`}
          amount={pick.won}
          note={`${coins(pick.coins)}${pick.bonus > 0 ? ` + 보너스 ${coins(pick.bonus)}` : ''} 적립됩니다.`}
          confirmLabel="충전하기"
          onConfirm={async () => {
            await api.topUpWallet(farm.id, pick.id)
            setPick(null)
            load()
          }}
          onClose={() => setPick(null)}
        />
      )}

      {orderType && (
        <div className="modal-backdrop" onClick={() => setOrderType(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 19 }}>{ORDER_LABEL[orderType]}</h3>
            <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>운영자가 확인 후 진행합니다.</p>
            <div className="pay-amount">
              <span>차감 코인</span>
              <b>{coins(ORDER_COIN_PRICE[orderType])}</b>
            </div>
            <div className="row" style={{ gap: 10, marginTop: 18 }}>
              <Button variant="ghost" block onClick={() => setOrderType(null)}>
                취소
              </Button>
              <Button
                block
                onClick={async () => {
                  setErr('')
                  try {
                    await api.createOrder({ farmId: farm.id, type: orderType })
                    setOrderType(null)
                    load()
                  } catch (e) {
                    setErr((e as Error).message === 'INSUFFICIENT_COINS' ? '코인이 부족해요. 먼저 충전해주세요.' : (e as Error).message)
                    setOrderType(null)
                  }
                }}
              >
                코인 차감하고 신청
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
