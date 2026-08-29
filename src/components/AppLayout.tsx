import type { ReactNode } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { cartCount } from '../lib/cart'
import { useEffect, useState } from 'react'

const TABS = [
  { to: '/shop', label: '홈', icon: '🏠', end: true },
  { to: '/shop/sourcing', label: '소싱', icon: '🌱', end: false },
  { to: '/shop/studio', label: '콘텐츠', icon: '🎬', end: false },
  { to: '/shop/groupbuy', label: '공구', icon: '🤝', end: false },
  { to: '/shop/mypage', label: '마이', icon: '👤', end: false },
]

function nowClock() {
  const d = new Date()
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function AppLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { buyer, logoutBuyer } = useAuth()
  const [clock, setClock] = useState(nowClock())
  const [count, setCount] = useState(cartCount())

  useEffect(() => {
    const t = setInterval(() => setClock(nowClock()), 20000)
    const h = () => setCount(cartCount())
    window.addEventListener('cart-change', h)
    return () => {
      clearInterval(t)
      window.removeEventListener('cart-change', h)
    }
  }, [])

  return (
    <div className="app-bg">
      <div className="app-shell">
        {/* 모바일에서만: 상태바 */}
        <div className="app-status">
          <span>{clock}</span>
          <span className="dots">●●● 📶 ▮▮▮▯</span>
        </div>

        <header className="app-header">
          <div className="top">
            <NavLink to="/shop" end className="app-wordmark">
              <span className="wm-mark">🌾</span>영팜마켓<b>AI</b>
            </NavLink>

            {/* 데스크톱에서만: 상단 네비게이션 */}
            <nav className="app-topnav">
              {TABS.filter((t) => t.to !== '/shop/mypage').map((t) => (
                <NavLink key={t.to} to={t.to} end={t.end}>
                  {t.label}
                </NavLink>
              ))}
            </nav>

            <div className="row" style={{ gap: 8 }}>
              <button className="ico-btn" onClick={() => navigate('/cart')} aria-label="장바구니">
                🛒{count > 0 && <span className="dot-badge" />}
              </button>
              {buyer ? (
                <>
                  <button className="ico-btn app-desktop-only" onClick={() => navigate('/shop/mypage')} aria-label="마이페이지">
                    👤
                  </button>
                  <button
                    className="btn btn-ghost btn-sm app-desktop-only"
                    onClick={() => {
                      logoutBuyer()
                      navigate('/shop')
                    }}
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-outline btn-sm app-desktop-only"
                  onClick={() => navigate('/shop/login')}
                >
                  로그인
                </button>
              )}
              <button
                className="ico-btn app-mobile-only"
                onClick={() => navigate(buyer ? '/shop/mypage' : '/shop/login')}
                aria-label="알림"
              >
                🔔<span className="dot-badge" />
              </button>
            </div>
          </div>

          <button className="app-search" onClick={() => navigate('/shop/search')}>
            🔍 농산물, 농장, 지역을 검색하세요
          </button>
        </header>

        <div className="app-scroll">{children}</div>

        {/* 모바일에서만: 하단 탭바 */}
        <nav className="app-tabbar">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}>
              <span className="t-ico">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
