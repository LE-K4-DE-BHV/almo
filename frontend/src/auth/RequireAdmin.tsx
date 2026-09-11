import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './useAuth'

/** Wrap an /admin/* route element with this - redirects anyone but a logged-in ADMIN. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user || user.role !== 'ADMIN') return <Navigate to="/admin/login" replace />

  return children
}
