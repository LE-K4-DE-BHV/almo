import { apiFetch } from './client'
import type { ContactPreference } from './orders'

export type AdminCategory = {
  id: number
  key: string
  translations: Record<string, string>
}

export type AdminCategoryRequest = {
  key: string
  translations: Record<string, string>
}

export type ProductTranslation = {
  name: string
  description: string
  details: string[]
}

export type AdminProduct = {
  id: number
  categoryId: number
  price: number
  compareAtPrice: number | null
  stockQuantity: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  metalColor: string | null
  badge: string | null
  imageRefs: string[]
  translations: Record<string, ProductTranslation>
}

export type AdminProductRequest = {
  categoryId: number
  price: number
  compareAtPrice: number | null
  stockQuantity: number
  metalColor: string | null
  badge: string | null
  translations: Record<string, ProductTranslation>
}

export type AdminOrder = {
  id: number
  orderNumber: string
  customerName: string
  customerEmail: string
  status: 'OPEN' | 'CONTACTED' | 'DONE'
  contactPreference: ContactPreference
  shippingName: string
  shippingAddress: string
  shippingCity: string
  shippingCost: number
  items: { productId: number; productName: string; quantity: number; priceAtOrder: number; lineTotal: number }[]
  itemsTotal: number
  total: number
  createdAt: string
}

export type AdminReview = {
  id: number
  productId: number
  productName: string
  userName: string
  rating: number
  comment: string | null
  status: 'PUBLISHED' | 'HIDDEN'
  createdAt: string
}

// Categories
export const fetchAdminCategories = () => apiFetch<AdminCategory[]>('/api/admin/categories')
export const fetchAdminCategory = (id: number) => apiFetch<AdminCategory>(`/api/admin/categories/${id}`)
export const createAdminCategory = (body: AdminCategoryRequest) =>
  apiFetch<AdminCategory>('/api/admin/categories', { method: 'POST', body })
export const updateAdminCategory = (id: number, body: AdminCategoryRequest) =>
  apiFetch<AdminCategory>(`/api/admin/categories/${id}`, { method: 'PUT', body })
export const deleteAdminCategory = (id: number) =>
  apiFetch<void>(`/api/admin/categories/${id}`, { method: 'DELETE' })

// Products
export const fetchAdminProducts = () => apiFetch<AdminProduct[]>('/api/admin/products')
export const fetchAdminProduct = (id: number) => apiFetch<AdminProduct>(`/api/admin/products/${id}`)
export const createAdminProduct = (body: AdminProductRequest) =>
  apiFetch<AdminProduct>('/api/admin/products', { method: 'POST', body })
export const updateAdminProduct = (id: number, body: AdminProductRequest) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}`, { method: 'PUT', body })
export const deleteAdminProduct = (id: number) =>
  apiFetch<void>(`/api/admin/products/${id}`, { method: 'DELETE' })

/** Not routed through apiFetch's JSON body handling - this is a multipart upload. */
export async function uploadProductImage(id: number, file: File): Promise<AdminProduct> {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  const token = match ? decodeURIComponent(match[1]) : null
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`/api/admin/products/${id}/images`, {
    method: 'POST',
    headers: token ? { 'X-XSRF-TOKEN': token } : undefined,
    credentials: 'same-origin',
    body: formData,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data?.message ?? response.statusText)
  return data as AdminProduct
}

export const removeProductImage = (id: number, url: string) =>
  apiFetch<AdminProduct>(`/api/admin/products/${id}/images?url=${encodeURIComponent(url)}`, {
    method: 'DELETE',
  })

// Orders
export const fetchAdminOrders = () => apiFetch<AdminOrder[]>('/api/admin/orders')
export const updateAdminOrderStatus = (id: number, status: AdminOrder['status']) =>
  apiFetch<AdminOrder>(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status } })

// Reviews
export const fetchAdminReviews = () => apiFetch<AdminReview[]>('/api/admin/reviews')
export const updateAdminReview = (id: number, status: AdminReview['status'], rating: number) =>
  apiFetch<void>(`/api/admin/reviews/${id}`, { method: 'PATCH', body: { status, rating } })

// Staff - ADMIN-only on the backend (SecurityConfig), not reachable by a STAFF session
export type AdminStaff = {
  id: number
  email: string
  name: string
  createdAt: string
}

export const fetchAdminStaff = () => apiFetch<AdminStaff[]>('/api/admin/staff')
export const createAdminStaff = (email: string, name: string) =>
  apiFetch<AdminStaff>('/api/admin/staff', { method: 'POST', body: { email, name } })
export const deleteAdminStaff = (id: number) =>
  apiFetch<void>(`/api/admin/staff/${id}`, { method: 'DELETE' })
