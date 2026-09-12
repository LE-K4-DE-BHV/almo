import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './useAuth'

/**
 * Wrap an /admin/* route element with this - redirects anyone but a logged-in ADMIN or STAFF.
 * STAFF can reach every admin route except staff management itself, which the backend enforces
 * regardless (SecurityConfig) - AdminStaffPage does its own extra ADMIN-only check on top of this.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
