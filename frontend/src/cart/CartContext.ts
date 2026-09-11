import { createContext } from 'react'
import type { Cart } from '../api/cart'

export type CartContextValue = {
  cart: Cart
  loading: boolean
  addItem: (productId: number, quantity: number) => Promise<void>
  updateItem: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  /** Called after login/register succeeds - picks up items the backend just merged in
      (see CartService.mergeGuestCartIntoUser), which this context has no other way to know about. */
  refresh: () => Promise<void>
}

export const EMPTY_CART: Cart = { items: [], subtotal: 0, totalQuantity: 0 }

export const CartContext = createContext<CartContextValue | null>(null)
