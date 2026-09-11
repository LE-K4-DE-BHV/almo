import { useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'

/** Placeholder landing page after admin login - the real admin dashboard is Sprint 5. */
export function AdminHomePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div>
      <h1>Admin</h1>
      <p>Logged in as {user?.name}.</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
