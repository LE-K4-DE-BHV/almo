import { Routes, Route } from 'react-router'
import App from './App'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { AccountPage } from './pages/AccountPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminHomePage } from './pages/AdminHomePage'
import { RequireAuth } from './auth/RequireAuth'
import { RequireAdmin } from './auth/RequireAdmin'

/**
 * Kept separate from main.tsx so AuthProvider (which needs to sit above this, see main.tsx) isn't
 * forced into the same file as the route table.
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
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
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminHomePage />
          </RequireAdmin>
        }
      />
    </Routes>
  )
}
