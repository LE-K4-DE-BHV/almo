import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import { useWishlist } from '../wishlist/useWishlist'

const LANGUAGES = ['de', 'en', 'fr'] as const

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function Header() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { cart } = useCart()
  const { items: wishlistItems } = useWishlist()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [cartOpen, setCartOpen] = useState(false)

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    const trimmed = searchTerm.trim()
    navigate(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : '/shop')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-brand-border bg-brand-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-4">
        <Link to="/" className="text-xl font-semibold tracking-wide">
          {t('app_title')}
        </Link>

        <nav className="flex gap-4 text-sm uppercase tracking-wide">
          <Link to="/" className="hover:text-brand-accent">
            {t('nav_home')}
          </Link>
          <Link to="/shop" className="hover:text-brand-accent">
            {t('nav_shop')}
          </Link>
        </nav>

        <form onSubmit={handleSearch} className="ml-auto min-w-40 flex-1 max-w-sm">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full rounded border border-brand-border bg-brand-bg px-3 py-1.5 text-sm outline-none focus:border-brand-accent"
          />
        </form>

        <div className="flex items-center gap-3 text-sm">
          <Link
            to="/wishlist"
            className="relative hover:text-brand-accent"
            title={t('nav_wishlist')}
          >
            ♡
            {wishlistItems.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] text-white">
                {wishlistItems.length}
              </span>
            )}
          </Link>

          {/* Mini-cart flyout: click toggles, matches the spec's "Mini-Warenkorb-Flyout ohne
              Seitenwechsel" - a hover-only flyout wouldn't work on touch devices. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCartOpen((open) => !open)}
              className="relative hover:text-brand-accent"
              title={t('nav_cart')}
            >
              🛍
              {cart.totalQuantity > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] text-white">
                  {cart.totalQuantity}
                </span>
              )}
            </button>

            {cartOpen && (
              <>
                {/* Backdrop closes the flyout on outside click without a heavier click-outside hook. */}
                <button
                  type="button"
                  aria-label="Close"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setCartOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-72 rounded border border-brand-border bg-brand-surface p-4 shadow-lg">
                  {cart.items.length === 0 ? (
                    <p className="text-sm text-brand-text-muted">{t('cart_empty')}</p>
                  ) : (
                    <>
                      <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto">
                        {cart.items.map((item) => (
                          <li key={item.id} className="flex items-center gap-2 text-sm">
                            {item.imageRef && (
                              <img
                                src={item.imageRef}
                                alt={item.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                            )}
                            <span className="flex-1">{item.name}</span>
                            <span className="text-brand-text-muted">
                              {item.quantity}× {formatPrice(item.price, i18n.language)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3 text-sm font-semibold">
                        <span>{t('cart_subtotal')}</span>
                        <span>{formatPrice(cart.subtotal, i18n.language)}</span>
                      </div>
                    </>
                  )}
                  <Link
                    to="/cart"
                    onClick={() => setCartOpen(false)}
                    className="mt-3 block rounded bg-brand-text px-3 py-2 text-center text-xs uppercase tracking-wide text-white hover:bg-black"
                  >
                    {t('nav_cart')}
                  </Link>
                </div>
              </>
            )}
          </div>

          <Link to={user ? '/account' : '/login'} className="hover:text-brand-accent">
            {user ? user.name : t('nav_login')}
          </Link>

          <div className="flex gap-1 border-l border-brand-border pl-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => i18n.changeLanguage(lang)}
                aria-current={i18n.language === lang}
                className={
                  i18n.language === lang
                    ? 'font-semibold text-brand-accent'
                    : 'text-brand-text-muted hover:text-brand-text'
                }
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
