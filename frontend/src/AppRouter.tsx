import { Routes, Route, Navigate } from 'react-router'
import { Layout } from './components/Layout'
import { AdminLayout } from './components/AdminLayout'
import { HomePage } from './pages/HomePage'
import { ShopPage } from './pages/ShopPage'
import { ProductPage } from './pages/ProductPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { OrderConfirmationPage } from './pages/OrderConfirmationPage'
import { WishlistPage } from './pages/WishlistPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AccountPage } from './pages/AccountPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminProductFormPage } from './pages/admin/AdminProductFormPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminReviewsPage } from './pages/admin/AdminReviewsPage'
import { AdminProfilePage } from './pages/admin/AdminProfilePage'
import { RequireAuth } from './auth/RequireAuth'
import { RequireAdmin } from './auth/RequireAdmin'

/**
 * Kept separate from main.tsx so AuthProvider (which needs to sit above this, see main.tsx) isn't
 * forced into the same file as the route table.
 *
 * Admin routes deliberately sit outside <Layout> (no shop header/footer) - the admin area is a
 * separate context, matching the backend's separate /api/admin/auth/* endpoint and filter chain.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/products/:id" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
        <Route
          path="/wishlist"
          element={
            <RequireAuth>
              <WishlistPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<Navigate to="/admin/products" replace />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<AdminProductFormPage />} />
        <Route path="products/:id" element={<AdminProductFormPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
    </Routes>
  )
}
