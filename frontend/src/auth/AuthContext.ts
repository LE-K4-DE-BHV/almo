import { createContext } from 'react'
import type { UserResponse } from '../api/auth'

export type AuthContextValue = {
  user: UserResponse | null
  // Distinguishes "we don't know yet" (still checking /api/auth/me) from "definitely logged out" -
  // without this, a page-load flash of "you're logged out" is unavoidable for a returning user.
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  adminLogin: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  updateProfile: (email: string, name: string, newPassword: string) => Promise<void>
  logout: () => Promise<void>
}

// Split from AuthProvider (AuthProvider.tsx) and useAuth (useAuth.ts): a file that exports only
// components, or only non-component values, keeps Vite's fast-refresh working - mixing them in
// one file breaks it.
export const AuthContext = createContext<AuthContextValue | null>(null)
