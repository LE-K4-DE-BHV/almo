import { apiFetch } from './client'

export type Category = {
  key: string
  name: string
}

export type Product = {
  id: number
  categoryKey: string
  categoryName: string
  name: string
  metalColor: string | null
  badge: string | null
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
  price: number
  compareAtPrice: number | null
  imageRefs: string[]
  avgRating: number | null
  reviewCount: number
}

export type ProductFilters = {
  lang: string
  category?: string
  minPrice?: number
  maxPrice?: number
  metalColor?: string
  availability?: string
  search?: string
  sort?: string
}

export function fetchCategories(lang: string) {
  return apiFetch<Category[]>(`/api/categories?lang=${encodeURIComponent(lang)}`)
}

export function fetchProducts(filters: ProductFilters) {
  const params = new URLSearchParams({ lang: filters.lang })
  if (filters.category) params.set('category', filters.category)
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.metalColor) params.set('metalColor', filters.metalColor)
  if (filters.availability) params.set('availability', filters.availability)
  if (filters.search) params.set('search', filters.search)
  if (filters.sort) params.set('sort', filters.sort)
  return apiFetch<Product[]>(`/api/products?${params.toString()}`)
}
