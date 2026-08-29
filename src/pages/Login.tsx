import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PublicLayout } from '../components/Layout'
import { Button, Field, Notice } from '../components/ui'
import { api } from '../lib/api'
import { DEMO_ACCOUNT } from '../lib/db'
import { useAuth } from '../lib/auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { loginFarm } = useAuth()
  const from = (location.state as { from?: string })?.from || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setError('')
    setLoading(true)
    try {
      const farm = await api.login(email.trim(), password)
      loginFarm(farm)
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function fillDemo() {
    setEmail(DEMO_ACCOUNT.email)
    setPassword(DEMO_ACCOUNT.password)
  }

  return (
    <PublicLayout>
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>로그인</h1>
          <p className="sub">농가 계정으로 로그인하세요.</p>

          <div className="demo-hint">
            <b>둘러보기용 데모 계정</b>
            <br />
            아이디: {DEMO_ACCOUNT.email} / 비밀번호: {DEMO_ACCOUNT.password}
            <button type="button" onClick={fillDemo}>
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
              <input
                className="input"
                placeholder="farm@example.com"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="비밀번호" required>
              <input
                className="input"
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Button type="submit" size="lg" block loading={loading}>
              로그인
            </Button>
          </form>

          <p className="auth-alt">
            아직 농가 회원이 아니신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
