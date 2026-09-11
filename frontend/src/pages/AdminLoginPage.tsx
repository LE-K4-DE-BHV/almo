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
    <form onSubmit={handleSubmit}>
      <h1>Admin login</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
