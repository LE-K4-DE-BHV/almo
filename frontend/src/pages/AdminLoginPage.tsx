import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../api/client'

/**
 * Deliberately its own page/route, not a toggle on LoginPage - mirrors the backend's separate
 * /api/admin/auth/login endpoint and filter chain (see Sprint 1 decision in docs/backlog.md).
 */
export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { adminLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await adminLogin(email, password)
      navigate('/admin')
    } catch (e) {
      // Same generic message for wrong password and "valid customer, not an admin" - see
      // AdminAuthController on the backend.
      setError(e instanceof ApiError ? e.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded border border-brand-border bg-brand-surface p-6"
      >
        <h1 className="text-2xl font-semibold">Admin login</h1>
        {error && (
          <p role="alert" className="text-sm text-brand-sale">
            {error}
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
        >
          {submitting ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
