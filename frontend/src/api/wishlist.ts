import { apiFetch } from './client'
import type { Product } from './catalog'

export function fetchWishlist(lang: string) {
  return apiFetch<Product[]>(`/api/wishlist?lang=${encodeURIComponent(lang)}`)
}

export function addToWishlist(productId: number) {
  return apiFetch<void>('/api/wishlist/items', { method: 'POST', body: { productId } })
}

export function removeFromWishlist(productId: number) {
  return apiFetch<void>(`/api/wishlist/items/${productId}`, { method: 'DELETE' })
}
