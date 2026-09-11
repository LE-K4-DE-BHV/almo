import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  fetchProduct,
  fetchProductsByIds,
  type ProductDetail,
  type Product,
} from '../api/catalog'
import { fetchReviews, type Review } from '../api/reviews'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { useWishlist } from '../wishlist/useWishlist'
import { ProductCard } from '../components/ProductCard'
import { recordView, getRecentlyViewed } from '../recentlyViewed'

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function ProductPage() {
  const { id } = useParams()
  const productId = Number(id)
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const navigate = useNavigate()

  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([])
  const [activeImage, setActiveImage] = useState(0)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setProduct(null)
    setActiveImage(0)
    fetchProduct(productId, i18n.language).then(setProduct)
    fetchReviews(productId).then(setReviews)
  }, [productId, i18n.language])

  const productLoaded = product !== null
  useEffect(() => {
    if (!productLoaded) return
    recordView(productId)
    // Excludes the product being viewed - "recently viewed" on its own page would just be itself.
    const otherIds = getRecentlyViewed().filter((viewedId) => viewedId !== productId)
    fetchProductsByIds(otherIds, i18n.language).then(setRecentlyViewed)
    // Depends on productLoaded (not `product` itself) on purpose: only the transition from "not
    // loaded" to "loaded" should re-trigger this, not every new object identity fetchProduct
    // returns - otherwise this would re-record the view and re-fetch "recently viewed" needlessly.
  }, [productId, i18n.language, productLoaded])

  if (!product) return null

  async function handleAddToCart() {
    setAdding(true)
    try {
      await addItem(productId, 1)
    } finally {
      setAdding(false)
    }
  }

  function handleToggleWishlist() {
    if (!user) {
      navigate('/login')
      return
    }
    toggle(productId)
  }

  const wishlisted = isWishlisted(productId)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 pb-24">
      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded border border-brand-border bg-brand-bg">
            {product.imageRefs[activeImage] && (
              <img
                src={product.imageRefs[activeImage]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {product.imageRefs.length > 1 && (
            <div className="mt-2 flex gap-2">
              {product.imageRefs.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-16 overflow-hidden rounded border ${index === activeImage ? 'border-brand-accent' : 'border-brand-border'}`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <span className="text-xs uppercase tracking-wide text-brand-text-muted">
            {product.categoryName}
          </span>
          <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>

          {product.reviewCount > 0 && product.avgRating != null && (
            <p className="mt-1 text-sm text-brand-text-muted">
              {'★'.repeat(Math.round(product.avgRating))}
              {'☆'.repeat(5 - Math.round(product.avgRating))}{' '}
              {t('reviews_count', { count: product.reviewCount })}
            </p>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-xl font-semibold">
              {formatPrice(product.price, i18n.language)}
            </span>
            {product.compareAtPrice && (
              <span className="text-brand-text-muted line-through">
                {formatPrice(product.compareAtPrice, i18n.language)}
              </span>
            )}
          </div>

          <p className="mt-4 text-brand-text-muted">{product.description}</p>

          {product.details.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide">
                {t('product_details_title')}
              </h2>
              <ul className="list-inside list-disc text-sm text-brand-text-muted">
                {product.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={adding || product.status === 'out_of_stock'}
              className="flex-1 rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('add_to_cart')}
            </button>
            {/* "Jetzt kaufen" per spec goes straight to checkout - Sprint 4, so disabled for now. */}
            <button
              type="button"
              disabled
              title={t('cart_checkout_soon')}
              className="flex-1 rounded border border-brand-text px-6 py-3 text-xs uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('buy_now')}
            </button>
            <button
              type="button"
              onClick={handleToggleWishlist}
              aria-pressed={wishlisted}
              title={t('add_to_wishlist')}
              className={`rounded border border-brand-border px-4 ${wishlisted ? 'text-brand-sale' : 'text-brand-text-muted'}`}
            >
              {wishlisted ? '♥' : '♡'}
            </button>
          </div>
        </div>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">{t('product_reviews_title')}</h2>
        {reviews.length === 0 ? (
          <p className="text-brand-text-muted">{t('product_reviews_empty')}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {reviews.map((review) => (
              <li key={review.id} className="rounded border border-brand-border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{review.userName}</span>
                  <span aria-hidden>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-brand-text-muted">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        {/* No review form yet - see Sprint 3 decision in docs/backlog.md: writing is gated on
            having bought the product, which needs Sprint 4's orders to check against. */}
        <p className="mt-4 text-xs text-brand-text-muted">{t('product_reviews_write_soon')}</p>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold">{t('product_recently_viewed_title')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky add-to-cart bar per spec: stays visible even when scrolled down to reviews. */}
      <div className="fixed inset-x-0 bottom-0 border-t border-brand-border bg-brand-surface p-3 sm:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-3">
          <span className="flex-1 truncate text-sm font-medium">{product.name}</span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={adding || product.status === 'out_of_stock'}
            className="rounded bg-brand-text px-6 py-2 text-xs uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('add_to_cart')}
          </button>
        </div>
      </div>
    </div>
  )
}
