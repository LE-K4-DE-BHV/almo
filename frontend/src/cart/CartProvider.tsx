import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as cartApi from '../api/cart'
import { CartContext, EMPTY_CART } from './CartContext'

export function CartProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setCart(await cartApi.fetchCart(i18n.language))
  }

  useEffect(() => {
    // Works for guests too (see backend CartController) - a cart exists before login, not just
    // after, so there's no "wait for auth" gate here like WishlistProvider has.
    refresh().finally(() => setLoading(false))
  }, [i18n.language])

  async function addItem(productId: number, quantity: number) {
    setCart(await cartApi.addToCart(productId, quantity, i18n.language))
  }

  async function updateItem(itemId: number, quantity: number) {
    setCart(await cartApi.updateCartItem(itemId, quantity, i18n.language))
  }

  async function removeItem(itemId: number) {
    setCart(await cartApi.removeCartItem(itemId, i18n.language))
  }

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  )
}
