import { apiFetch } from './client'

export type ContactPreference = 'WHATSAPP' | 'EMAIL'

export type OrderItem = {
  productId: number
  productName: string
  quantity: number
  priceAtOrder: number
  lineTotal: number
}

export type OrderSummary = {
  id: number
  orderNumber: string
  status: 'OPEN' | 'CONTACTED' | 'DONE'
  createdAt: string
  total: number
}

export type OrderDetail = OrderSummary & {
  contactPreference: ContactPreference
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingCost: number
  items: OrderItem[]
  itemsTotal: number
}

export type CheckoutRequest = {
  name: string
  address: string
  city: string
  contactPreference: ContactPreference
}

export function checkout(request: CheckoutRequest) {
  return apiFetch<OrderDetail>('/api/checkout', { method: 'POST', body: request })
}

export function fetchOrders() {
  return apiFetch<OrderSummary[]>('/api/orders')
}

export function fetchOrder(id: number) {
  return apiFetch<OrderDetail>(`/api/orders/${id}`)
}

/** Not routed through apiFetch - this is a file download (browser handles Content-Disposition),
    not JSON. Callers just point a normal link at this URL. */
export function orderPdfUrl(id: number) {
  return `/api/orders/${id}/pdf`
}
