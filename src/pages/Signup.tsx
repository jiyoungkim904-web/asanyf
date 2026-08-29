import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PublicLayout } from '../components/Layout'
import { Button, Field, Notice } from '../components/ui'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

// 전국 시·도
const REGIONS = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시',
  '대전광역시', '울산광역시', '세종특별자치시',
  '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
]

interface Form {
  farmName: string
  ownerName: string
  phone: string
  email: string
  password: string
  region: string
  agree: boolean
}

export default function Signup() {
  const navigate = useNavigate()
  const { loginFarm } = useAuth()
  const [form, setForm] = useState<Form>({
    farmName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    region: REGIONS[0],
    agree: false,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }))
    setErrors((e) => ({ ...e, [k]: undefined }))
  }

  function validate() {
    const e: Partial<Record<keyof Form, string>> = {}
    if (!form.farmName.trim()) e.farmName = '농가명을 입력해 주세요.'
    if (!form.ownerName.trim()) e.ownerName = '대표자명을 입력해 주세요.'
    if (!/^[0-9-]{9,13}$/.test(form.phone.trim())) e.phone = '연락처를 정확히 입력해 주세요. (예: 010-1234-5678)'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = '이메일 형식이 올바르지 않습니다.'
    if (form.password.length < 6) e.password = '비밀번호는 6자 이상으로 설정해 주세요.'
    if (!form.agree) e.agree = '서비스 이용약관에 동의해 주세요.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault()
    setServerError('')
    if (!validate()) return
    setLoading(true)
    try {
      const farm = await api.signup({
        farmName: form.farmName.trim(),
        ownerName: form.ownerName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        region: form.region,
      })
      loginFarm(farm)
      navigate('/products/new', { replace: true })
    } catch (err) {
      setServerError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicLayout>
      <div className="auth-wrap">
        <div className="auth-card" style={{ maxWidth: 520 }}>
          <h1>농가 회원가입</h1>
          <p className="sub">가입 후 바로 농산물 정보를 등록할 수 있어요.</p>

          {serverError && (
            <div style={{ marginBottom: 16 }}>
              <Notice tone="danger">{serverError}</Notice>
            </div>
          )}

          <form className="stack" onSubmit={onSubmit} noValidate>
            <Field label="농가명" required error={errors.farmName}>
              <input
                className={`input ${errors.farmName ? 'has-error' : ''}`}
                placeholder="예: 아산 햇살농원"
                value={form.farmName}
                onChange={(e) => set('farmName', e.target.value)}
              />
            </Field>

            <div className="form-grid-2">
              <Field label="대표자명" required error={errors.ownerName}>
                <input
                  className={`input ${errors.ownerName ? 'has-error' : ''}`}
                  placeholder="예: 김영수"
                  value={form.ownerName}
                  onChange={(e) => set('ownerName', e.target.value)}
                />
              </Field>
              <Field label="연락처" required error={errors.phone}>
                <input
                  className={`input ${errors.phone ? 'has-error' : ''}`}
                  placeholder="010-1234-5678"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </Field>
            </div>

            <Field label="이메일" required hint="로그인할 때 사용합니다." error={errors.email}>
              <input
                className={`input ${errors.email ? 'has-error' : ''}`}
                placeholder="farm@example.com"
                inputMode="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>

            <Field label="비밀번호" required hint="6자 이상" error={errors.password}>
              <input
                className={`input ${errors.password ? 'has-error' : ''}`}
                type="password"
                placeholder="비밀번호"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
              />
            </Field>

            <Field label="농가 지역" required>
              <select className="select" value={form.region} onChange={(e) => set('region', e.target.value)}>
                {REGIONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>

            <div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={form.agree}
                  onChange={(e) => set('agree', e.target.checked)}
                />
                <span>
                  <b>[필수]</b> 서비스 이용약관 및 개인정보 수집·이용에 동의합니다.
                  <br />
                  <span className="muted" style={{ fontSize: 13 }}>
                    입력한 농산물 정보와 사진은 콘텐츠 제작 목적으로만 사용됩니다.
                  </span>
                </span>
              </label>
              {errors.agree && <span className="field-error">{errors.agree}</span>}
            </div>

            <Button type="submit" size="lg" block loading={loading}>
              가입하고 농산물 등록하기
            </Button>
          </form>

          <p className="auth-alt">
            이미 계정이 있으신가요? <Link to="/login">로그인</Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  )
}
