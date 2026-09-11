import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../api/client'

/**
 * Functional placeholder, not the final design - real styling comes in Sprint 2 when
 * almofrontenddesign/login.html is ported over. This exists to prove the register/login/logout
 * flow works end to end against the real backend (see docs/backlog.md Sprint 1).
 */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/account')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Login</h1>
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
      <p>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </form>
  )
}
