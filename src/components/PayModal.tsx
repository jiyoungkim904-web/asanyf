import { useState } from 'react'
import { won } from '../lib/billing'
import { Button, Notice } from './ui'

/** 목(mock) 결제 모달 — 실제 PG 연동 자리. 확인 누르면 성공 처리. */
export function PayModal({
  title,
  amount,
  note,
  cycle,
  confirmLabel = '결제하기',
  onConfirm,
  onClose,
}: {
  title: string
  amount: number
  note?: string
  cycle?: string
  confirmLabel?: string
  onConfirm: () => Promise<void> | void
  onClose: () => void
}) {
  const [loading, setLoading] = useState(false)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontSize: 19 }}>{title}</h3>
        {note && <p className="muted" style={{ fontSize: 14, marginTop: 4 }}>{note}</p>}

        <div className="pay-amount">
          <span>결제 금액</span>
          <b>
            {won(amount)}
            {cycle && <span className="muted" style={{ fontSize: 14, fontWeight: 600 }}> / {cycle}</span>}
          </b>
        </div>

        <Notice tone="warn">
          프로토타입 결제입니다. 실제 카드 정보를 입력하지 않으며 금액은 예시(임시)입니다.
        </Notice>

        <div className="row" style={{ gap: 10, marginTop: 18 }}>
          <Button variant="ghost" block onClick={onClose} disabled={loading}>
            취소
          </Button>
          <Button
            block
            loading={loading}
            onClick={async () => {
              setLoading(true)
              try {
                await onConfirm()
              } finally {
                setLoading(false)
              }
            }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
