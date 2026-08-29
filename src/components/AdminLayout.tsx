import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export function AdminLayout({ children }: { children: ReactNode }) {
  const { admin, logoutAdmin } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      <header className="site-header">
        <div className="container inner">
          <Link to="/admin" className="brand">
            <span className="mark" style={{ background: 'linear-gradient(135deg,#3a4a63,#1f2a3d)' }}>
              🛠️
            </span>
            영팜마켓AI <span className="tag">운영자</span>
          </Link>
          <nav className="header-nav">
            <NavLink to="/admin" end>
              대시보드
            </NavLink>
            <NavLink to="/admin/contents">콘텐츠 요청</NavLink>
            <NavLink to="/admin/commerce">커머스</NavLink>
            <NavLink to="/admin/revenue">매출</NavLink>
            <span className="muted" style={{ fontSize: 14, marginLeft: 8 }}>
              {admin?.name}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                logoutAdmin()
                navigate('/admin/login')
              }}
            >
              로그아웃
            </button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </>
  )
}
