import { apiFetch } from './client'

export type Role = 'CUSTOMER' | 'ADMIN'

export type UserResponse = {
  id: number
  email: string
  name: string
  role: Role
}

export function register(email: string, password: string, name: string) {
  return apiFetch<UserResponse>('/api/auth/register', {
    method: 'POST',
    body: { email, password, name },
  })
}

export function login(email: string, password: string) {
  return apiFetch<UserResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function adminLogin(email: string, password: string) {
  return apiFetch<UserResponse>('/api/admin/auth/login', {
    method: 'POST',
    body: { email, password },
  })
}

export function logout() {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' })
}

export function updateProfile(email: string, name: string, newPassword: string) {
  return apiFetch<UserResponse>('/api/auth/me', {
    method: 'PATCH',
    // Empty string, not omitted - the backend treats blank/null the same ("keep current
    // password"), and JSON.stringify would otherwise drop an omitted key inconsistently depending
    // on how the body object is built.
    body: { email, name, newPassword: newPassword || null },
  })
}

export function deleteAccount() {
  return apiFetch<void>('/api/auth/me', { method: 'DELETE' })
}

export function me() {
  return apiFetch<UserResponse>('/api/auth/me')
}

export function requestPasswordReset(email: string) {
  return apiFetch<void>('/api/auth/password-reset/request', {
    method: 'POST',
    body: { email },
  })
}

export function confirmPasswordReset(token: string, newPassword: string) {
  return apiFetch<void>('/api/auth/password-reset/confirm', {
    method: 'POST',
    body: { token, newPassword },
  })
}
