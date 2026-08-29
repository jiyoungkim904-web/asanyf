import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { won } from '../../lib/billing'
import { Art, Loading } from '../../components/ui'
import { GROUPBUY_STATUS_LABEL } from '../../lib/types'
import type { Farm, FarmProduct, GroupBuy } from '../../lib/types'

interface Row {
  gb: GroupBuy
  farm: Farm
  product?: FarmProduct
}

export default function ShopGroupBuyList() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.buyer.groupBuys().then((r) => {
      setRows(r as Row[])
      setLoading(false)
    })
  }, [])

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 20 }}>
        <div>
          <h1 className="app-title">공동구매</h1>
          <p className="app-sub">여럿이 함께 사면 더 싸게. 목표 수량을 채우면 공동구매가로 발송돼요.</p>
        </div>

        {loading ? (
          <Loading />
        ) : (
          <div className="shop-grid">
            {rows.map(({ gb, farm, product }) => {
              const pct = Math.min(100, Math.round((gb.currentQty / gb.targetQty) * 100))
              return (
                <Link key={gb.id} to={`/shop/groupbuy/${gb.id}`} className="shop-card">
                  <div className="sc-thumb">
                    <Art name={product?.name ?? gb.title} photos={product?.photos} />
                    <span className="sc-ribbon">
                      {Math.round((1 - gb.groupPrice / gb.normalPrice) * 100)}% 할인
                    </span>
                  </div>
                  <div className="sc-body">
                    <span className="sc-farm">{farm.farmName}</span>
                    <span className="sc-title">{gb.title}</span>
                    <span className="sc-price">
                      <s>{won(gb.normalPrice)}</s>
                      {won(gb.groupPrice)}
                    </span>
                    <div className="gb-progress">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <span className="sc-unit">
                      {gb.currentQty}/{gb.targetQty} 참여 · {GROUPBUY_STATUS_LABEL[gb.status]}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
