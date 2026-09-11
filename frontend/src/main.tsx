import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
// Must run before App renders: it synchronously registers i18next resources
// and picks the initial language, so the first render already has translations
// available instead of flashing untranslated keys.
import './i18n'
import { AuthProvider } from './auth/AuthProvider'
import { CartProvider } from './cart/CartProvider'
import { WishlistProvider } from './wishlist/WishlistProvider'
import { AppRouter } from './AppRouter'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {/* Needs useAuth (see WishlistProvider), so must sit inside AuthProvider. */}
          <WishlistProvider>
            <AppRouter />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
