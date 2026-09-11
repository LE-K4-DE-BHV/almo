import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useWishlist } from '../wishlist/useWishlist'
import { ProductCard } from '../components/ProductCard'

export function WishlistPage() {
  const { t } = useTranslation()
  const { items, loading } = useWishlist()

  if (loading) return null

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="mb-4 text-2xl font-semibold">{t('wishlist_title')}</h1>
        <p className="mb-6 text-brand-text-muted">{t('wishlist_empty')}</p>
        <Link
          to="/shop"
          className="inline-block rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black"
        >
          {t('cart_continue_shopping')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{t('wishlist_title')}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
