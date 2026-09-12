import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { ApiError } from '../api/client'

/**
 * Still unstyled (plain browser form controls, no Tailwind) - functional since Sprint 1 to prove
 * the register/login/logout flow works end to end against the real backend, but the visual pass
 * that the rest of the storefront got in Sprint 2 never happened here. Not part of Sprint 6's
 * "close the remaining language gaps" task (see docs/backlog.md) - the strings are now translated,
 * the layout is a separate, still-open piece of work.
 */
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
    <form onSubmit={handleSubmit}>
      <h1>{t('login_title')}</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        {t('login_email')}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label>
        {t('login_password')}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? t('login_submitting') : t('login_submit')}
      </button>
      <p>
        <Link to="/forgot-password">{t('login_forgot_password')}</Link>
      </p>
      <p>
        {t('login_no_account')} <Link to="/register">{t('login_register_link')}</Link>
      </p>
    </form>
  )
}
