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
    return <p>{t('forgot_password_success')}</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>{t('forgot_password_title')}</h1>
      <label>
        {t('forgot_password_email')}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? t('forgot_password_submitting') : t('forgot_password_submit')}
      </button>
    </form>
  )
}
