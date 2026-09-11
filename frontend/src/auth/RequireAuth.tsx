import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from './useAuth'

/** Wrap a route element with this to redirect anonymous visitors to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  // Wait for the initial /api/auth/me check (see AuthContext) before deciding - redirecting
  // immediately would bounce a logged-in user on every page refresh.
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  return children
}
