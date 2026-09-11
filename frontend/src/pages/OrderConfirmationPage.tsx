import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import * as ordersApi from '../api/orders'
import type { OrderDetail } from '../api/orders'
import { useAuth } from '../auth/useAuth'

export function OrderConfirmationPage() {
  const { id } = useParams()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderDetail | null>(null)

  useEffect(() => {
    ordersApi.fetchOrder(Number(id)).then(setOrder)
  }, [id])

  if (!order) return null

  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="mb-4 text-2xl font-semibold">{t('order_success_title')}</h1>
      <p className="mb-8 text-brand-text-muted">
        {t('order_success_text', { name: user?.name, orderNumber: order.orderNumber })}
      </p>
      <div className="flex flex-col items-center gap-3">
        {/* Plain download link, not apiFetch - the browser handles the file download via the
            Content-Disposition header the backend sets (see OrderController.pdf). */}
        <a
          href={ordersApi.orderPdfUrl(order.id)}
          className="rounded bg-brand-text px-6 py-3 text-xs uppercase tracking-wide text-white hover:bg-black"
        >
          {t('order_view_pdf')}
        </a>
        <Link to="/shop" className="text-xs uppercase tracking-wide text-brand-text-muted underline">
          {t('order_back_to_shop')}
        </Link>
      </div>
    </div>
  )
}
