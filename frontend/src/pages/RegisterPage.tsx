import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { ApiError } from '../api/client'

export function RegisterPage() {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const { refresh: refreshCart } = useCart()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Registering logs the user in immediately (see AuthController.register on the backend).
      await register(email, password, name)
      await refreshCart() // picks up the guest cart the backend just merged in, see LoginPage
      navigate('/account')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('register_error_generic'))
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
        <h1 className="text-2xl font-semibold">{t('register_title')}</h1>
        {error && (
          <p role="alert" className="text-sm text-brand-sale">
            {error}
          </p>
        )}
        <label className="flex flex-col gap-1 text-sm">
          {t('register_name')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('register_email')}
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
          {t('register_password')}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? t('register_submitting') : t('register_submit')}
        </button>
        <p className="text-sm text-brand-text-muted">
          {t('register_have_account')}{' '}
          <Link to="/login" className="underline hover:text-brand-text">
            {t('register_login_link')}
          </Link>
        </p>
      </form>
    </div>
  )
}
