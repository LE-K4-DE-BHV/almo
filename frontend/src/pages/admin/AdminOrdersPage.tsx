import { Fragment, useEffect, useState } from 'react'
import * as adminApi from '../../api/admin'
import type { AdminOrder } from '../../api/admin'
import { ApiError } from '../../api/client'
import { orderPdfUrl } from '../../api/orders'

const STATUSES: AdminOrder['status'][] = ['OPEN', 'CONTACTED', 'DONE']

function formatPrice(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    adminApi
      .fetchAdminOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [])

  async function handleStatusChange(order: AdminOrder, status: AdminOrder['status']) {
    setError(null)
    try {
      const updated = await adminApi.updateAdminOrderStatus(order.id, status)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update order status')
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Orders</h1>

      {error && (
        <p role="alert" className="mb-4 text-sm text-brand-sale">
          {error}
        </p>
      )}

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-brand-border text-xs uppercase tracking-wide text-brand-text-muted">
            <th className="py-2 pr-4">Order</th>
            <th className="py-2 pr-4">Customer</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Total</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4" />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <Fragment key={order.id}>
              <tr className="border-b border-brand-border">
                <td className="py-2 pr-4">{order.orderNumber}</td>
                <td className="py-2 pr-4">
                  {order.customerName}
                  <br />
                  <span className="text-brand-text-muted">{order.customerEmail}</span>
                </td>
                <td className="py-2 pr-4">{formatDate(order.createdAt)}</td>
                <td className="py-2 pr-4">{formatPrice(order.total)}</td>
                <td className="py-2 pr-4">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order, e.target.value as AdminOrder['status'])
                    }
                    className="rounded border border-brand-border px-2 py-1"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 pr-4 text-right">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    className="mr-3 text-brand-accent underline"
                  >
                    {expandedId === order.id ? 'Hide' : 'Details'}
                  </button>
                  <a href={orderPdfUrl(order.id)} className="text-brand-accent underline">
                    PDF
                  </a>
                </td>
              </tr>
              {expandedId === order.id && (
                <tr className="border-b border-brand-border bg-brand-bg">
                  <td colSpan={6} className="py-3 pr-4">
                    <p className="mb-2">
                      {order.shippingName}, {order.shippingAddress}, {order.shippingCity} ·{' '}
                      {order.contactPreference}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {order.items.map((item) => (
                        <li key={item.productId} className="flex justify-between">
                          <span>
                            {item.quantity}× {item.productName}
                          </span>
                          <span>{formatPrice(item.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 flex justify-between border-t border-brand-border pt-2">
                      <span>Shipping</span>
                      <span>{formatPrice(order.shippingCost)}</span>
                    </p>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && <p className="mt-6 text-brand-text-muted">No orders yet.</p>}
    </div>
  )
}
