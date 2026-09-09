import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { SOURCING_FEE_RATE, won } from '../../lib/billing'
import { useAuth } from '../../lib/auth'
import { formatDate } from '../../lib/format'
import { CULTIVATION_LABEL } from '../../lib/types'
import type { Farm, FarmProduct } from '../../lib/types'
import { Art, Button, Field, Loading, Notice } from '../../components/ui'
import { PayModal } from '../../components/PayModal'

interface Row {
  product: FarmProduct
  farm: Farm
}

const REGIONS = ['전체', '충청남도', '전라남도', '경상북도']
const CATS = ['전체', '과일', '채소', '쌀']
const SEASONS = ['전체', '봄', '여름', '가을', '겨울', '연중']

function catOf(name: string) {
  if (/배|샤인|포도|사과|감|딸기|참외|복숭아/.test(name)) return '과일'
  if (/쌀|햅쌀/.test(name)) return '쌀'
  if (/토마토|오이|고구마|채소|파|배추/.test(name)) return '채소'
  return '과일'
}

export default function ShopSourcing() {
  const navigate = useNavigate()
  const { buyer } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState('전체')
  const [cat, setCat] = useState('전체')
  const [season, setSeason] = useState('전체')
  const [sort, setSort] = useState<'price' | 'stock'>('price')
  const [target, setTarget] = useState<Row | null>(null)
  const [inquiry, setInquiry] = useState<Row | null>(null)
  const [pay, setPay] = useState<{ row: Row; qty: number } | null>(null)
  const [doneMsg, setDoneMsg] = useState('')

  useEffect(() => {
    api.buyer.sourcing().then((r) => {
      setRows(r as Row[])
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (region !== '전체' && !r.farm.region.startsWith(region)) return false
      if (cat !== '전체' && catOf(r.product.name) !== cat) return false
      if (season !== '전체' && !r.product.harvestSeason.includes(season) && !(season === '연중' && r.product.harvestSeason === '연중'))
        return false
      return true
    })
    list = [...list].sort((a, b) =>
      sort === 'price'
        ? (a.product.wholesale!.price) - (b.product.wholesale!.price)
        : (b.product.wholesale!.stockKg) - (a.product.wholesale!.stockKg),
    )
    return list
  }, [rows, region, cat, season, sort])

  return (
    <div className="page">
      <div className="container">
        <h1 className="app-title">농장별 소싱</h1>
        <p className="app-sub">산지에서 도매로 바로. 소싱 수수료 거래액의 {Math.round(SOURCING_FEE_RATE * 100)}% (3~7%)</p>

        <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <FilterSelect label="지역" value={region} opts={REGIONS} onChange={setRegion} />
          <FilterSelect label="품목" value={cat} opts={CATS} onChange={setCat} />
          <FilterSelect label="가격" value={sort === 'price' ? '낮은순' : '재고많은순'} opts={['낮은순', '재고많은순']} onChange={(v) => setSort(v === '낮은순' ? 'price' : 'stock')} />
          <FilterSelect label="수확시기" value={season} opts={SEASONS} onChange={setSeason} />
        </div>

        {doneMsg && (
          <div style={{ marginBottom: 12 }}>
            <Notice tone="ok">{doneMsg}</Notice>
          </div>
        )}

        {loading ? (
          <Loading />
        ) : (
          <div className="stack" style={{ gap: 12 }}>
            {filtered.map((row) => {
              const w = row.product.wholesale!
              return (
                <div className="card card-pad" key={row.product.id}>
                  <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                    <div
                      style={{
                        width: 66, height: 66, borderRadius: 12, flexShrink: 0,
                        position: 'relative', overflow: 'hidden', background: 'var(--brand-50)',
                      }}
                    >
                      <Art name={row.product.name} photos={row.product.photos} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <b style={{ fontSize: 15 }}>{row.farm.farmName}</b>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {row.product.name} · {row.product.variety} · {CULTIVATION_LABEL[row.product.method]}
                      </div>
                    </div>
                  </div>

                  <div className="review-card" style={{ marginTop: 10 }}>
                    <dl style={{ gridTemplateColumns: '68px 1fr', gap: '6px 10px' }}>
                      <dt>가격</dt>
                      <dd>{won(w.price)} / {w.unitLabel}</dd>
                      <dt>수확일</dt>
                      <dd>{formatDate(w.harvestDate)}</dd>
                      <dt>최소주문</dt>
                      <dd>{w.minOrderKg}kg</dd>
                      <dt>재고</dt>
                      <dd>{w.stockKg}kg</dd>
                    </dl>
                  </div>

                  <div className="row" style={{ gap: 8, marginTop: 12 }}>
                    <Button variant="outline" block size="sm" onClick={() => setInquiry(row)}>
                      문의
                    </Button>
                    <Button block size="sm" onClick={() => setTarget(row)}>
                      소싱
                    </Button>
                  </div>
                </div>
              )
            })}
            {filtered.length === 0 && <p className="muted center" style={{ padding: 24 }}>조건에 맞는 산지가 없어요.</p>}
          </div>
        )}
      </div>

      {inquiry && (
        <InquiryModal
          row={inquiry}
          onClose={() => setInquiry(null)}
          onSend={async (qty, memo) => {
            if (!buyer) return navigate('/shop/login', { state: { from: '/shop/sourcing' } })
            await api.buyer.applySourcing({ sellerId: buyer.id, productId: inquiry.product.id, qtyKg: qty, inquiry: true, memo })
            setInquiry(null)
            setDoneMsg(`${inquiry.farm.farmName}에 소싱 문의를 보냈어요. 농가 답변을 기다려주세요.`)
          }}
        />
      )}

      {target && (
        <SourceModal
          row={target}
          onClose={() => setTarget(null)}
          onNext={(qty) => {
            if (!buyer) return navigate('/shop/login', { state: { from: '/shop/sourcing' } })
            setPay({ row: target, qty })
            setTarget(null)
          }}
        />
      )}

      {pay && buyer && (
        <PayModal
          title="소싱 신청"
          amount={Math.round((pay.qty / (parseFloat(pay.row.product.wholesale!.unitLabel) || 1)) * pay.row.product.wholesale!.price)}
          note={`${pay.row.farm.farmName} ${pay.row.product.name} ${pay.qty}kg · 소싱 수수료 ${Math.round(SOURCING_FEE_RATE * 100)}% 별도`}
          confirmLabel="소싱 신청하기"
          onConfirm={async () => {
            await api.buyer.applySourcing({ sellerId: buyer.id, productId: pay.row.product.id, qtyKg: pay.qty })
            setPay(null)
            setDoneMsg(`${pay.row.farm.farmName} 소싱을 신청했어요. 마이 > 소싱 내역에서 확인하세요.`)
          }}
          onClose={() => setPay(null)}
        />
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  opts,
  onChange,
}: {
  label: string
  value: string
  opts: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: 'auto', flex: '1 1 150px', minWidth: 0, fontSize: 13, padding: '8px 10px' }}
    >
      {opts.map((o) => (
        <option key={o} value={o}>
          {label}: {o}
        </option>
      ))}
    </select>
  )
}

function SourceModal({ row, onClose, onNext }: { row: Row; onClose: () => void; onNext: (qty: number) => void }) {
  const w = row.product.wholesale!
  const [qty, setQty] = useState(String(w.minOrderKg))
  const [err, setErr] = useState('')
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18 }}>{row.farm.farmName} · {row.product.name}</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          {won(w.price)}/{w.unitLabel} · 최소 {w.minOrderKg}kg · 재고 {w.stockKg}kg
        </p>
        {err && <div style={{ marginTop: 10 }}><Notice tone="danger">{err}</Notice></div>}
        <div style={{ marginTop: 14 }}>
          <Field label="주문 수량 (kg)" required>
            <input className="input" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
        </div>
        <div className="pay-amount">
          <span>예상 거래액</span>
          <b>{won(Math.round(((Number(qty) || 0) / (parseFloat(w.unitLabel) || 1)) * w.price))}</b>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Button variant="ghost" block onClick={onClose}>취소</Button>
          <Button
            block
            onClick={() => {
              const n = Number(qty)
              if (!n || n < w.minOrderKg) return setErr(`최소 주문은 ${w.minOrderKg}kg 입니다.`)
              if (n > w.stockKg) return setErr('재고보다 많이 주문할 수 없어요.')
              onNext(n)
            }}
          >
            결제 단계로
          </Button>
        </div>
      </div>
    </div>
  )
}

function InquiryModal({
  row,
  onClose,
  onSend,
}: {
  row: Row
  onClose: () => void
  onSend: (qty: number, memo: string) => void
}) {
  const [qty, setQty] = useState(String(row.product.wholesale!.minOrderKg))
  const [memo, setMemo] = useState('')
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 18 }}>{row.farm.farmName}에 문의</h3>
        <div style={{ marginTop: 14 }} className="stack">
          <Field label="관심 수량 (kg)">
            <input className="input" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          </Field>
          <Field label="문의 내용">
            <textarea
              className="textarea"
              placeholder="납품 주기, 등급, 포장 단위 등 궁금한 점을 적어주세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </Field>
        </div>
        <div className="row" style={{ gap: 10, marginTop: 8 }}>
          <Button variant="ghost" block onClick={onClose}>취소</Button>
          <Button block onClick={() => onSend(Number(qty) || 0, memo)}>문의 보내기</Button>
        </div>
      </div>
    </div>
  )
}
