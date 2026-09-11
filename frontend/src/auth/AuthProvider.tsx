import { useEffect, useState, type ReactNode } from 'react'
import * as authApi from '../api/auth'
import type { UserResponse } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi
      .me()
      .then(setUser)
      .catch((e) => {
        // A 401 here just means "no active session" - not a real error, every fresh visitor hits
        // this. Anything else (network failure, 500) is worth knowing about during development.
        if (!(e instanceof ApiError && e.status === 401)) {
          console.error('Failed to check session', e)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    setUser(await authApi.login(email, password))
  }

  async function adminLogin(email: string, password: string) {
    setUser(await authApi.adminLogin(email, password))
  }

  async function register(email: string, password: string, name: string) {
    setUser(await authApi.register(email, password, name))
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
