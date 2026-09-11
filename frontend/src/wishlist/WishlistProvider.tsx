import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import * as wishlistApi from '../api/wishlist'
import { useAuth } from '../auth/useAuth'
import { WishlistContext } from './WishlistContext'
import type { Product } from '../api/catalog'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // No guest wishlist (see backend WishlistController - the table has no session_id column),
    // so there's nothing to fetch until a user is actually logged in.
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    wishlistApi.fetchWishlist(i18n.language).then((result) => {
      setItems(result)
      setLoading(false)
    })
  }, [user, i18n.language])

  function isWishlisted(productId: number) {
    return items.some((item) => item.id === productId)
  }

  async function toggle(productId: number) {
    if (isWishlisted(productId)) {
      await wishlistApi.removeFromWishlist(productId)
      setItems((prev) => prev.filter((item) => item.id !== productId))
    } else {
      await wishlistApi.addToWishlist(productId)
      setItems(await wishlistApi.fetchWishlist(i18n.language))
    }
  }

  return (
    <WishlistContext.Provider value={{ items, loading, isWishlisted, toggle }}>
      {children}
    </WishlistContext.Provider>
  )
}
