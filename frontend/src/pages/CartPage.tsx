import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useCart } from '../cart/useCart'
import { useAuth } from '../auth/useAuth'

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

export function CartPage() {
  const { t, i18n } = useTranslation()
  const { cart, loading, updateItem, removeItem } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  function handleCheckout() {
    // Checkout itself requires login (see backend CheckoutController - falls under the default
    // "anyRequest().authenticated()" rule) - send an anonymous cart owner to log in first rather
    // than letting them hit checkout and bounce off a 401.
    navigate(user ? '/checkout' : '/login')
  }

  // `cart` starts as EMPTY_CART (see CartProvider) until the mount-time GET /api/cart resolves -
  // every navigation to this page via page.goto()/a fresh document load (not just React Router's
  // client-side routing) remounts CartProvider from scratch. Without this guard, a real,
  // non-empty cart would flash the "empty" view for as long as that fetch takes before correcting
  // itself, which is only a cosmetic flicker most of the time but is wrong regardless of duration.
  if (loading) return null

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="mb-4 text-2xl font-semibold">{t('cart_title')}</h1>
        <p className="mb-6 text-brand-text-muted">{t('cart_empty')}</p>
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
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{t('cart_title')}</h1>

      <div className="flex flex-col gap-4">
        {cart.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center gap-4 rounded border border-brand-border p-4"
          >
            {item.imageRef && (
              <img src={item.imageRef} alt={item.name} className="h-20 w-20 rounded object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-brand-text-muted">{formatPrice(item.price, i18n.language)}</p>
            </div>

            {/* Its own flex-wrap group, not just more siblings in the row above - on a narrow
                viewport this wraps as a unit onto its own line instead of the three items each
                wrapping independently and landing on top of each other (see Sprint 6 mobile
                Playwright run in docs/backlog.md, which is what caught this). */}
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                {t('cart_quantity')}
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => {
                    const qty = Number(e.target.value)
                    if (qty >= 1) updateItem(item.id, qty)
                  }}
                  className="w-16 rounded border border-brand-border px-2 py-1"
                />
              </label>

              <p className="w-24 text-right font-semibold">
                {formatPrice(item.lineTotal, i18n.language)}
              </p>

              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-xs uppercase tracking-wide text-brand-text-muted underline hover:text-brand-sale"
              >
                {t('cart_remove')}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-3">
        <div className="flex items-center gap-4 text-lg font-semibold">
          <span>{t('cart_subtotal')}</span>
          <span>{formatPrice(cart.subtotal, i18n.language)}</span>
        </div>
        <button
          type="button"
          onClick={handleCheckout}
          className="rounded bg-brand-text px-8 py-3 text-xs uppercase tracking-wide text-white hover:bg-black"
        >
          {t('cart_checkout')}
        </button>
        <Link to="/shop" className="text-xs uppercase tracking-wide text-brand-text-muted underline">
          {t('cart_continue_shopping')}
        </Link>
      </div>
    </div>
  )
}
