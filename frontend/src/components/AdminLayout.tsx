import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-brand-text text-white' : 'text-brand-text hover:bg-brand-bg'
  }`

/**
 * Wraps every /admin/* route below the top-level login (see AppRouter) - deliberately its own
 * chrome, not <Layout>, since the admin area isn't part of the shop-facing site (see AppRouter's
 * comment on why admin routes sit outside <Layout>).
 */
export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-brand-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-y-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-lg font-semibold">Almo Admin</span>
            <nav className="flex flex-wrap gap-1">
              <NavLink to="/admin/products" className={navLinkClass}>
                Products
              </NavLink>
              <NavLink to="/admin/categories" className={navLinkClass}>
                Categories
              </NavLink>
              <NavLink to="/admin/orders" className={navLinkClass}>
                Orders
              </NavLink>
              <NavLink to="/admin/reviews" className={navLinkClass}>
                Reviews
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-brand-text-muted">{user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded border border-brand-border px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-brand-bg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
