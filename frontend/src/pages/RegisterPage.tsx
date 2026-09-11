import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { ApiError } from '../api/client'

export function RegisterPage() {
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
      setError(e instanceof ApiError ? e.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>Register</h1>
      {error && <p role="alert">{error}</p>}
      <label>
        Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </label>
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
      <label>
        Password
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
        {submitting ? 'Creating account...' : 'Register'}
      </button>
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </form>
  )
}
