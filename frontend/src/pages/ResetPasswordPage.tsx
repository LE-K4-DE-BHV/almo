import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import * as authApi from '../api/auth'
import { ApiError } from '../api/client'

/** Reached via the link in the password-reset email, e.g. /reset-password?token=... */
export function ResetPasswordPage() {
  const { t } = useTranslation()
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
      setError(e instanceof ApiError ? e.message : t('reset_password_error_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return <p role="alert">{t('reset_password_missing_token')}</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{t('reset_password_title')}</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        {t('reset_password_new_password')}
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
        {submitting ? t('reset_password_submitting') : t('reset_password_submit')}
      </button>
    </form>
  )
}
