import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/useAuth'
import * as authApi from '../api/auth'
import * as ordersApi from '../api/orders'
import type { OrderSummary } from '../api/orders'
import { ApiError } from '../api/client'

function formatPrice(value: number, lang: string) {
  return new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDate(iso: string, lang: string) {
  return new Intl.DateTimeFormat(lang, { dateStyle: 'medium' }).format(new Date(iso))
}

export function AccountPage() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    ordersApi.fetchOrders().then(setOrders)
  }, [])

  if (!user) return null // RequireAuth (see AppRouter) already redirects before this renders

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleDeleteAccount() {
    if (!window.confirm(t('account_delete_confirm'))) return
    setDeleteError(null)
    setDeleting(true)
    try {
      await authApi.deleteAccount()
      navigate('/')
    } catch (e) {
      // 409 (has orders) is the one realistic failure here - see AccountHasOrdersException on
      // the backend - shown as-is rather than the generic apiFetch message.
      setDeleteError(
        e instanceof ApiError ? t('account_delete_blocked') : t('account_delete_error_generic'),
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold">{t('account_title')}</h1>
      <p className="mb-8 text-brand-text-muted">
        {user.name} ({user.email})
      </p>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">{t('account_orders_title')}</h2>
        {orders.length === 0 ? (
          <p className="text-brand-text-muted">{t('account_no_orders')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between rounded border border-brand-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-brand-text-muted">
                    {formatDate(order.createdAt, i18n.language)} ·{' '}
                    {t(`order_status_${order.status}`)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatPrice(order.total, i18n.language)}</span>
                  <a
                    href={ordersApi.orderPdfUrl(order.id)}
                    className="text-xs uppercase tracking-wide text-brand-accent underline"
                  >
                    {t('account_order_pdf')}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded border border-brand-border px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-bg"
      >
        {t('account_logout')}
      </button>

      <section className="mt-12 border-t border-brand-border pt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-sale">
          {t('account_delete_title')}
        </h2>
        {deleteError && <p className="mb-2 text-sm text-brand-sale">{deleteError}</p>}
        <button
          type="button"
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="rounded border border-brand-sale px-4 py-2 text-xs uppercase tracking-wide text-brand-sale hover:bg-brand-sale hover:text-white disabled:opacity-50"
        >
          {t('account_delete_button')}
        </button>
      </section>
    </div>
  )
}
