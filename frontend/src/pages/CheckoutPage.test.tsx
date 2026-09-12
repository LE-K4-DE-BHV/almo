import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import i18n from '../i18n'
import { CheckoutPage } from './CheckoutPage'
import { AuthProvider } from '../auth/AuthProvider'
import { CartProvider } from '../cart/CartProvider'
import * as authApi from '../api/auth'
import * as cartApi from '../api/cart'
import * as ordersApi from '../api/orders'
import type { Cart } from '../api/cart'
import type { OrderDetail } from '../api/orders'

vi.mock('../api/auth')
vi.mock('../api/cart')
vi.mock('../api/orders')

const LOGGED_IN_USER = { id: 1, email: 'a@example.com', name: 'Ada', role: 'CUSTOMER' as const }

const CART_WITH_ITEMS: Cart = {
  items: [
    {
      id: 1,
      productId: 10,
      name: 'Ring Aurelia',
      imageRef: null,
      price: 16.5,
      quantity: 1,
      lineTotal: 16.5,
      status: 'in_stock',
    },
  ],
  subtotal: 16.5,
  totalQuantity: 1,
}

/**
 * Mirrors the actual route tree just enough to observe navigation - CheckoutPage redirects to
 * /cart, /login, or /order-confirmation/:id depending on auth/cart state and checkout success
 * (see the component's own guard comments), so tests need real destinations to land on.
 */
function renderCheckoutPage() {
  render(
    <MemoryRouter initialEntries={['/checkout']}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cart" element={<p>cart page</p>} />
            <Route path="/login" element={<p>login page</p>} />
            <Route path="/order-confirmation/:id" element={<p>order confirmed</p>} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('CheckoutPage', () => {
  beforeEach(async () => {
    vi.resetAllMocks()
    // Pin the language so label/button text assertions don't depend on jsdom's detected
    // navigator.language (see src/i18n/index.ts's LanguageDetector).
    await i18n.changeLanguage('en')
  })

  it('redirects to /cart when the cart is empty', async () => {
    vi.mocked(authApi.me).mockResolvedValue(LOGGED_IN_USER)
    vi.mocked(cartApi.fetchCart).mockResolvedValue({ items: [], subtotal: 0, totalQuantity: 0 })

    renderCheckoutPage()

    await waitFor(() => expect(screen.getByText('cart page')).toBeInTheDocument())
  })

  it('submits the form and navigates to the order confirmation page', async () => {
    const user = userEvent.setup()
    vi.mocked(authApi.me).mockResolvedValue(LOGGED_IN_USER)
    vi.mocked(cartApi.fetchCart).mockResolvedValue(CART_WITH_ITEMS)
    const placedOrder: OrderDetail = {
      id: 42,
      orderNumber: 'ALM-000042',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      total: 16.5,
      contactPreference: 'EMAIL',
      shippingName: 'Ada',
      shippingAddress: 'Teststr. 1',
      shippingCity: 'Berlin',
      shippingCost: 0,
      items: [],
      itemsTotal: 16.5,
    }
    vi.mocked(ordersApi.checkout).mockResolvedValue(placedOrder)
    // The order-placed flow calls refreshCart() right after checkout (see CheckoutPage) -
    // simulate the backend having cleared the cart, matching the real request sequence.
    vi.mocked(cartApi.fetchCart).mockResolvedValueOnce(CART_WITH_ITEMS).mockResolvedValue({
      items: [],
      subtotal: 0,
      totalQuantity: 0,
    })

    renderCheckoutPage()

    await waitFor(() => expect(screen.getByLabelText('Name')).toBeInTheDocument())
    await user.type(screen.getByLabelText('Name'), 'Ada Lovelace')
    await user.type(screen.getByLabelText('Address'), 'Teststr. 1')
    await user.type(screen.getByLabelText('City'), 'Berlin')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Place order' }))
    })

    await waitFor(() => expect(screen.getByText('order confirmed')).toBeInTheDocument())
    expect(ordersApi.checkout).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      address: 'Teststr. 1',
      city: 'Berlin',
      contactPreference: 'WHATSAPP',
    })
  })
})
