import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { coins, won } from '../../lib/billing'
import { formatDateTime } from '../../lib/format'
import { COIN_TXN_LABEL } from '../../lib/types'
import type { CoinTxn, Farm } from '../../lib/types'
import { Loading, Notice } from '../../components/ui'

interface Revenue {
  coinTopupRevenue: number
  coinsOutstanding: number
  coinsSpent: number
  sourcingFee: number
  sourcingGmv: number
  selfSaleFee: number
  groupBuyFee: number
  produceSubFee: number
  commerceGmv: number
  total: number
  wallets: { farm: Farm; balance: number }[]
  coinLedger: { txn: CoinTxn; farm: Farm }[]
}

const TXN_TONE: Record<CoinTxn['type'], string> = {
  topup: 'badge-ok',
  bonus: 'badge-info',
  spend: 'badge-neutral',
  refund: 'badge-warn',
}

export default function AdminRevenue() {
  const [d, setD] = useState<Revenue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.admin.revenue().then((r) => {
      setD(r as Revenue)
      setLoading(false)
    })
  }, [])

  if (loading || !d) return <div className="page"><div className="container"><Loading /></div></div>

  const rows = [
    { icon: '🌱', label: '유통 소싱 수수료 (거래액 3~7%)', value: d.sourcingFee, to: '/admin/commerce' },
    { icon: '🪙', label: 'AI 콘텐츠 예치금 충전', value: d.coinTopupRevenue, to: null },
    { icon: '🏷️', label: '자체 판매 수수료 (5~15%)', value: d.selfSaleFee, to: '/admin/commerce' },
    { icon: '🤝', label: '공동구매·라이브커머스 수수료', value: d.groupBuyFee, to: '/admin/commerce' },
    { icon: '📦', label: '농산물 정기구독 수수료', value: d.produceSubFee, to: '/admin/commerce' },
  ]

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 24 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            매출 현황 <span className="badge badge-warn">금액 예시</span>
          </h1>
          <p className="muted">5가지 수익모델의 예상 매출입니다.</p>
        </div>

        <div className="card card-pad">
          <div className="stack" style={{ gap: 2 }}>
            {rows.map((r) => (
              <div
                key={r.label}
                className="spread"
                style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}
              >
                <span className="row" style={{ gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{r.icon}</span>
                  {r.to ? <Link to={r.to}>{r.label}</Link> : <span>{r.label}</span>}
                </span>
                <b>{won(r.value)}</b>
              </div>
            ))}
            <div className="spread" style={{ padding: '14px 0 2px', fontSize: 18, fontWeight: 800 }}>
              <span>합계</span>
              <span>{won(d.total)}</span>
            </div>
          </div>
          <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
            소싱 거래액 {won(d.sourcingGmv)} + 커머스 거래액(GMV) {won(d.commerceGmv)} 중 수수료·충전액만 매출로 집계.
          </p>
        </div>

        {/* 예치금 현황 */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <div className="card card-pad">
            <div className="muted" style={{ fontSize: 13 }}>미사용 예치금 (부채)</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{coins(d.coinsOutstanding)}</div>
          </div>
          <div className="card card-pad">
            <div className="muted" style={{ fontSize: 13 }}>누적 사용 코인</div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>{coins(d.coinsSpent)}</div>
          </div>
        </div>

        {/* 농가별 잔액 */}
        <div>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>농가별 코인 잔액</h2>
          {d.wallets.length === 0 ? (
            <p className="muted">예치금 지갑이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>농가</th><th>잔액</th></tr></thead>
                <tbody>
                  {d.wallets.map((w) => (
                    <tr key={w.farm.id}>
                      <td><b>{w.farm.farmName}</b></td>
                      <td>{coins(w.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 코인 내역 */}
        <div>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 12 }}>코인 입출금 내역</h2>
          {d.coinLedger.length === 0 ? (
            <p className="muted">내역이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>일시</th><th>농가</th><th>구분</th><th>내용</th><th>변동</th><th>결제액</th></tr></thead>
                <tbody>
                  {d.coinLedger.slice(0, 40).map(({ txn, farm }) => (
                    <tr key={txn.id}>
                      <td>{formatDateTime(txn.createdAt)}</td>
                      <td>{farm.farmName}</td>
                      <td><span className={`badge ${TXN_TONE[txn.type]}`}>{COIN_TXN_LABEL[txn.type]}</span></td>
                      <td className="muted">{txn.memo}</td>
                      <td style={{ color: txn.amount < 0 ? 'var(--danger)' : 'var(--ok)', fontWeight: 700 }}>
                        {txn.amount > 0 ? '+' : ''}{txn.amount.toLocaleString('ko-KR')}
                      </td>
                      <td>{txn.wonPaid ? won(txn.wonPaid) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Notice tone="warn">
          모든 금액은 예시입니다. 코인 단가·수수료율은 <code>src/lib/billing.ts</code> 한 곳에서 바꿉니다.
        </Notice>
      </div>
    </div>
  )
}
