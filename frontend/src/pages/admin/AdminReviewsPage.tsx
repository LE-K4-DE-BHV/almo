import { useEffect, useState } from 'react'
import * as adminApi from '../../api/admin'
import type { AdminReview } from '../../api/admin'
import { ApiError } from '../../api/client'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium' }).format(new Date(iso))
}

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminApi
      .fetchAdminReviews()
      .then(setReviews)
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdate(review: AdminReview, status: AdminReview['status'], rating: number) {
    setError(null)
    try {
      await adminApi.updateAdminReview(review.id, status, rating)
      setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, status, rating } : r)))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update review')
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Reviews</h1>

      {error && (
        <p role="alert" className="mb-4 text-sm text-brand-sale">
          {error}
        </p>
      )}

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-text-muted">
            <th className="py-2 pr-4">Product</th>
            <th className="py-2 pr-4">User</th>
            <th className="py-2 pr-4">Rating</th>
            <th className="py-2 pr-4">Comment</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id} className="border-b border-brand-border align-top">
              <td className="py-2 pr-4">{review.productName}</td>
              <td className="py-2 pr-4">{review.userName}</td>
              <td className="py-2 pr-4">
                <select
                  value={review.rating}
                  onChange={(e) => handleUpdate(review, review.status, Number(e.target.value))}
                  className="rounded border border-brand-border px-2 py-1"
                >
                  {[1, 2, 3, 4, 5].map((r) => (
                    <option key={r} value={r}>
                      {r} ★
                    </option>
                  ))}
                </select>
              </td>
              <td className="max-w-xs py-2 pr-4">{review.comment}</td>
              <td className="py-2 pr-4">{formatDate(review.createdAt)}</td>
              <td className="py-2 pr-4">
                <select
                  value={review.status}
                  onChange={(e) =>
                    handleUpdate(review, e.target.value as AdminReview['status'], review.rating)
                  }
                  className="rounded border border-brand-border px-2 py-1"
                >
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="HIDDEN">HIDDEN</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {reviews.length === 0 && <p className="mt-6 text-brand-text-muted">No reviews yet.</p>}
    </div>
  )
}
