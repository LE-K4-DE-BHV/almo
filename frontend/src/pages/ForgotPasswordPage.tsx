import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import * as authApi from '../api/auth'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
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
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-6 py-10">
        <p className="rounded border border-brand-border bg-brand-surface p-6 text-sm">
          {t('forgot_password_success')}
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
        <h1 className="text-2xl font-semibold">{t('forgot_password_title')}</h1>
        <label className="flex flex-col gap-1 text-sm">
          {t('forgot_password_email')}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
        >
          {submitting ? t('forgot_password_submitting') : t('forgot_password_submit')}
        </button>
      </form>
    </div>
  )
}
