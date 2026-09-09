import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { resetAll } from '../../lib/db'
import { formatDateTime } from '../../lib/format'
import { Button, Field, Notice } from '../../components/ui'

const PERMISSIONS = [
  { ico: '🔎', title: '콘텐츠 검수', desc: 'AI가 만든 상세페이지·숏폼 스크립트를 검수하고 승인·반려합니다.' },
  { ico: '🌱', title: '농가 관리', desc: '가입 농가와 등록 농산물, 판매 상품을 열람합니다.' },
  { ico: '📊', title: '커머스·매출 모니터링', desc: '소싱·공동구매·정기구독·건별 결제 등 수익모델별 현황을 봅니다.' },
]

export default function AdminAccount() {
  const { admin, loginAdmin, logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(admin?.name ?? '')
  const [saved, setSaved] = useState(false)

  if (!admin) return null

  const dirty = name.trim() !== admin.name && name.trim().length > 0

  function saveName() {
    if (!admin || !dirty) return
    loginAdmin({ ...admin, name: name.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="page">
      <div className="container stack" style={{ gap: 24, maxWidth: 720 }}>
        <div>
          <h1 className="section-title" style={{ fontSize: 22 }}>
            내 계정
          </h1>
          <p className="muted">영팜마켓AI 운영자 계정 정보와 권한을 관리합니다.</p>
        </div>

        {saved && <Notice tone="ok">표시 이름이 저장되었습니다.</Notice>}

        {/* 계정 정보 */}
        <div className="card card-pad stack" style={{ gap: 18 }}>
          <b style={{ fontSize: 15 }}>계정 정보</b>
          <div className="review-card">
            <dl>
              <dt>이메일</dt>
              <dd>{admin.email}</dd>
              <dt>역할</dt>
              <dd>{admin.role ?? '운영자'}</dd>
              <dt>이번 로그인</dt>
              <dd>{formatDateTime(admin.loginAt)}</dd>
            </dl>
          </div>

          <Field label="표시 이름" hint="검수 메모·활동 기록에 표시되는 이름입니다.">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
          </Field>
          <div>
            <Button onClick={saveName} disabled={!dirty}>
              이름 저장
            </Button>
          </div>
        </div>

        {/* 권한 */}
        <div className="card card-pad stack" style={{ gap: 14 }}>
          <b style={{ fontSize: 15 }}>이 계정의 권한</b>
          {PERMISSIONS.map((p) => (
            <div key={p.title} className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20 }}>{p.ico}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
                <div className="muted" style={{ fontSize: 13 }}>{p.desc}</div>
              </div>
            </div>
          ))}
          <Notice tone="info">
            프로토타입에서는 운영자 계정이 <b>1개(데모)</b>로 고정됩니다. 실제 서비스에서는 운영자 초대·역할별
            권한 분리가 이 화면에서 이뤄집니다.
          </Notice>
        </div>

        {/* 보안·세션 */}
        <div className="card card-pad stack" style={{ gap: 14 }}>
          <b style={{ fontSize: 15 }}>보안 · 세션</b>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <Button variant="outline" disabled title="프로토타입에서는 비밀번호가 고정되어 있습니다">
              비밀번호 변경 (준비 중)
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                logoutAdmin()
                navigate('/admin/login')
              }}
            >
              로그아웃
            </Button>
          </div>
          <div className="divider" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>데모 데이터 초기화</div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>
              모든 농가·콘텐츠·주문 데이터를 처음(데모) 상태로 되돌립니다.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('모든 데이터를 처음 상태(데모 데이터)로 되돌릴까요?')) {
                  resetAll()
                  location.href = '/admin'
                }
              }}
            >
              데모 데이터 초기화
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
