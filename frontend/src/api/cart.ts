import { apiFetch } from './client'

export type CartItem = {
  id: number
  productId: number
  name: string
  imageRef: string | null
  price: number
  quantity: number
  lineTotal: number
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  totalQuantity: number
}

export function fetchCart(lang: string) {
  return apiFetch<Cart>(`/api/cart?lang=${encodeURIComponent(lang)}`)
}

export function addToCart(productId: number, quantity: number, lang: string) {
  return apiFetch<Cart>(`/api/cart/items?lang=${encodeURIComponent(lang)}`, {
    method: 'POST',
    body: { productId, quantity },
  })
}

export function updateCartItem(itemId: number, quantity: number, lang: string) {
  return apiFetch<Cart>(`/api/cart/items/${itemId}?lang=${encodeURIComponent(lang)}`, {
    method: 'PATCH',
    body: { quantity },
  })
}

export function removeCartItem(itemId: number, lang: string) {
  return apiFetch<Cart>(`/api/cart/items/${itemId}?lang=${encodeURIComponent(lang)}`, {
    method: 'DELETE',
  })
}
