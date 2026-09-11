import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'

export function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!user) return null // RequireAuth (see AppRouter) already redirects before this renders

  return (
    <div>
      <h1>Account</h1>
      <p>
        Logged in as {user.name} ({user.email}), role {user.role}.
      </p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
