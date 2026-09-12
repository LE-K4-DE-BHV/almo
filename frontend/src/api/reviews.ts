import { apiFetch } from './client'

export type Review = {
  id: number
  userName: string
  rating: number
  comment: string | null
  createdAt: string
}

export function fetchReviews(productId: number) {
  return apiFetch<Review[]>(`/api/products/${productId}/reviews`)
}

export function submitReview(productId: number, rating: number, comment: string) {
  return apiFetch<Review>(`/api/products/${productId}/reviews`, {
    method: 'POST',
    body: { rating, comment: comment.trim() || null },
  })
}
