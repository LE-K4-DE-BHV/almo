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
    <form onSubmit={handleSubmit}>
      <h1>{t('register_title')}</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        {t('register_name')}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </label>
      <label>
        {t('register_email')}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label>
        {t('register_password')}
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? t('register_submitting') : t('register_submit')}
      </button>
      <p>
        {t('register_have_account')} <Link to="/login">{t('register_login_link')}</Link>
      </p>
    </form>
  )
}
