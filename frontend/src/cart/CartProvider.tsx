import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as cartApi from '../api/cart'
import type { Cart } from '../api/cart'
import { CartContext, EMPTY_CART } from './CartContext'

export function CartProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(true)
  // Guards against out-of-order responses: the initial mount's GET /api/cart and a fast
  // mutation (addItem/updateItem/removeItem) racing each other can resolve in either order.
  // Without this, a slow initial GET resolving *after* an addItem call clobbers the just-added
  // item back to the stale pre-add state - only the response to the most recently issued
  // request is ever applied, so a late straggler is silently dropped instead of winning.
  const latestRequestId = useRef(0)

  async function applyLatest(promise: Promise<Cart>) {
    const requestId = ++latestRequestId.current
    const result = await promise
    if (requestId === latestRequestId.current) setCart(result)
  }

  async function refresh() {
    await applyLatest(cartApi.fetchCart(i18n.language))
  }

  useEffect(() => {
    // Works for guests too (see backend CartController) - a cart exists before login, not just
    // after, so there's no "wait for auth" gate here like WishlistProvider has.
    refresh().finally(() => setLoading(false))
  }, [i18n.language])

  async function addItem(productId: number, quantity: number) {
    await applyLatest(cartApi.addToCart(productId, quantity, i18n.language))
  }

  async function updateItem(itemId: number, quantity: number) {
    await applyLatest(cartApi.updateCartItem(itemId, quantity, i18n.language))
  }

  async function removeItem(itemId: number) {
    await applyLatest(cartApi.removeCartItem(itemId, i18n.language))
  }

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  )
}
