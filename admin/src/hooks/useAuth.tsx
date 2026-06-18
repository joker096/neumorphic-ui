import { createContext, useContext, useState, ReactNode } from 'react'
import { api } from '../api/client'

interface AuthContextType {
  token: string | null
  login: (username: string, password: string) => Promise<{ sessionToken: string }>
  verify2FA: (code: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  needs2FA: boolean
  sessionToken: string | null
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('admin_token'))
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [needs2FA, setNeeds2FA] = useState(false)

  const login = async (username: string, password: string) => {
    const res = await api.login(username, password)
    setSessionToken(res.sessionToken)
    setNeeds2FA(true)
    return { sessionToken: res.sessionToken }
  }

  const verify2FA = async (code: string) => {
    if (!sessionToken) throw new Error('No session token')
    const res = await api.verify2FA(sessionToken, code)
    setToken(res.token)
    setNeeds2FA(false)
    sessionStorage.setItem('admin_token', res.token)
  }

  const logout = () => {
    api.logout().catch(() => {})
    setToken(null)
    setSessionToken(null)
    setNeeds2FA(false)
    sessionStorage.removeItem('admin_token')
  }

  return (
    <AuthContext.Provider value={{
      token, login, verify2FA, logout,
      isAuthenticated: !!token,
      needs2FA, sessionToken,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
