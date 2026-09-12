import { apiFetch } from './client'

export function subscribeToNewsletter(email: string) {
  return apiFetch<void>('/api/newsletter', { method: 'POST', body: { email } })
}
