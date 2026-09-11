import { createContext } from 'react'
import type { Product } from '../api/catalog'

export type WishlistContextValue = {
  items: Product[]
  loading: boolean
  isWishlisted: (productId: number) => boolean
  toggle: (productId: number) => Promise<void>
}

export const WishlistContext = createContext<WishlistContextValue | null>(null)
