import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { DEMO_BUYER_ACCOUNT } from '../../lib/db'
import { Button, Field, Notice } from '../../components/ui'

export default function ShopLogin() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginBuyer } = useAuth()
  const from = (location.state as { from?: string })?.from || '/shop'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const b = await api.buyer.login(email.trim(), password)
      loginBuyer(b)
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>구매자 로그인</h1>
        <p className="sub">농산물을 구매·구독하려면 로그인하세요.</p>

        <div className="demo-hint">
          <b>둘러보기용 데모 계정</b>
          <br />
          {DEMO_BUYER_ACCOUNT.email} / {DEMO_BUYER_ACCOUNT.password}
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO_BUYER_ACCOUNT.email)
              setPassword(DEMO_BUYER_ACCOUNT.password)
            }}
          >
            자동 입력
          </button>
        </div>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Notice tone="danger">{error}</Notice>
          </div>
        )}

        <form className="stack" onSubmit={onSubmit}>
          <Field label="이메일" required>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
          </Field>
          <Field label="비밀번호" required>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" size="lg" block loading={loading}>
            로그인
          </Button>
        </form>

        <p className="auth-alt">
          처음이신가요? <Link to="/shop/signup">구매자 회원가입</Link>
          {' · '}
          <Link to="/shop">스토어로</Link>
        </p>
      </div>
    </div>
  )
}
