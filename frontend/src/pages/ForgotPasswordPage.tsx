import { useState, type FormEvent } from 'react'
import * as authApi from '../api/auth'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  // No error state on purpose: the backend always returns 202 regardless of whether the email
  // exists (see AuthService.requestPasswordReset) - showing a distinct error here would undo
  // that anti-enumeration protection.
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await authApi.requestPasswordReset(email)
    } finally {
      setSubmitting(false)
      setSubmitted(true)
    }
  }

  if (submitted) {
    return <p>If that email is registered, a reset link is on its way.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Forgot password</h1>
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
      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send reset link'}
      </button>
    </form>
  )
}
