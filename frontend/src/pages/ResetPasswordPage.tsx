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
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-6 py-10">
        <p role="alert" className="rounded border border-brand-border bg-brand-surface p-6 text-sm text-brand-sale">
          {t('reset_password_missing_token')}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded border border-brand-border bg-brand-surface p-6"
      >
        <h1 className="text-2xl font-semibold">{t('reset_password_title')}</h1>
        {error && (
          <p role="alert" className="text-sm text-brand-sale">
            {error}
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t('reset_password_new_password')}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
        >
          {submitting ? t('reset_password_submitting') : t('reset_password_submit')}
        </button>
      </form>
    </div>
  )
}
