import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import {
  fetchProduct,
  fetchProductsByIds,
  type ProductDetail,
  type Product,
} from '../api/catalog'
import { fetchReviews, submitReview, type Review } from '../api/reviews'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { useWishlist } from '../wishlist/useWishlist'
import { ProductCard } from '../components/ProductCard'
import { HeartIcon } from '../components/icons'
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
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    setProduct(null)
    setActiveImage(0)
    setReviewRating(5)
    setReviewComment('')
    setReviewError(null)
    setReviewSubmitted(false)
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

  async function handleBuyNow() {
    if (!user) {
      navigate('/login')
      return
    }
    setAdding(true)
    try {
      await addItem(productId, 1)
      navigate('/checkout')
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

  async function handleSubmitReview(e: FormEvent) {
    e.preventDefault()
    setReviewError(null)
    setReviewSubmitting(true)
    try {
      const review = await submitReview(productId, reviewRating, reviewComment)
      setReviews((prev) => [review, ...prev])
      setReviewSubmitted(true)
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : t('product_reviews_form_error_generic'))
    } finally {
      setReviewSubmitting(false)
    }
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
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={adding || product.status === 'out_of_stock'}
              className="flex-1 rounded border border-brand-text px-6 py-3 text-xs uppercase tracking-wide hover:bg-brand-text hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
              <HeartIcon filled={wishlisted} />
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
        {user ? (
          reviewSubmitted ? (
            <p className="mt-6 text-sm text-brand-text-muted">{t('product_reviews_form_thanks')}</p>
          ) : (
            <form onSubmit={handleSubmitReview} className="mt-6 flex max-w-md flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide">
                {t('product_reviews_form_title')}
              </h3>
              <label className="flex flex-col gap-1 text-sm">
                {t('product_reviews_form_rating')}
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-32 rounded border border-brand-border px-2 py-1.5 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {'★'.repeat(value)}
                      {'☆'.repeat(5 - value)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t('product_reviews_form_comment')}
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="rounded border border-brand-border px-3 py-2 text-sm"
                />
              </label>
              {reviewError && (
                <p role="alert" className="text-sm text-brand-sale">
                  {reviewError}
                </p>
              )}
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="self-start rounded bg-brand-text px-6 py-2 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
              >
                {reviewSubmitting
                  ? t('product_reviews_form_submitting')
                  : t('product_reviews_form_submit')}
              </button>
            </form>
          )
        ) : (
          <p className="mt-6 text-sm text-brand-text-muted">
            <Link to="/login" className="underline hover:text-brand-text">
              {t('nav_login')}
            </Link>{' '}
            {t('product_reviews_login_hint')}
          </p>
        )}
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
