import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { ApiError } from '../api/client'

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const { refresh: refreshCart } = useCart()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      // Picks up whatever the backend just merged the guest cart into (see
      // CartService.mergeGuestCartIntoUser) - without this the header/cart page would keep
      // showing the pre-login guest cart until something else happened to refetch it.
      await refreshCart()
      navigate('/account')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('login_error_generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded border border-brand-border bg-brand-surface p-6"
      >
        <h1 className="text-2xl font-semibold">{t('login_title')}</h1>
        {error && (
          <p role="alert" className="text-sm text-brand-sale">
            {error}
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t('login_email')}
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
          {t('login_password')}
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
          {submitting ? t('login_submitting') : t('login_submit')}
        </button>
        <p className="text-sm text-brand-text-muted">
          <Link to="/forgot-password" className="underline hover:text-brand-text">
            {t('login_forgot_password')}
          </Link>
        </p>
        <p className="text-sm text-brand-text-muted">
          {t('login_no_account')}{' '}
          <Link to="/register" className="underline hover:text-brand-text">
            {t('login_register_link')}
          </Link>
        </p>
      </form>
    </div>
  )
}
