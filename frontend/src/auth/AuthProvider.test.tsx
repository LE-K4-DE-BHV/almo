import { act, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'
import { ApiError } from '../api/client'
import * as authApi from '../api/auth'

vi.mock('../api/auth')

/** Renders whatever useAuth() currently reports, so tests can assert on it via the DOM
    instead of reaching into React internals. */
function AuthProbe() {
  const { user, loading } = useAuth()
  if (loading) return <p>loading</p>
  return <p>{user ? `logged in as ${user.name}` : 'logged out'}</p>
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('starts loading and settles to logged-out when /api/auth/me returns 401', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('Unauthorized', 401))

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })

  it('picks up the session user once /api/auth/me resolves', async () => {
    vi.mocked(authApi.me).mockResolvedValue({
      id: 1,
      email: 'a@example.com',
      name: 'Ada',
      role: 'CUSTOMER',
    })

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('logged in as Ada')).toBeInTheDocument())
  })

  it('login() updates the user from the login response', async () => {
    vi.mocked(authApi.me).mockRejectedValue(new ApiError('Unauthorized', 401))
    vi.mocked(authApi.login).mockResolvedValue({
      id: 2,
      email: 'b@example.com',
      name: 'Bea',
      role: 'CUSTOMER',
    })

    function LoginProbe() {
      const { login } = useAuth()
      return <button onClick={() => login('b@example.com', 'pw')}>go</button>
    }

    render(
      <AuthProvider>
        <AuthProbe />
        <LoginProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
    await act(async () => {
      screen.getByText('go').click()
    })
    await waitFor(() => expect(screen.getByText('logged in as Bea')).toBeInTheDocument())
  })

  it('logout() clears the user', async () => {
    vi.mocked(authApi.me).mockResolvedValue({
      id: 1,
      email: 'a@example.com',
      name: 'Ada',
      role: 'CUSTOMER',
    })
    vi.mocked(authApi.logout).mockResolvedValue(undefined)

    function LogoutProbe() {
      const { logout } = useAuth()
      return <button onClick={() => logout()}>bye</button>
    }

    render(
      <AuthProvider>
        <AuthProbe />
        <LogoutProbe />
      </AuthProvider>,
    )

    await waitFor(() => expect(screen.getByText('logged in as Ada')).toBeInTheDocument())
    await act(async () => {
      screen.getByText('bye').click()
    })
    await waitFor(() => expect(screen.getByText('logged out')).toBeInTheDocument())
  })
})
