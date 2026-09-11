import { Outlet } from 'react-router'
import { Header } from './Header'
import { Footer } from './Footer'

/** Wraps every route (see AppRouter) - matches the old static design, where every page included
    the same header/footer partials. */
export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
