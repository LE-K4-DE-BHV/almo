import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import * as authApi from '../api/auth'
import { ApiError } from '../api/client'

/** Reached via the link in the password-reset email, e.g. /reset-password?token=... */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await authApi.confirmPasswordReset(token, newPassword)
      navigate('/login')
    } catch (e) {
      // Covers both "wrong/expired token" (see InvalidResetTokenException on the backend) and a
      // missing token param.
      setError(e instanceof ApiError ? e.message : 'Reset failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return <p role="alert">This reset link is missing its token.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Set a new password</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        New password
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : 'Set new password'}
      </button>
    </form>
  )
}
