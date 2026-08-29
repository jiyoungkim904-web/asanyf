import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button, Field, Notice } from '../../components/ui'

const ADMIN_DEMO = { email: 'admin@youngfarm.ai', password: 'admin1234' }

export default function AdminLogin() {
  const navigate = useNavigate()
  const { loginAdmin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setError('')
    setLoading(true)
    try {
      const admin = await api.admin.login(email.trim(), password)
      loginAdmin(admin)
      navigate('/admin', { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>운영자 로그인</h1>
          <p className="sub">영팜마켓AI 운영자 전용 화면입니다.</p>

          <div className="demo-hint">
            <b>데모 운영자 계정</b>
            <br />
            아이디: {ADMIN_DEMO.email} / 비밀번호: {ADMIN_DEMO.password}
            <button
              type="button"
              onClick={() => {
                setEmail(ADMIN_DEMO.email)
                setPassword(ADMIN_DEMO.password)
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
            <Field label="아이디(이메일)" required>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
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
            <Link to="/">← 서비스 홈으로</Link>
          </p>
        </div>
      </div>
    </>
  )
}
