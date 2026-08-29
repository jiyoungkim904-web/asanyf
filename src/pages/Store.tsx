import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { COMMERCE_FEE_RATE, won } from '../lib/billing'
import { formatDate } from '../lib/format'
import {
  GROUPBUY_STATUS_LABEL,
  LISTING_STATUS_LABEL,
  PRODUCE_PLAN_LABEL,
  PRODUCE_SUB_STATUS_LABEL,
  SHOP_ORDER_STATUS_LABEL,
} from '../lib/types'
import type { Buyer, FarmProduct, GroupBuy, Listing, ProduceSub, ShopOrder } from '../lib/types'
import { Button, Empty, Field, Loading, Notice } from '../components/ui'

interface Store {
  listings: { listing: Listing; product?: FarmProduct; sold: number }[]
  orders: ShopOrder[]
  groupBuys: GroupBuy[]
  produceSubs: { sub: ProduceSub; buyer?: Buyer }[]
  products: FarmProduct[]
  summary: { gmv: number; fee: number; net: number; subGmv: number; subCount: number }
}

type Tab = 'listings' | 'orders' | 'groupbuy' | 'subscribers'

export default function StorePage() {
  const { farm } = useAuth()
  const [data, setData] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('listings')
  const [form, setForm] = useState<null | 'listing' | 'groupbuy'>(null)

  const load = useCallback(async () => {
    if (!farm) return
    setData((await api.myStore(farm.id)) as Store)
    setLoading(false)
  }, [farm])

  useEffect(() => {
    load()
  }, [load])

  if (!farm) return null

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 22, maxWidth: 960 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            판매 관리
          </h1>
          <p className="muted">
            영팜마켓에서 직접 판매·공동구매·정기구독을 운영하세요. 플랫폼 수수료{' '}
            {Math.round(COMMERCE_FEE_RATE * 100)}%(예시).
          </p>
        </div>

        {loading || !data ? (
          <Loading />
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat">
                <div className="label">판매 매출(GMV)</div>
                <div className="value" style={{ fontSize: 22 }}>{won(data.summary.gmv)}</div>
              </div>
              <div className="stat">
                <div className="label">플랫폼 수수료</div>
                <div className="value" style={{ fontSize: 22 }}>-{won(data.summary.fee)}</div>
              </div>
              <div className="stat accent">
                <div className="label">정산 예정(농가 수령)</div>
                <div className="value" style={{ fontSize: 22 }}>{won(data.summary.net)}</div>
              </div>
              <div className="stat">
                <div className="label">정기구독자</div>
                <div className="value">{data.summary.subCount}</div>
              </div>
            </div>

            <div className="spread">
              <div className="pill-tab">
                <button className={tab === 'listings' ? 'on' : ''} onClick={() => setTab('listings')}>
                  판매 상품
                </button>
                <button className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>
                  받은 주문 ({data.orders.length})
                </button>
                <button className={tab === 'groupbuy' ? 'on' : ''} onClick={() => setTab('groupbuy')}>
                  공동구매
                </button>
                <button className={tab === 'subscribers' ? 'on' : ''} onClick={() => setTab('subscribers')}>
                  정기구독자
                </button>
              </div>
              {tab === 'listings' && data.products.length > 0 && (
                <Button size="sm" onClick={() => setForm(form === 'listing' ? null : 'listing')}>
                  {form === 'listing' ? '닫기' : '+ 상품 등록'}
                </Button>
              )}
              {tab === 'groupbuy' && data.products.length > 0 && (
                <Button size="sm" onClick={() => setForm(form === 'groupbuy' ? null : 'groupbuy')}>
                  {form === 'groupbuy' ? '닫기' : '+ 공동구매 열기'}
                </Button>
              )}
            </div>

            {form === 'listing' && (
              <ListingForm
                farmId={farm.id}
                products={data.products}
                onDone={() => {
                  setForm(null)
                  load()
                }}
              />
            )}
            {form === 'groupbuy' && (
              <GroupBuyForm
                farmId={farm.id}
                products={data.products}
                onDone={() => {
                  setForm(null)
                  load()
                }}
              />
            )}

            {/* 판매 상품 */}
            {tab === 'listings' &&
              (data.listings.length === 0 ? (
                <Empty
                  emoji="🏷️"
                  title="등록된 판매 상품이 없어요"
                  desc={data.products.length === 0 ? '먼저 농산물을 등록해주세요.' : '상품을 등록하면 스토어에 노출됩니다.'}
                  action={
                    data.products.length === 0 ? (
                      <Link to="/products/new" className="btn btn-primary">농산물 등록</Link>
                    ) : (
                      <Button onClick={() => setForm('listing')}>상품 등록</Button>
                    )
                  }
                />
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>상품</th><th>판매가</th><th>재고</th><th>누적 판매</th><th>상태</th><th>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.listings.map(({ listing, sold }) => (
                        <tr key={listing.id}>
                          <td><b>{listing.title}</b><div className="muted" style={{ fontSize: 12 }}>{listing.unitLabel}</div></td>
                          <td>{won(listing.price)}</td>
                          <td>{listing.stock}</td>
                          <td>{sold}건</td>
                          <td>
                            <span className={`badge ${listing.status === 'live' ? 'badge-ok' : 'badge-neutral'}`}>
                              {LISTING_STATUS_LABEL[listing.status]}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={async () => {
                                await api.setListingStatus(farm.id, listing.id, listing.status === 'live' ? 'paused' : 'live')
                                load()
                              }}
                            >
                              {listing.status === 'live' ? '판매 중지' : '판매 재개'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* 받은 주문 */}
            {tab === 'orders' &&
              (data.orders.length === 0 ? (
                <Empty emoji="📦" title="받은 주문이 없어요" />
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr><th>주문일</th><th>상품</th><th>유형</th><th>금액(우리 농가분)</th><th>상태</th></tr>
                    </thead>
                    <tbody>
                      {data.orders.map((o) => {
                        const mine = o.items.filter((it) => it.farmId === farm.id)
                        const amt = mine.reduce((n, it) => n + it.qty * it.unitPrice, 0)
                        return (
                          <tr key={o.id}>
                            <td>{formatDate(o.createdAt)}</td>
                            <td>{mine.map((it) => `${it.title}×${it.qty}`).join(', ')}</td>
                            <td>{o.kind === 'groupbuy' ? '공동구매' : o.kind === 'subscription' ? '정기구독' : '일반'}</td>
                            <td>{won(amt)}</td>
                            <td><span className="badge badge-info">{SHOP_ORDER_STATUS_LABEL[o.status]}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

            {/* 공동구매 */}
            {tab === 'groupbuy' &&
              (data.groupBuys.length === 0 ? (
                <Empty
                  emoji="🤝"
                  title="진행 중인 공동구매가 없어요"
                  desc="목표 수량을 정해 공동구매를 열면 구매자들이 함께 구매해요."
                  action={data.products.length > 0 ? <Button onClick={() => setForm('groupbuy')}>공동구매 열기</Button> : undefined}
                />
              ) : (
                <div className="stack" style={{ gap: 12 }}>
                  {data.groupBuys.map((g) => {
                    const pct = Math.min(100, Math.round((g.currentQty / g.targetQty) * 100))
                    return (
                      <div className="card card-pad" key={g.id}>
                        <div className="spread">
                          <b>{g.title}</b>
                          <span className={`badge ${g.status === 'reached' ? 'badge-ok' : 'badge-warn'}`}>
                            {GROUPBUY_STATUS_LABEL[g.status]}
                          </span>
                        </div>
                        <p className="muted" style={{ fontSize: 13, margin: '4px 0 8px' }}>
                          {won(g.normalPrice)} → {won(g.groupPrice)} · ~{formatDate(g.deadline)} 마감
                        </p>
                        <div className="gb-progress"><span style={{ width: `${pct}%` }} /></div>
                        <span className="muted" style={{ fontSize: 13 }}>{g.currentQty}/{g.targetQty}개 참여</span>
                      </div>
                    )
                  })}
                </div>
              ))}

            {/* 정기구독자 */}
            {tab === 'subscribers' &&
              (data.produceSubs.length === 0 ? (
                <Empty emoji="🔁" title="정기구독자가 없어요" desc="스토어의 정기구독 상품으로 구매자가 우리 농가 박스를 구독할 수 있어요." />
              ) : (
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr><th>구독자</th><th>박스</th><th>주기</th><th>월 금액</th><th>다음 배송</th><th>상태</th></tr>
                    </thead>
                    <tbody>
                      {data.produceSubs.map(({ sub, buyer }) => (
                        <tr key={sub.id}>
                          <td>{buyer?.name ?? '구매자'}</td>
                          <td>{sub.boxName}</td>
                          <td>{PRODUCE_PLAN_LABEL[sub.plan]}</td>
                          <td>{won(sub.boxPrice)}</td>
                          <td>{formatDate(sub.nextDelivery)}</td>
                          <td>
                            <span className={`badge ${sub.status === 'active' ? 'badge-ok' : 'badge-neutral'}`}>
                              {PRODUCE_SUB_STATUS_LABEL[sub.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            <Notice tone="info">
              구매자 화면은 <Link to="/shop">영팜마켓 스토어</Link>에서 확인할 수 있어요. 판매·정산 데이터 일부는
              프로토타입 예시입니다.
            </Notice>
          </>
        )}
      </div>
    </div>
  )
}

function ListingForm({
  farmId,
  products,
  onDone,
}: {
  farmId: string
  products: FarmProduct[]
  onDone: () => void
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [unitLabel, setUnitLabel] = useState('5kg / 1박스')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('30')
  const [description, setDescription] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setErr('')
    const p = Number(price.replace(/[^0-9]/g, ''))
    if (!productId || !title.trim() || !p) return setErr('농산물·상품명·판매가를 입력해주세요.')
    setSaving(true)
    await api.createListing({
      farmId, productId, title: title.trim(), unitLabel: unitLabel.trim(),
      price: p, stock: Number(stock) || 0, description: description.trim(),
    })
    onDone()
  }

  return (
    <div className="card card-pad stack" style={{ gap: 14 }}>
      {err && <Notice tone="danger">{err}</Notice>}
      <div className="form-grid-2">
        <Field label="농산물" required>
          <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="단위" required>
          <input className="input" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
        </Field>
      </div>
      <Field label="상품명" required>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 아산 친환경 신고배 5kg 선물세트" />
      </Field>
      <div className="form-grid-2">
        <Field label="판매가 (원)" required>
          <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="재고">
          <input className="input" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
        </Field>
      </div>
      <Field label="상품 설명">
        <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Button onClick={submit} loading={saving}>상품 등록</Button>
    </div>
  )
}

function GroupBuyForm({
  farmId,
  products,
  onDone,
}: {
  farmId: string
  products: FarmProduct[]
  onDone: () => void
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [normalPrice, setNormalPrice] = useState('')
  const [groupPrice, setGroupPrice] = useState('')
  const [unitLabel, setUnitLabel] = useState('5kg')
  const [target, setTarget] = useState('30')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    setErr('')
    const n = Number(normalPrice.replace(/[^0-9]/g, ''))
    const g = Number(groupPrice.replace(/[^0-9]/g, ''))
    if (!productId || !title.trim() || !n || !g || g >= n) return setErr('상품명·정상가·공동구매가(정상가보다 낮게)를 확인해주세요.')
    setSaving(true)
    await api.createGroupBuy({
      farmId, productId, title: title.trim(), normalPrice: n, groupPrice: g,
      unitLabel: unitLabel.trim(), targetQty: Number(target) || 30,
    })
    onDone()
  }

  return (
    <div className="card card-pad stack" style={{ gap: 14 }}>
      {err && <Notice tone="danger">{err}</Notice>}
      <div className="form-grid-2">
        <Field label="농산물" required>
          <select className="select" value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="단위" required>
          <input className="input" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
        </Field>
      </div>
      <Field label="공동구매 제목" required>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 아산 배 5kg 공동구매" />
      </Field>
      <div className="form-grid-2">
        <Field label="정상가 (원)" required>
          <input className="input" inputMode="numeric" value={normalPrice} onChange={(e) => setNormalPrice(e.target.value)} />
        </Field>
        <Field label="공동구매가 (원)" required>
          <input className="input" inputMode="numeric" value={groupPrice} onChange={(e) => setGroupPrice(e.target.value)} />
        </Field>
      </div>
      <Field label="목표 수량" hint="이 수량을 채우면 공동구매가로 확정됩니다.">
        <input className="input" inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} />
      </Field>
      <Button onClick={submit} loading={saving}>공동구매 열기 (7일간)</Button>
    </div>
  )
}
