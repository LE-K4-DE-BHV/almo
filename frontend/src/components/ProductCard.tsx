import { useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { Product } from '../api/catalog'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { useWishlist } from '../wishlist/useWishlist'

const STOCK_STYLES: Record<Product['status'], string> = {
  in_stock: 'text-brand-text-muted',
  low_stock: 'text-brand-sale',
  out_of_stock: 'text-brand-text-muted line-through',
}

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function ProductCard({ product }: { product: Product }) {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { addItem } = useCart()
  const { isWishlisted, toggle } = useWishlist()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const image = product.imageRefs[0]
  const wishlisted = isWishlisted(product.id)

  async function handleAddToCart(e: MouseEvent) {
    e.preventDefault() // stay on the shop grid, don't follow the card's own link to the product page
    setAdding(true)
    try {
      await addItem(product.id, 1)
    } finally {
      setAdding(false)
    }
  }

  function handleToggleWishlist(e: MouseEvent) {
    e.preventDefault()
    if (!user) {
      navigate('/login')
      return
    }
    toggle(product.id)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded border border-brand-border bg-brand-surface">
      <Link to={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-brand-bg">
        {image && (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        )}
        {product.badge && (
          <span className="absolute left-2 top-2 rounded bg-brand-text px-2 py-0.5 text-xs uppercase tracking-wide text-white">
            {product.badge}
          </span>
        )}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-pressed={wishlisted}
          title={t('add_to_wishlist')}
          className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface shadow ${wishlisted ? 'text-brand-sale' : 'text-brand-text-muted'}`}
        >
          {wishlisted ? '♥' : '♡'}
        </button>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={adding || product.status === 'out_of_stock'}
          title={t('add_to_cart')}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-surface text-brand-text-muted shadow disabled:cursor-not-allowed disabled:opacity-50"
        >
          🛍
        </button>
      </Link>

      <Link to={`/products/${product.id}`} className="flex flex-1 flex-col gap-1 p-3">
        <span className="text-xs uppercase tracking-wide text-brand-text-muted">
          {product.categoryName}
        </span>
        <h3 className="text-sm font-medium">{product.name}</h3>

        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-semibold">{formatPrice(product.price, i18n.language)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-brand-text-muted line-through">
              {formatPrice(product.compareAtPrice, i18n.language)}
            </span>
          )}
        </div>

        <span className={`text-xs ${STOCK_STYLES[product.status]}`}>
          {t(`stock_${product.status}`)}
        </span>
      </Link>
    </article>
  )
}
