import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { resetAll } from '../lib/db'

function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="mark">🌾</span>
      영팜마켓<span style={{ color: 'var(--brand-700)' }}>AI</span>
    </Link>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="f-brand">🌾 영팜마켓AI</div>
        <p>농산물 정보만 입력하면, AI가 우리 농가의 이야기를 콘텐츠로 만들어드립니다.</p>
        <p style={{ marginTop: 12, opacity: 0.7 }}>
          <Link to="/shop">농산물 스토어</Link> · <Link to="/admin/login">운영자 로그인</Link>
          {' · '}
          <button
            className="linklike"
            onClick={() => {
              if (confirm('모든 데이터를 처음 상태(데모 데이터)로 되돌릴까요?')) {
                resetAll()
                location.href = '/'
              }
            }}
          >
            데모 데이터 초기화
          </button>
        </p>
      </div>
    </footer>
  )
}

/** 로그인 전 공개 페이지용 헤더 (랜딩/가입/로그인) */
export function PublicLayout({ children }: { children: ReactNode }) {
  const { farm } = useAuth()
  return (
    <>
      <header className="site-header">
        <div className="container inner">
          <Brand />
          <nav className="header-nav">
            <NavLink to="/shop">농산물 스토어</NavLink>
            <NavLink to="/pricing">요금제</NavLink>
            {farm ? (
              <NavLink to="/dashboard">내 농가</NavLink>
            ) : (
              <>
                <NavLink to="/login">로그인</NavLink>
                <Link to="/signup" className="btn btn-primary btn-sm">
                  농가 회원가입
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      {children}
      <Footer />
    </>
  )
}

/** 로그인한 농가용 헤더 */
export function FarmLayout({ children }: { children: ReactNode }) {
  const { logoutFarm } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="site-header">
        <div className="container inner">
          <Brand />
          <nav className="header-nav">
            <NavLink to="/dashboard">대시보드</NavLink>
            <NavLink to="/contents">콘텐츠</NavLink>
            <NavLink to="/studio">영상 제작</NavLink>
            <NavLink to="/store">판매</NavLink>
            <NavLink to="/billing">예치금</NavLink>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logoutFarm()
                navigate('/')
              }}
            >
              로그아웃
            </button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
    </>
  )
}
