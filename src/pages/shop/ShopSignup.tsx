import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Button, Field, Notice } from '../../components/ui'

export default function ShopSignup() {
  const navigate = useNavigate()
  const { loginBuyer } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      setError('이름·이메일·비밀번호(6자 이상)를 확인해주세요.')
      return
    }
    setLoading(true)
    try {
      const b = await api.buyer.signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        address: form.address.trim(),
      })
      loginBuyer(b)
      navigate('/shop', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>구매자 회원가입</h1>
        <p className="sub">전국 농가의 농산물을 직접 구매·구독하세요.</p>

        {error && (
          <div style={{ marginBottom: 16 }}>
            <Notice tone="danger">{error}</Notice>
          </div>
        )}

        <form className="stack" onSubmit={onSubmit}>
          <Field label="이름" required>
            <input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="이메일" required>
            <input className="input" inputMode="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="비밀번호" required hint="6자 이상">
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </Field>
          <Field label="연락처">
            <input className="input" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="010-1234-5678" />
          </Field>
          <Field label="배송지">
            <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="배송받을 주소" />
          </Field>
          <Button type="submit" size="lg" block loading={loading}>
            가입하고 시작하기
          </Button>
        </form>

        <p className="auth-alt">
          이미 계정이 있으신가요? <Link to="/shop/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
