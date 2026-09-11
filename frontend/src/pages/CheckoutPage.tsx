import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { useCart } from '../cart/useCart'
import * as ordersApi from '../api/orders'
import type { ContactPreference } from '../api/orders'
import { ApiError } from '../api/client'

const FREE_SHIPPING_THRESHOLD = 30
const FLAT_SHIPPING_COST = 3.9

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

/**
 * Requires login (redirects to /login below) rather than being wrapped in <RequireAuth> like
 * /account - this page also needs to redirect to /cart when the cart is empty, which RequireAuth
 * doesn't handle, so both checks live here together instead of splitting the guard logic.
 */
export function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const { cart, loading: cartLoading, refresh: refreshCart } = useCart()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [contactPreference, setContactPreference] = useState<ContactPreference>('WHATSAPP')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Flips true the moment checkout succeeds, before refreshCart() empties the cart - without it,
  // that empty-out re-renders this component with cart.items.length === 0 and the guard below
  // fires <Navigate to="/cart">, racing (and winning) against the navigate() call further down
  // in handleSubmit. Hit this in practice, not just in theory: checkout worked but the user
  // landed back on an empty cart page instead of the confirmation page.
  const [orderPlaced, setOrderPlaced] = useState(false)

  // Both AuthProvider and CartProvider fetch their state async on mount (see AuthProvider,
  // CartProvider) - on a hard navigation straight to /checkout, `user`/`cart` still hold their
  // initial empty values for a moment. Redirecting on that stale state would bounce a logged-in
  // user with a full cart straight back out, so wait for both loads to finish first.
  if (authLoading || cartLoading) return null
  if (!user) return <Navigate to="/login" replace />
  if (cart.items.length === 0 && !orderPlaced) return <Navigate to="/cart" replace />

  // Client-side estimate only, shown before submitting - the backend recomputes this from the
  // authoritative server-side cart at checkout time (see OrderService.checkout) and that number
  // is what actually gets charged/recorded, not this one.
  const estimatedShipping = cart.subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const order = await ordersApi.checkout({ name, address, city, contactPreference })
      setOrderPlaced(true)
      await refreshCart() // now empty - backend cleared it as part of the checkout transaction
      navigate(`/order-confirmation/${order.id}`)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Checkout failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-8 px-6 py-10 sm:grid-cols-2">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{t('checkout_title')}</h1>
        {error && <p role="alert">{error}</p>}

        <label className="flex flex-col gap-1 text-sm">
          {t('checkout_name')}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('checkout_address')}
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t('checkout_city')}
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="rounded border border-brand-border px-3 py-2"
          />
        </label>

        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1">{t('checkout_contact_preference')}</legend>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="contactPreference"
              checked={contactPreference === 'WHATSAPP'}
              onChange={() => setContactPreference('WHATSAPP')}
            />
            {t('checkout_contact_whatsapp')}
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="contactPreference"
              checked={contactPreference === 'EMAIL'}
              onChange={() => setContactPreference('EMAIL')}
            />
            {t('checkout_contact_email')}
          </label>
        </fieldset>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black disabled:opacity-50"
        >
          {t('checkout_submit')}
        </button>
      </form>

      <div className="h-fit rounded border border-brand-border p-4">
        <h2 className="mb-3 font-semibold">{t('checkout_summary_title')}</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>
                {item.quantity}× {item.name}
              </span>
              <span>{formatPrice(item.lineTotal, i18n.language)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-brand-border pt-3 text-sm">
          <span>{t('cart_subtotal')}</span>
          <span>{formatPrice(cart.subtotal, i18n.language)}</span>
        </div>
        <div className="flex justify-between text-sm text-brand-text-muted">
          <span>{t('checkout_shipping')}</span>
          <span>{formatPrice(estimatedShipping, i18n.language)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-brand-border pt-2 font-semibold">
          <span>{t('checkout_total')}</span>
          <span>{formatPrice(cart.subtotal + estimatedShipping, i18n.language)}</span>
        </div>
        <p className="mt-2 text-xs text-brand-text-muted">{t('checkout_free_shipping_hint')}</p>
      </div>
    </div>
  )
}
