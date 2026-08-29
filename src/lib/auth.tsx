import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { AdminUser, Buyer, Farm } from './types'

interface Session {
  farm?: Farm
  admin?: AdminUser
  buyer?: Buyer
}

interface AuthValue extends Session {
  loginFarm: (farm: Farm) => void
  logoutFarm: () => void
  loginAdmin: (admin: AdminUser) => void
  logoutAdmin: () => void
  loginBuyer: (buyer: Buyer) => void
  logoutBuyer: () => void
}

const KEY = 'youngfarm.session'
const AuthContext = createContext<AuthValue | null>(null)

function load(): Session {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(load)

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(session))
  }, [session])

  const value = useMemo<AuthValue>(
    () => ({
      farm: session.farm,
      admin: session.admin,
      buyer: session.buyer,
      loginFarm: (farm) => setSession((s) => ({ ...s, farm })),
      logoutFarm: () => setSession((s) => ({ ...s, farm: undefined })),
      loginAdmin: (admin) => setSession((s) => ({ ...s, admin })),
      logoutAdmin: () => setSession((s) => ({ ...s, admin: undefined })),
      loginBuyer: (buyer) => setSession((s) => ({ ...s, buyer })),
      logoutBuyer: () => setSession((s) => ({ ...s, buyer: undefined })),
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
